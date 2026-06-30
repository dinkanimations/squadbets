#!/usr/bin/env node
/**
 * One-command setup: env file, auth verify, Supabase link, db push, schema check.
 *
 * Required environment variables (Cursor Secrets or inline):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (for `supabase db push` without interactive login):
 *   SUPABASE_ACCESS_TOKEN  — from supabase.com/dashboard/account/tokens
 *   SUPABASE_DB_PASSWORD   — Project Settings → Database → database password
 *   SUPABASE_PROJECT_REF   — defaults to ref parsed from NEXT_PUBLIC_SUPABASE_URL
 *
 * Usage:
 *   npm run setup
 *   npm run setup -- --dev    # also start next dev after setup
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const startDev = args.includes("--dev");

function run(label, command, commandArgs, extraEnv = {}) {
  console.log(`\n▶ ${label}\n`);
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})\n`);
    process.exit(result.status ?? 1);
  }
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/\.supabase\.co$/, "");
  } catch {
    return null;
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
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

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error(`
=== Dissembargo OS setup — missing credentials ===

Add these to Cursor → Cloud Agents → Secrets (or export before running):

${missing.map((key) => `  ${key}`).join("\n")}

Project URL should be:
  https://ixqbwexmctkobdlwllue.supabase.co

Find keys in Supabase Dashboard → Project Settings → API.

Then re-run: npm run setup
`);
  process.exit(1);
}

// Step 1: write .env.local
run("Write .env.local", "node", ["scripts/setup-auth-env.mjs"]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromUrl(url);

// Step 2: push migrations when CLI credentials are available
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();

if (accessToken && dbPassword && projectRef) {
  run("Link Supabase project", "npx", [
    "supabase",
    "link",
    "--project-ref",
    projectRef,
    "--password",
    dbPassword,
    "--yes",
  ], { SUPABASE_ACCESS_TOKEN: accessToken });

  run("Push database migrations", "npx", [
    "supabase",
    "db",
    "push",
    "--linked",
    "--yes",
  ], { SUPABASE_ACCESS_TOKEN: accessToken });
} else {
  console.log(`
ℹ Skipping supabase db push — add these Cursor Secrets to apply migrations automatically:
    SUPABASE_ACCESS_TOKEN  (supabase.com/dashboard/account/tokens)
    SUPABASE_DB_PASSWORD   (Project Settings → Database)

Or run manually:
    npx supabase link --project-ref ${projectRef ?? "YOUR_REF"}
    npx supabase db push
`);
}

// Step 3: verify schema
run("Check database schema", "node", ["scripts/check-schema.mjs"]);

console.log("\n✓ Setup complete.\n");

if (startDev) {
  console.log("Starting dev server at http://localhost:3000 …\n");
  spawnSync("npm", ["run", "dev"], { stdio: "inherit", cwd: process.cwd() });
}
