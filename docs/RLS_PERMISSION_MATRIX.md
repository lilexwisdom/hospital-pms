# Row Level Security (RLS) Permission Matrix

## Overview

This document provides a comprehensive overview of the Row Level Security (RLS) implementation in the Hospital Patient Management System. All data access is controlled through PostgreSQL's RLS policies based on user roles.

## User Roles

| Role | Description | Primary Responsibilities |
|------|-------------|-------------------------|
| **admin** | System Administrator | Full system access, user management, audit reviews |
| **manager** | Department Manager | Oversee operations, view all data, manage staff |
| **bd** | Business Development | Create patients, generate survey tokens, manage leads |
| **cs** | Customer Service | Manage appointments, handle assigned patients |

## Permission Matrix by Table

### 1. Profiles Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All profiles | ✅ Yes | ✅ All profiles | ✅ Yes | Full access |
| **manager** | ✅ All profiles | ❌ No | ✅ Own profile only | ❌ No | Can view all, update own |
| **bd** | ✅ All profiles | ❌ No | ✅ Own profile only | ❌ No | Can view all, update own |
| **cs** | ✅ All profiles | ❌ No | ✅ Own profile only | ❌ No | Can view all, update own |
| **authenticated** | ✅ Own profile | ❌ No | ✅ Own profile only* | ❌ No | *Cannot change role |

### 2. Patients Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All patients | ✅ Yes | ✅ All patients | ✅ Yes | Full access |
| **manager** | ✅ All patients | ❌ No | ✅ All patients | ❌ No | Read all, update all |
| **bd** | ✅ Created patients | ✅ Yes | ✅ Created patients* | ❌ No | *Cannot modify SSN |
| **cs** | ✅ Assigned patients | ❌ No | ✅ Assigned patients* | ❌ No | *Limited fields only |

**Field-level restrictions:**
- BD cannot update: `encrypted_ssn`, `ssn_hash`
- CS cannot update: `encrypted_ssn`, `ssn_hash`, `created_by`

### 3. Medical Records Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All records | ✅ Yes | ✅ All records | ✅ Yes | Full access |
| **manager** | ✅ All records | ✅ Yes | ✅ Within 24hrs* | ❌ No | *Own records only |
| **bd** | ✅ For own patients | ❌ No | ❌ No | ❌ No | View only |
| **cs** | ✅ For assigned patients | ✅ Yes | ✅ Within 24hrs* | ❌ No | *Own records only |

### 4. Survey Tokens Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All tokens | ✅ Yes | ⚠️ System only | ❌ No | View all, create any |
| **manager** | ❌ No | ❌ No | ❌ No | ❌ No | No access |
| **bd** | ✅ Own tokens | ✅ Yes | ⚠️ System only | ❌ No | Own tokens only |
| **cs** | ❌ No | ❌ No | ❌ No | ❌ No | No access |
| **anonymous** | ✅ Token validation | ❌ No | ⚠️ System only | ❌ No | Via function only |

### 5. Survey Responses Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All responses | ✅ Yes | ✅ Yes | ✅ Yes | Full access |
| **manager** | ✅ All responses | ❌ No | ❌ No | ❌ No | View only |
| **bd** | ✅ From own tokens | ❌ No | ❌ No | ❌ No | View own only |
| **cs** | ✅ For assigned patients | ❌ No | ❌ No | ❌ No | View assigned only |
| **anonymous** | ❌ No | ✅ With valid token | ❌ No | ❌ No | Create only |

### 6. Appointments Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All appointments | ✅ Yes | ✅ All appointments | ✅ Yes | Full access |
| **manager** | ✅ All appointments | ✅ Yes | ✅ All appointments | ❌ No | Cannot delete |
| **bd** | ✅ For own patients | ❌ No | ❌ No | ❌ No | View only |
| **cs** | ✅ Created/Assigned | ✅ Yes | ✅ Created/Assigned* | ❌ No | *Cannot reassign |

### 7. Appointment Status History Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All history | ⚠️ Auto | ❌ No | ❌ No | View only, auto-created |
| **manager** | ✅ All history | ⚠️ Auto | ❌ No | ❌ No | View only, auto-created |
| **bd** | ✅ For own patients | ⚠️ Auto | ❌ No | ❌ No | View only, auto-created |
| **cs** | ✅ For accessible | ⚠️ Auto | ❌ No | ❌ No | View only, auto-created |

### 8. Encryption Keys Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **service_role** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Service role only |
| **All others** | ❌ No | ❌ No | ❌ No | ❌ No | No access |

### 9. Audit Logs Table

| Role | SELECT | INSERT | UPDATE | DELETE | Conditions |
|------|--------|--------|--------|--------|------------|
| **admin** | ✅ All logs | ⚠️ Auto | ❌ No | ❌ No | View only |
| **All others** | ❌ No | ⚠️ Auto | ❌ No | ❌ No | System creates only |

## Legend

- ✅ **Full Access**: Complete access with specified conditions
- ⚠️ **System/Auto**: Operation performed by system triggers or functions
- ❌ **No Access**: Operation not permitted
- **\*** Additional conditions apply (see notes)

## Special Functions and Permissions

### SSN Decryption
- **admin**: Can decrypt and view full SSN
- **manager**: Can decrypt and view full SSN
- **bd**: Cannot decrypt, sees masked SSN only
- **cs**: Cannot decrypt, sees masked SSN only

### Helper Functions
| Function | admin | manager | bd | cs | anonymous |
|----------|-------|---------|----|----|-----------|
| `auth.has_role()` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `auth.has_any_role()` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `auth.current_user_role()` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `decrypt_ssn()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `mask_ssn()` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `use_survey_token()` | ✅ | ✅ | ✅ | ✅ | ✅ |

## Security Principles

1. **Least Privilege**: Users only have access to data they need
2. **Role-Based Access**: Permissions tied to job functions
3. **Data Isolation**: BD users cannot see other BD's data
4. **Audit Trail**: Sensitive operations are logged
5. **Field-Level Security**: Some roles have restricted field access
6. **Time-Based Restrictions**: Some updates only allowed within time windows

## Testing RLS Policies

Use the provided testing functions:

```sql
-- Validate all RLS policies are in place
SELECT * FROM validate_rls_policies();

-- Test specific user access
SELECT * FROM test_user_access('user-uuid', 'patients');
```

## Compliance Notes

- **HIPAA**: Patient data access is restricted to authorized personnel only
- **Audit Trail**: All patient data modifications are logged
- **Encryption**: SSN and other sensitive data encrypted at rest
- **Access Control**: Role-based permissions prevent unauthorized access