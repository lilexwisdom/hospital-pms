# Patient Data Encryption Implementation

## Overview

This document describes the implementation of patient data management with encryption for sensitive information, specifically Korean Social Security Numbers (주민등록번호).

## Security Architecture

### 1. Encryption Strategy

#### Technologies Used
- **PostgreSQL pgcrypto**: Industry-standard encryption extension
- **AES Encryption**: Symmetric encryption for SSN data
- **SHA-256 Hashing**: One-way hash for SSN lookups
- **Row Level Security (RLS)**: Fine-grained access control

#### Key Components
1. **Encrypted Storage**: SSNs are encrypted at rest using `pgp_sym_encrypt`
2. **Hash Index**: SHA-256 hash allows searching without decryption
3. **Access Control**: Role-based decryption permissions
4. **Audit Trail**: Optional logging of SSN access

### 2. Database Schema

#### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  encrypted_ssn BYTEA NOT NULL,      -- Encrypted SSN
  ssn_hash TEXT NOT NULL,            -- SHA-256 hash for lookups
  phone VARCHAR(20),
  email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  address JSONB,
  emergency_contact JSONB,
  created_by UUID,                   -- BD who created
  cs_manager UUID,                   -- CS manager assigned
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Medical Records Table
```sql
CREATE TABLE medical_records (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  record_type VARCHAR(50),
  record_date DATE,
  title VARCHAR(200),
  description TEXT,
  metadata JSONB,
  attachments JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 3. Encryption Functions

#### encrypt_ssn(ssn TEXT)
- Encrypts SSN using stored encryption key
- Returns BYTEA encrypted data
- Used during patient creation

#### decrypt_ssn(encrypted_ssn BYTEA)
- Decrypts SSN with permission check
- Only admin/manager roles can decrypt
- Throws error for unauthorized access

#### hash_ssn(ssn TEXT)
- Creates SHA-256 hash of SSN
- Used for unique constraint and lookups
- One-way function (cannot reverse)

#### mask_ssn(ssn TEXT)
- Returns masked format: ***-**-1234
- Shows only last 4 digits
- Safe for display purposes

### 4. Security Policies

#### Role-Based Access
- **Admin**: Full access to all data, can decrypt SSN
- **Manager**: Can view all patients, can decrypt SSN
- **BD**: Can create patients, view created patients
- **CS**: Can view/update assigned patients, cannot decrypt SSN

#### Row Level Security (RLS)
```sql
-- Example: BD can only see patients they created
CREATE POLICY "BD can view own patients" ON patients
  FOR SELECT
  USING (created_by = auth.uid());
```

### 5. Implementation Usage

#### Creating a Patient (TypeScript)
```typescript
const patientService = new PatientService();

const newPatient = await patientService.createPatient({
  name: "홍길동",
  ssn: "901231-1234567",  // Will be encrypted
  phone: "010-1234-5678",
  email: "hong@example.com",
  date_of_birth: "1990-12-31",
  gender: "male",
  created_by: currentUser.id
});
```

#### Searching by SSN
```typescript
// Search uses hash comparison, no decryption needed
const patient = await patientService.findPatientBySSN("901231-1234567");
```

#### Displaying SSN
```typescript
// For regular users - shows masked SSN
const patientData = await patientService.getPatientWithMaskedSSN(patientId);
console.log(patientData.displaySSN); // "***-**-4567"

// For admin/manager - can decrypt full SSN
try {
  const fullSSN = await patientService.getDecryptedSSN(patientId);
  console.log(fullSSN); // "901231-1234567"
} catch (error) {
  console.error("권한이 없습니다");
}
```

## Security Best Practices

### 1. Key Management
- **Development**: Uses hardcoded key (MUST CHANGE)
- **Production**: Integrate with AWS KMS or similar
- **Rotation**: Implement key rotation strategy
- **Backup**: Secure key backup procedures

### 2. Access Logging
- Log all SSN decryption attempts
- Monitor for unusual access patterns
- Regular security audits
- Compliance reporting

### 3. Data Protection
- Encrypt data in transit (HTTPS/TLS)
- Encrypt data at rest (pgcrypto)
- Minimize SSN exposure
- Use masked display by default

### 4. Compliance Considerations
- Korean Personal Information Protection Act (PIPA)
- Healthcare data regulations
- Regular security assessments
- Data retention policies

## Migration Steps

### Local Development
```bash
# Apply migrations
npm run supabase:reset

# Generate TypeScript types
npm run supabase:types
```

### Production Deployment
1. **Update encryption key** in `encryption_keys` table
2. **Apply migrations** to production database
3. **Test encryption** with sample data
4. **Verify RLS policies** are working
5. **Enable audit logging** if required

## Testing Checklist

- [ ] Encryption functions work correctly
- [ ] SSN search by hash functions properly
- [ ] RLS policies enforce access control
- [ ] Decryption requires proper permissions
- [ ] Masked SSN displays correctly
- [ ] Performance with indexes is acceptable
- [ ] Key rotation process works
- [ ] Audit logging captures access

## Troubleshooting

### Common Issues

1. **"Encryption key not found"**
   - Check `encryption_keys` table has entry
   - Verify key_name matches function parameter

2. **"Insufficient permissions to decrypt SSN"**
   - User role must be admin or manager
   - Check user's profile role in database

3. **Duplicate SSN error**
   - SSN already exists (hash collision)
   - Check with `find_patient_by_ssn` function

4. **Performance issues**
   - Ensure indexes are created
   - Check query plans with EXPLAIN
   - Consider partitioning for large datasets

## Future Enhancements

1. **Multi-tenant encryption**: Separate keys per organization
2. **Field-level encryption**: Extend to other sensitive fields
3. **Audit dashboard**: Visual monitoring of access patterns
4. **Automated key rotation**: Scheduled key updates
5. **Compliance reports**: Automated PIPA compliance checking