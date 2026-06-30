#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql directly via Postgres (no Supabase CLI token).
 * Requires SUPABASE_DB_PASSWORD in .env.local or environment.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
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
const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = new URL(url).hostname.replace(/\.supabase\.co$/, "");

if (!password?.trim()) {
  console.error(`
Missing SUPABASE_DB_PASSWORD.

Find it in Supabase Dashboard → Project Settings → Database → Database password.
Add to .env.local or Cursor Secrets, then re-run: npm run db:apply
`);
  process.exit(1);
}

const connectionString =
  process.env.SUPABASE_DB_URL?.trim() ||
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

console.log(`\nConnecting to ${projectRef} …\n`);

try {
  await client.connect();
} catch (error) {
  console.error("Connection failed:", error instanceof Error ? error.message : error);
  console.error(`
If the pooler region is wrong, set SUPABASE_DB_URL in .env.local with the
connection string from Supabase → Project Settings → Database → Connection string (URI).
`);
  process.exit(1);
}

for (const file of files) {
  const sql = readFileSync(resolve(migrationsDir, file), "utf8");
  process.stdout.write(`▶ ${file} … `);
  try {
    await client.query(sql);
    console.log("ok");
  } catch (error) {
    console.log("failed");
    console.error(error instanceof Error ? error.message : error);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(`\n✓ Applied ${files.length} migrations.\n`);
