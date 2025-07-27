# Supabase Configuration

This directory contains all Supabase-related configurations and migrations for the Hospital Management System.

## Directory Structure

```
supabase/
├── config.toml      # Supabase project configuration
├── migrations/      # Database migration files
├── functions/       # Edge functions (if needed)
├── seed/           # Seed data for development
└── README.md       # This file
```

## Quick Start

1. **Run the setup script:**
   ```bash
   npm run supabase:setup
   ```

2. **Update environment files with your Supabase credentials**

3. **Link to your Supabase project:**
   ```bash
   npx supabase link --project-ref [your-project-ref]
   ```

4. **Apply migrations:**
   ```bash
   npm run supabase:push
   ```

## Available Scripts

- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:status` - Check connection status
- `npm run supabase:push` - Push local migrations to remote
- `npm run supabase:pull` - Pull remote schema changes
- `npm run supabase:reset` - Reset local database
- `npm run supabase:migration:new` - Create new migration
- `npm run supabase:migration:list` - List all migrations
- `npm run supabase:types` - Generate TypeScript types
- `npm run supabase:setup` - Run interactive setup script

## Migration Workflow

1. **Create a new migration:**
   ```bash
   npm run supabase:migration:new [migration-name]
   ```

2. **Edit the migration file** in `migrations/` directory

3. **Test locally:**
   ```bash
   npm run supabase:reset
   ```

4. **Push to remote:**
   ```bash
   npm run supabase:push
   ```

## Environment Configuration

The project uses three environments:
- **Development** (`.env.local`)
- **Staging** (`.env.staging`)
- **Production** (`.env.production`)

Each environment should have its own Supabase project.

## TypeScript Types

Generate types after schema changes:
```bash
npm run supabase:types
```

This creates/updates `src/types/database.types.ts`

## Security Notes

- Never commit `.env` files with real credentials
- Use Row Level Security (RLS) on all tables
- Keep service role keys secure and server-side only
- Regularly rotate API keys

## Troubleshooting

If you encounter issues:
1. Check `npm run supabase:status`
2. Ensure environment variables are correctly set
3. Verify project is not paused (free tier)
4. Check migration conflicts with `npm run supabase:migration:list`

For detailed documentation, see `/docs/SUPABASE_SETUP.md`