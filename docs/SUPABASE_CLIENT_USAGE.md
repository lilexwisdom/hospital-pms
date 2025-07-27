# Supabase Client Usage Guide

## Overview

This guide explains how to use Supabase clients in the Hospital Patient Management System with Next.js App Router.

## Client Types

### 1. Browser Client (`@/lib/supabase/client.ts`)

For use in Client Components:

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';

export function MyClientComponent() {
  const supabase = createClient();
  
  // Use supabase client
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*');
  };
}
```

### 2. Server Client (`@/lib/supabase/server.ts`)

For use in Server Components:

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function MyServerComponent() {
  const supabase = await createClient();
  
  const { data: patients } = await supabase
    .from('patients')
    .select('*');
    
  return <div>{/* Render patients */}</div>;
}
```

### 3. Server Action Client

For use in Server Actions:

```typescript
'use server';

import { createActionClient } from '@/lib/supabase/server';

export async function createPatient(formData: FormData) {
  const supabase = await createActionClient();
  
  const { data, error } = await supabase
    .from('patients')
    .insert({
      name: formData.get('name') as string,
      // ... other fields
    });
    
  if (error) throw error;
  return data;
}
```

### 4. Admin Client (Service Role)

For administrative operations that bypass RLS:

```typescript
import { createAdminClient } from '@/lib/supabase/server';

export async function adminOnlyOperation() {
  const supabase = await createAdminClient();
  
  // This bypasses RLS - use with caution!
  const { data } = await supabase
    .from('audit_logs')
    .select('*');
}
```

## Authentication Patterns

### Check Authentication Status

```typescript
// Client Component
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Server Component
import { getUser } from '@/lib/supabase/server';

const user = await getUser();
if (!user) {
  redirect('/login');
}
```

### Get User Profile with Role

```typescript
import { getUserProfile } from '@/lib/supabase/server';

const profile = await getUserProfile();
console.log(profile?.role); // 'admin' | 'manager' | 'bd' | 'cs'
```

### Role-Based Access Control

```typescript
import { hasRole, requireRole } from '@/lib/supabase/server';

// Check role
if (await hasRole('admin')) {
  // Admin-only logic
}

// Require role (throws if not authorized)
const { user, profile } = await requireRole('admin');
```

## Database Operations

### Using Helper Functions

```typescript
import { createClient } from '@/lib/supabase/server';
import { 
  getPatientsByUser,
  createPatientWithSSN,
  searchPatientBySSN 
} from '@/lib/supabase/helpers';

const supabase = await createClient();

// Get patients based on user role
const patients = await getPatientsByUser(supabase, userId, 'bd');

// Create patient with encrypted SSN
const newPatient = await createPatientWithSSN(
  supabase,
  { name: '홍길동', phone: '010-1234-5678' },
  '901231-1234567'
);

// Search patient by SSN
const patient = await searchPatientBySSN(supabase, '901231-1234567');
```

### Error Handling

```typescript
import { handleSupabaseError } from '@/lib/supabase/helpers';

try {
  const { data, error } = await supabase
    .from('patients')
    .insert({ ... });
    
  if (error) throw error;
} catch (error) {
  const message = handleSupabaseError(error);
  // Show user-friendly error message
}
```

## Real-time Subscriptions

```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function RealtimeComponent() {
  const supabase = createClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `status=eq.pending`
        },
        (payload) => {
          console.log('Change received!', payload);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
}
```

## File Upload

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

async function uploadFile(file: File) {
  const { data, error } = await supabase.storage
    .from('medical-documents')
    .upload(`${userId}/${file.name}`, file);
    
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('medical-documents')
    .getPublicUrl(data.path);
    
  return publicUrl;
}
```

## Middleware Integration

The middleware automatically handles:
- Session refresh
- Route protection
- Role-based access

```typescript
// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

## Testing Connection

```typescript
import { testClientConnection, runDiagnostics } from '@/lib/supabase/test-connection';

// Test connection
const result = await testClientConnection();
if (!result.success) {
  console.error('Connection failed:', result.message);
}

// Run full diagnostics
const diagnostics = await runDiagnostics(supabase);
console.log('Diagnostics:', diagnostics);
```

## Best Practices

### 1. Client Selection

- **Client Components**: Use `createClient()` from `client.ts`
- **Server Components**: Use `createClient()` from `server.ts`
- **Server Actions**: Use `createActionClient()` from `server.ts`
- **Admin Operations**: Use `createAdminClient()` sparingly

### 2. Type Safety

Always import and use the generated types:

```typescript
import type { Database } from '@/types/database.types';

type Patient = Database['public']['Tables']['patients']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
```

### 3. Error Handling

- Always handle errors gracefully
- Use `handleSupabaseError()` for user-friendly messages
- Log errors for debugging

### 4. Performance

- Use select() to limit fields returned
- Implement pagination for large datasets
- Use the helper functions which include optimizations

### 5. Security

- Never expose service role key to client
- Always validate input before database operations
- Trust RLS but verify in application logic
- Use prepared statements (Supabase handles this)

## Common Patterns

### Dashboard Data Fetching

```typescript
import { getDashboardStats } from '@/lib/supabase/helpers';

export default async function Dashboard() {
  const supabase = await createClient();
  const stats = await getDashboardStats(supabase, userId);
  
  return <DashboardView stats={stats} />;
}
```

### Form Submission

```typescript
'use server';

import { createActionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitPatientForm(formData: FormData) {
  const supabase = await createActionClient();
  
  const { error } = await supabase
    .from('patients')
    .insert({
      name: formData.get('name') as string,
      // ... other fields
    });
    
  if (error) {
    return { error: handleSupabaseError(error) };
  }
  
  revalidatePath('/patients');
  return { success: true };
}
```

### Protected API Route

```typescript
// app/api/admin/route.ts
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/supabase/server';

export async function GET() {
  try {
    await requireRole('admin');
    
    const supabase = await createClient();
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
      
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}
```

## Troubleshooting

### "JWT expired" Error

The middleware should handle token refresh automatically. If issues persist:

```typescript
// Force refresh
const { data, error } = await supabase.auth.refreshSession();
```

### RLS Policy Violations

Check user role and permissions:

```typescript
const profile = await getUserProfile();
console.log('Current role:', profile?.role);
```

### Connection Issues

Run diagnostics:

```typescript
const health = await getHealthCheckData();
console.log('Health status:', health);
```