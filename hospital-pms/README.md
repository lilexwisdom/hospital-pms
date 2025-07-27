# Hospital Patient Management System (HPMS)

A modern, full-stack patient management system built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend Framework**: Next.js 14.2+ with App Router
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS with Forms & Typography plugins
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui (to be integrated)
- **Development Tools**: ESLint, Prettier, Husky

## Features (Planned)

- Patient survey system with token-based access
- Patient management (CRUD operations)
- Appointment scheduling with calendar view
- Real-time dashboard and statistics
- Advanced search and filtering
- Report generation
- Secure authentication with Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project (for later integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hospital-pms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
hospital-pms/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── forms/       # Form components
│   │   ├── layouts/     # Layout components
│   │   └── ui/          # UI components (shadcn/ui)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   │   ├── api/         # API client functions
│   │   ├── auth/        # Authentication utilities
│   │   ├── providers/   # React context providers
│   │   ├── stores/      # Zustand stores
│   │   ├── supabase/    # Supabase client
│   │   └── utils/       # General utilities
│   ├── styles/          # Global styles
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── ...config files
```

## Development Workflow

1. **Type Safety**: All code is written in TypeScript with strict type checking
2. **Code Quality**: ESLint and Prettier are configured for consistent code style
3. **Git Hooks**: Husky is set up to run linting and formatting on pre-commit
4. **Component Structure**: Components follow a modular, reusable pattern

## Deployment

This project is designed to be deployed on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Ensure all tests pass and type checking succeeds
4. Submit a pull request with a clear description

## License

This project is private and proprietary.
