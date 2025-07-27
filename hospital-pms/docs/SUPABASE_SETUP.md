# Supabase Configuration Guide

## Overview

This guide documents the Supabase setup for the Hospital Management System across development, staging, and production environments.

## Environment Structure

The project uses three separate Supabase projects:
- **Development**: For local development and testing
- **Staging**: For pre-production testing
- **Production**: For live production use

## Initial Setup Steps

### 1. Create Supabase Projects

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create three projects:
   - `hospital-pms-dev` (Development)
   - `hospital-pms-staging` (Staging)
   - `hospital-pms-prod` (Production)

3. For each project:
   - Select PostgreSQL 15+
   - Set timezone to `Asia/Seoul`
   - Enable Point-in-time Recovery (production only)

### 2. Retrieve Credentials

For each project, retrieve:
- **Project URL**: Found in Settings → API
- **Anon Key**: Found in Settings → API
- **Service Role Key**: Found in Settings → API (keep secure!)

### 3. Update Environment Files

Update the following files with your actual Supabase credentials:

#### `.env.local` (Development)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-dev-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-dev-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-dev-service-role-key]
```

#### `.env.staging` (Staging)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-staging-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-staging-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-staging-service-role-key]
```

#### `.env.production` (Production)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-prod-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-prod-service-role-key]
```

## Database Configuration

### Timezone Setup

For each Supabase project, run the following SQL in the SQL Editor:

```sql
-- Set default timezone to Seoul
ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- Verify timezone setting
SHOW timezone;
```

### Backup Policy (Production Only)

1. Go to Settings → Backups
2. Enable Point-in-time Recovery
3. Set backup retention to 30 days
4. Enable daily backups at 2:00 AM KST

## Local Development Setup

### Using Supabase CLI

```bash
# Link to your development project
npx supabase link --project-ref [your-dev-project-ref]

# Pull remote schema changes
npx supabase db pull

# Push local migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Migration Workflow

1. Create migrations locally:
```bash
npx supabase migration new [migration-name]
```

2. Test migrations locally:
```bash
npx supabase db reset
```

3. Push to development:
```bash
npx supabase db push
```

4. After testing, apply to staging and production.

## Security Best Practices

### Service Role Key Protection

- **Never** commit service role keys to version control
- Use environment variables only
- Rotate keys regularly (every 90 days)
- Limit service role key usage to server-side code only

### Row Level Security (RLS)

Always enable RLS on all tables:

```sql
-- Enable RLS on a table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
CREATE POLICY "Users can view own records" ON your_table
  FOR SELECT USING (auth.uid() = user_id);
```

### API Security

- Use anon keys in client-side code only
- Implement proper authentication before accessing sensitive data
- Set up API rate limiting in Supabase dashboard

## Environment-Specific Settings

### Development
- Enable all Supabase logs
- Use relaxed rate limits
- Enable Supabase Studio access

### Staging
- Mirror production settings
- Enable selected logs for debugging
- Restrict Studio access to team members

### Production
- Minimal logging (errors only)
- Strict rate limits
- Disable Studio access
- Enable audit logs

## Troubleshooting

### Common Issues

1. **Connection timeout**
   - Check if Supabase project is paused (free tier)
   - Verify firewall settings

2. **Authentication errors**
   - Ensure correct environment variables are loaded
   - Check if keys match the correct project

3. **Migration conflicts**
   - Always pull latest changes before creating new migrations
   - Use `supabase db reset` for clean slate in development

### Useful Commands

```bash
# Check current project status
npx supabase status

# View migration history
npx supabase migration list

# Connect to database directly
npx supabase db remote list

# Generate types after schema changes
npx supabase gen types typescript --local > src/types/database.types.ts
```

## Monitoring and Maintenance

### Health Checks

Set up monitoring for:
- Database connection pool usage
- API request latency
- Storage usage
- Backup completion status

### Regular Maintenance

- Review and optimize slow queries monthly
- Check for unused indexes
- Monitor table sizes and implement archiving if needed
- Review security policies quarterly

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Project-specific issues: Create ticket in internal system

---

Last Updated: 2025-07-18