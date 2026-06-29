# AGENTS.md

## Cursor Cloud specific instructions

This repository contains **two unrelated products** side by side:

- **Repo root** — "SquadBets", an Expo/React Native (web) app (`app/`, `app.json`, `metro.config.js`, etc.).
  - ⚠️ The root `package.json` is **corrupted**: it contains GitHub Actions workflow YAML instead of JSON, and there is **no root lockfile**. The root app is therefore **not installable/runnable** as-is. Do not run `npm install` at the repo root. Fixing it requires reconstructing the Expo manifest, which is out of scope for environment setup.
- **`dissembargo-os/`** — a self-contained **Next.js 16** dashboard for the Dissembargo creative agency. This is the actively developed product (see the `cursor/dissembargo-os-*` branches) and the only product that runs out of the box.

### dissembargo-os (the runnable product)

- All work happens inside `dissembargo-os/`. Run npm commands from that directory.
- Standard scripts are in `dissembargo-os/package.json`: `dev`, `build`, `start`, `lint`.
- Dev server runs on **http://localhost:3000** (`npm run dev`, Turbopack).
- No database, environment variables, or secrets are required — the app is a UI shell with dummy data (`src/lib/data/dummy.ts`); Supabase/OpenAI are only "planned".
- Current functionality is the app shell + client-side routing: the sidebar (`src/components/layout/Sidebar.tsx`) navigates between modules (Dashboard, Opportunities, Clients, Quotes, etc.); most module pages are "Coming soon" placeholders.
- This is **Next.js 16** with breaking changes vs. older versions — see `dissembargo-os/AGENTS.md`; consult `node_modules/next/dist/docs/` before changing app code.
