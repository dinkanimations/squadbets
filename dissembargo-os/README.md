# Dissembargo OS

The central operating system for Dissembargo creative agency.

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Database, Auth, Storage)
- **Vercel** (Deployment)
- **OpenAI API** (Planned integration)
- **Lucide Icons**

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | App URL for auth redirects |

### 3. Run database migrations

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations to Supabase
supabase db push
```

Or apply migrations manually via the Supabase SQL Editor from `supabase/migrations/`.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

## Supabase Architecture

### Database tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to Supabase Auth |
| `companies` | Organisations |
| `contacts` | People at companies |
| `opportunities` | AI-qualified opportunity inbox |
| `clients` | Converted companies |
| `projects` | Client projects |
| `quotes` | Project quotes |
| `production_schedules` | Versioned schedule JSON per project |

### Relationships

```
Companies → Contacts → Opportunities
Companies → Clients → Projects → Quotes → Production Schedules
```

### Storage buckets

- `email-attachments` — Inbound email files
- `project-assets` — Creative deliverables
- `documents` — Quotes, contracts, briefs

### Authentication

- Email & password sign-in at `/login`
- Password reset at `/forgot-password` and `/reset-password`
- OAuth callback at `/auth/callback`
- Protected routes via Next.js middleware
- Sign out from the profile menu

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected application routes
│   ├── (auth)/             # Login and password reset
│   └── auth/callback/      # Supabase auth callback
├── components/
│   ├── auth/               # Auth form components
│   ├── dashboard/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── auth/               # Server actions and session helpers
│   ├── database/           # Reusable database query helpers
│   ├── storage/            # Storage upload/download helpers
│   └── supabase/           # Supabase client factories
├── types/
│   └── database.ts         # TypeScript database types
└── middleware.ts           # Route protection and session refresh
supabase/
└── migrations/             # SQL schema migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:types` | Regenerate types from local Supabase (requires CLI) |

## Current Status

- UI shell and layout complete
- Supabase auth, database schema, RLS, and storage configured
- Reusable database and storage helpers ready
- Module pages still use placeholder UI and dummy data

## Next Steps

1. Connect dashboard to live Supabase data
2. Build the Opportunities inbox module
3. Integrate OpenAI for email qualification
4. Deploy to Vercel with environment variables
