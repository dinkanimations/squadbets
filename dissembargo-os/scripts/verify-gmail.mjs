#!/usr/bin/env node
/**
 * Verifies Gmail integration environment.
 * Usage: node scripts/verify-gmail.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}: ${detail}`);
}

const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const redirectUri = `${siteUrl}/api/gmail/callback`;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const cronSecret = process.env.CRON_SECRET?.trim();

record(
  "GOOGLE_CLIENT_ID",
  Boolean(clientId && !/^your[-_]/i.test(clientId)),
  clientId ? `set (${clientId.length} chars)` : "MISSING",
);

record(
  "GOOGLE_CLIENT_SECRET",
  Boolean(clientSecret && !/^your[-_]/i.test(clientSecret)),
  clientSecret ? "set" : "MISSING",
);

record(
  "NEXT_PUBLIC_SITE_URL",
  Boolean(siteUrl),
  siteUrl,
);

record(
  "OAuth redirect URI",
  true,
  redirectUri,
);

record(
  "SUPABASE_SERVICE_ROLE_KEY",
  Boolean(serviceRole),
  serviceRole ? "set (required for Gmail token storage + inbox import)" : "MISSING",
);

record(
  "CRON_SECRET",
  Boolean(cronSecret),
  cronSecret
    ? "set (required for automatic 5-min sync on Vercel)"
    : "not set — manual Sync Now still works locally",
);

console.log(`
Add this redirect URI in Google Cloud Console → APIs & Services → Credentials → your OAuth client:
  ${redirectUri}

Enable the Gmail API for the same Google Cloud project.
`);

const failed = checks.filter((check) => !check.ok).length;
console.log(
  failed === 0
    ? "\n=== Gmail environment ready ===\n"
    : `\n=== ${failed} required check(s) failed ===\n`,
);

process.exit(failed > 0 ? 1 : 0);
