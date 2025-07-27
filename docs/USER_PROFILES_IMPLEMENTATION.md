# User Profiles Implementation Documentation

## Overview

This document describes the implementation of user profiles and role management system for the Hospital Management System.

## Implementation Details

### 1. Database Schema

#### User Role Enum
```sql
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'bd', 'cs');
```

- **admin**: System administrators with full access
- **manager**: Hospital managers with department oversight
- **bd**: Business Development staff
- **cs**: Customer Service representatives

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 2. Automatic Profile Creation

A PostgreSQL trigger automatically creates a profile when a new user signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

- Default role for new users: `cs` (Customer Service)
- Profile name defaults to user's email if name not provided

### 3. Security Implementation

#### Row Level Security (RLS)
- All users can view profiles
- Users can only update their own profile
- Only admins can insert or delete profiles

#### Indexes for Performance
- `idx_profiles_role`: Index on role for filtering by user type
- `idx_profiles_department`: Partial index on department
- `idx_profiles_created_at`: Index on creation date for sorting

### 4. Admin User Setup

#### Option 1: Using the provided script
```bash
node scripts/create-admin-user.js
```

#### Option 2: Manual creation via Supabase Dashboard
1. Create user in Authentication → Users
2. Email: `admin@hospital.local`
3. After creation, run the seed SQL to update role

### 5. Migration Files

- **Migration**: `supabase/migrations/20250718120829_create_user_profiles_schema.sql`
- **Seed Data**: `supabase/seed/01_admin_user.sql`
- **Admin Script**: `scripts/create-admin-user.js`

## Testing Instructions

### Local Development
1. Start Supabase locally: `npm run supabase:start`
2. Apply migrations: `npm run supabase:reset`
3. Create admin user: `node scripts/create-admin-user.js`
4. Generate types: `npm run supabase:types`

### Verification Steps
1. Check migration status: `npm run supabase:migration:list`
2. Verify profiles table creation in Supabase Studio
3. Test user signup flow to ensure automatic profile creation
4. Verify RLS policies are working correctly

## Integration with Application

### TypeScript Types
After migration, generate TypeScript types:
```bash
npm run supabase:types
```

This creates `src/types/database.types.ts` with proper typing for:
- `UserRole` enum type
- `Profile` interface
- Database schema types

### Using in Components
```typescript
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
```

## Deployment Checklist

- [ ] Apply migration to staging environment
- [ ] Create admin user in staging
- [ ] Test all user roles
- [ ] Verify RLS policies
- [ ] Apply migration to production
- [ ] Create admin user in production
- [ ] Update environment variables if needed