#!/usr/bin/env node
/**
 * Checks whether core Supabase tables exist.
 * Usage: node scripts/check-schema.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const REQUIRED_TABLES = [
  "profiles",
  "companies",
  "contacts",
  "opportunities",
  "app_settings",
  "team_members",
  "inbox",
  "gmail_connections",
  "quotes",
  "production_schedules",
  "potential_opportunities",
];

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or API key in .env.local");
  process.exit(1);
}

console.log("\n=== Supabase schema check ===\n");

let missing = 0;

for (const table of REQUIRED_TABLES) {
  const response = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  const body = await response.text();
  const exists = response.status !== 404 || !body.includes("PGRST205");

  if (exists) {
    console.log(`✓ ${table}`);
  } else {
    console.log(`✗ ${table} — missing`);
    missing += 1;
  }
}

console.log(
  missing === 0
    ? "\nAll core tables exist.\n"
    : `\n${missing} table(s) missing. Apply migrations:\n\n  cd dissembargo-os\n  npx supabase link --project-ref YOUR_REF\n  npx supabase db push\n\nOr run all files in supabase/migrations/ via the Supabase SQL Editor (in order).\n`,
);

process.exit(missing > 0 ? 1 : 0);
