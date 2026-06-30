#!/usr/bin/env node
/**
 * Apply Inbox SQL (potential_opportunities) directly to Supabase Postgres.
 *
 * 1. Supabase Dashboard → Project Settings → Database → Database password
 * 2. Add to .env.local:  SUPABASE_DB_PASSWORD=your-password
 * 3. Run: npm run db:inbox:apply
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD?.trim();

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const projectRef = new URL(url).hostname.replace(/\.supabase\.co$/, "");
const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

if (!password) {
  console.error(`
Missing SUPABASE_DB_PASSWORD in .env.local

Manual setup (no password needed):
  1. Open: ${sqlEditorUrl}
  2. Copy all of: supabase/paste-inbox-migrations.sql
  3. Paste into SQL Editor → Run
  4. Refresh the app → Sync Gmail

Automatic setup:
  1. Supabase Dashboard → Project Settings → Database → Database password
  2. Add to .env.local:  SUPABASE_DB_PASSWORD=your-password
  3. Re-run: npm run db:inbox:apply
`);
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), "supabase/paste-inbox-migrations.sql");
const sql = readFileSync(sqlPath, "utf8");

const connectionCandidates = [
  process.env.SUPABASE_DB_URL?.trim(),
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
].filter((value) => Boolean(value));

async function main() {
  let lastError;

  for (const connectionString of connectionCandidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      console.log("Connecting to Supabase Postgres…");
      await client.connect();
      console.log("Applying Inbox migrations…\n");
      await client.query(sql);
      await client.end();
      console.log("✓ Inbox tables created successfully.\n");
      console.log("Next: refresh the app and click Sync Gmail in Settings → Integrations.");
      return;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
    }
  }

  console.error("Failed to apply migrations:", lastError instanceof Error ? lastError.message : lastError);
  console.error(`\nTry manual setup: ${sqlEditorUrl}`);
  process.exit(1);
}

main();
