# Dissembargo OS

The central operating system for Dissembargo creative agency.

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Database, Auth, Storage — planned)
- **Vercel** (Deployment)
- **OpenAI API** (Planned integration)
- **Lucide Icons**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Main application routes
│   │   ├── page.tsx        # Dashboard
│   │   ├── opportunities/
│   │   ├── clients/
│   │   ├── quotes/
│   │   ├── production-schedules/
│   │   ├── projects/
│   │   ├── calendar/
│   │   └── settings/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   ├── layout/             # App shell, sidebar, top nav
│   └── ui/                 # Reusable UI primitives
├── lib/
│   ├── constants/          # Navigation and app config
│   ├── data/               # Dummy/seed data
│   └── utils/                # Shared utilities
└── types/                  # TypeScript type definitions
```

## Current Status

UI shell and layout only — no backend functionality yet.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint              |
