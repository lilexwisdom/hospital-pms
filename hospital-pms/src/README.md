# Source Directory Structure

## Directory Overview

```
src/
├── app/                 # Next.js 14 App Router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components (buttons, inputs, etc.)
│   ├── forms/         # Form components and validation
│   └── layouts/       # Layout components (headers, footers, sidebars)
├── lib/               # Utilities and configurations
│   ├── api/          # API client functions
│   ├── auth/         # Authentication helpers
│   └── utils/        # General utilities
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
│   ├── api/          # API response types
│   └── models/       # Data model types
└── styles/            # Global styles and CSS modules
```

## Usage Guidelines

### Components

- `ui/`: Atomic design components (Button, Input, Card, etc.)
- `forms/`: Complex form components with validation
- `layouts/`: Page layout components

### Lib

- `api/`: API service functions for backend communication
- `auth/`: NextAuth.js configuration and auth utilities
- `utils/`: Helper functions, constants, and shared logic

### Types

- Define all TypeScript interfaces and types here
- Separate API types from model types for clarity

### Hooks

- Custom React hooks for shared stateful logic
- Prefix with `use` (e.g., `useAuth`, `usePatient`)

## Import Aliases

Use the `@/` alias for imports:

```typescript
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Patient } from '@/types/models';
```

