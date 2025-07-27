# RLS Implementation and Testing Guide

## Overview

This guide provides comprehensive instructions for implementing, testing, and maintaining Row Level Security (RLS) policies in the Hospital Patient Management System.

## Table of Contents

1. [RLS Architecture](#rls-architecture)
2. [Implementation Process](#implementation-process)
3. [Testing Procedures](#testing-procedures)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)
6. [Maintenance](#maintenance)

## RLS Architecture

### Core Components

1. **User Roles** (`user_role` enum)
   - `admin`: Full system access
   - `manager`: Department oversight
   - `bd`: Business development
   - `cs`: Customer service

2. **Helper Functions**
   - `auth.has_role(role)`: Check if current user has specific role
   - `auth.has_any_role(roles[])`: Check if user has any of specified roles
   - `auth.current_user_role()`: Get current user's role

3. **Policy Structure**
   ```sql
   CREATE POLICY "policy_name" ON table_name
     FOR operation
     USING (condition_for_existing_rows)
     WITH CHECK (condition_for_new_rows);
   ```

## Implementation Process

### Step 1: Enable RLS on Table

```sql
-- Always enable RLS when creating a table
CREATE TABLE sensitive_data (...);
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
```

### Step 2: Define Access Requirements

Create a matrix of who can do what:

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Define for each role... |

### Step 3: Create Policies

#### Basic Policy Template

```sql
-- SELECT Policy
CREATE POLICY "role_can_view_resource" ON table_name
  FOR SELECT
  USING (
    auth.has_role('role_name'::user_role)
    AND additional_conditions
  );

-- INSERT Policy
CREATE POLICY "role_can_create_resource" ON table_name
  FOR INSERT
  WITH CHECK (
    auth.has_role('role_name'::user_role)
    AND created_by = auth.uid()
  );

-- UPDATE Policy with Field Restrictions
CREATE POLICY "role_can_update_resource" ON table_name
  FOR UPDATE
  USING (auth.has_role('role_name'::user_role))
  WITH CHECK (
    -- Prevent changing protected fields
    OLD.protected_field = NEW.protected_field
    AND OLD.another_field = NEW.another_field
  );
```

#### Complex Policy Examples

```sql
-- Policy with relationship checks
CREATE POLICY "cs_can_view_assigned_patients" ON patients
  FOR SELECT
  USING (
    auth.has_role('cs'::user_role)
    AND cs_manager = auth.uid()
  );

-- Policy with time-based restrictions
CREATE POLICY "can_update_recent_records" ON records
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Policy with nested relationship checks
CREATE POLICY "view_records_through_patient_access" ON medical_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medical_records.patient_id
      AND (
        p.created_by = auth.uid()
        OR p.cs_manager = auth.uid()
        OR auth.has_any_role(ARRAY['admin', 'manager']::user_role[])
      )
    )
  );
```

### Step 4: Grant Permissions

```sql
-- Grant table-level permissions
GRANT SELECT, INSERT, UPDATE ON table_name TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION function_name TO authenticated;

-- Revoke dangerous permissions
REVOKE DELETE ON table_name FROM authenticated;
GRANT DELETE ON table_name TO service_role;
```

## Testing Procedures

### 1. Unit Testing Individual Policies

```sql
-- Test as specific user
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid", "role": "authenticated"}'::json;

-- Test SELECT access
SELECT COUNT(*) FROM table_name; -- Should return only allowed rows

-- Test INSERT
INSERT INTO table_name (...) VALUES (...); -- Should succeed/fail based on policy

-- Test UPDATE
UPDATE table_name SET field = value WHERE id = 'some-id'; -- Check restrictions

-- Test DELETE
DELETE FROM table_name WHERE id = 'some-id'; -- Usually should fail except admin
```

### 2. Integration Testing

Run the comprehensive test suite:

```bash
# Run RLS tests
psql -f supabase/tests/test_rls_policies.sql

# Expected output: All tests should show PASSED
```

### 3. Cross-Role Testing

Test that users cannot access other users' data:

```sql
-- Create two BD users
INSERT INTO profiles (id, role, name) VALUES
  ('bd1-uuid', 'bd', 'BD User 1'),
  ('bd2-uuid', 'bd', 'BD User 2');

-- Create patient as BD1
SET LOCAL request.jwt.claims TO '{"sub": "bd1-uuid"}'::json;
INSERT INTO patients (name, created_by) VALUES ('Patient 1', 'bd1-uuid');

-- Try to access as BD2 (should fail)
SET LOCAL request.jwt.claims TO '{"sub": "bd2-uuid"}'::json;
SELECT * FROM patients; -- Should not see Patient 1
```

### 4. Anonymous Access Testing

```sql
-- Test as anonymous user
SET LOCAL role TO 'anon';
SET LOCAL request.jwt.claims TO '{}'::json;

-- Most operations should fail
SELECT * FROM profiles; -- Should fail
SELECT * FROM patients; -- Should fail

-- Except specifically allowed operations
SELECT * FROM survey_tokens WHERE token = 'valid-token'; -- May work with restrictions
```

### 5. Validation Functions

Use built-in validation:

```sql
-- Check all RLS policies are in place
SELECT * FROM validate_rls_policies();

-- Test specific user access
SELECT * FROM test_user_access('user-uuid', 'patients');
```

## Troubleshooting

### Common Issues

#### 1. "Permission denied" errors

**Symptom**: Users cannot access data they should be able to see

**Diagnosis**:
```sql
-- Check user role
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List policies for table
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**Solution**:
- Verify user has correct role in profiles table
- Check policy conditions match expectations
- Ensure GRANT permissions are set

#### 2. Data leakage (seeing too much data)

**Symptom**: Users can see data they shouldn't

**Diagnosis**:
```sql
-- Check policy conditions
\d+ table_name  -- Shows all policies

-- Test policy isolation
SET LOCAL request.jwt.claims TO '{"sub": "test-user"}'::json;
SELECT * FROM table_name;
```

**Solution**:
- Make policy conditions more restrictive
- Add additional WHERE clauses
- Check for missing policies on related tables

#### 3. Cannot insert/update data

**Symptom**: Valid operations are blocked

**Diagnosis**:
```sql
-- Check WITH CHECK conditions
SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'table_name';
```

**Solution**:
- Verify WITH CHECK conditions
- Ensure user is setting correct fields (like created_by)
- Check for field-level restrictions

### Debug Mode

Enable detailed logging:

```sql
-- Set log level for RLS debugging
SET log_error_verbosity TO verbose;
SET log_statement TO 'all';

-- Run problematic query
SELECT * FROM patients WHERE id = 'some-id';

-- Check logs for detailed error
```

## Best Practices

### 1. Security First

- **Default Deny**: Start with no access, then add specific permissions
- **Least Privilege**: Give minimum required access
- **Fail Securely**: Errors should not reveal sensitive information

### 2. Performance Optimization

```sql
-- Use indexes for policy conditions
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patients_cs_manager ON patients(cs_manager);

-- Use EXISTS instead of IN for better performance
-- Good:
USING (EXISTS (SELECT 1 FROM related WHERE condition))

-- Avoid:
USING (id IN (SELECT id FROM related WHERE condition))
```

### 3. Policy Naming Conventions

```sql
-- Format: "role_action_resource_condition"
CREATE POLICY "admin_delete_all_patients" ...
CREATE POLICY "bd_view_own_patients" ...
CREATE POLICY "cs_update_assigned_appointments" ...
```

### 4. Documentation

Always document policies:

```sql
COMMENT ON POLICY "policy_name" ON table_name IS 
'Allows BD users to view only patients they created. Required for lead management.';
```

### 5. Testing Checklist

- [ ] Test each role can access appropriate data
- [ ] Test each role cannot access inappropriate data
- [ ] Test field-level restrictions work
- [ ] Test time-based restrictions
- [ ] Test anonymous access is blocked
- [ ] Test cross-role isolation
- [ ] Run automated test suite
- [ ] Test with production-like data volumes

## Maintenance

### Regular Audits

1. **Monthly RLS Review**
   ```sql
   -- Check for tables without RLS
   SELECT tablename 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = false;
   
   -- Review policy effectiveness
   SELECT * FROM validate_rls_policies();
   ```

2. **Access Pattern Analysis**
   ```sql
   -- Review audit logs for unusual access
   SELECT user_id, action, COUNT(*) 
   FROM audit_logs 
   WHERE created_at > NOW() - INTERVAL '30 days'
   GROUP BY user_id, action
   ORDER BY COUNT(*) DESC;
   ```

3. **Performance Monitoring**
   ```sql
   -- Check slow queries that might be RLS-related
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   WHERE query LIKE '%FROM patients%'
   ORDER BY mean_exec_time DESC;
   ```

### Update Procedures

When modifying RLS policies:

1. **Test in Development**
   - Apply changes to dev environment
   - Run full test suite
   - Verify no regressions

2. **Staged Rollout**
   ```sql
   BEGIN;
   -- Make changes
   DROP POLICY IF EXISTS "old_policy" ON table_name;
   CREATE POLICY "new_policy" ON table_name ...;
   
   -- Test
   SET LOCAL request.jwt.claims TO '{"sub": "test-user"}'::json;
   SELECT * FROM table_name; -- Verify results
   
   -- Commit or rollback
   COMMIT; -- or ROLLBACK;
   ```

3. **Monitor After Deployment**
   - Check error logs
   - Monitor user complaints
   - Review audit logs

### Emergency Procedures

If RLS is blocking critical operations:

```sql
-- EMERGENCY ONLY: Temporarily disable RLS
-- Requires superuser access
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Fix the issue
-- ...

-- Re-enable immediately
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Log the incident
INSERT INTO audit_logs (action, details) 
VALUES ('emergency_rls_disable', 'reason and duration');
```

## Conclusion

RLS is a critical security feature for healthcare applications. Proper implementation and testing ensures:

- Patient data privacy
- HIPAA compliance
- Role-based access control
- Audit trail integrity

Always prioritize security over convenience, and thoroughly test all changes before deployment.