#!/usr/bin/env node
/**
 * Verifies Supabase auth environment and optionally tests email/password login.
 * Usage: node scripts/verify-auth.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PLACEHOLDER_PATTERNS = [
  /^YOUR_/i,
  /^your[-_]/i,
  /^your$/i,
  /^<.*>$/,
  /^replace[-_]?me$/i,
  /^changeme$/i,
  /^example$/i,
  /^xxx+$/i,
];

function isPlaceholder(value) {
  if (!value || !value.trim()) return true;
  const trimmed = value.trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

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
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${name}: ${detail}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const disableAuth = process.env.DISABLE_AUTH;
const disableAuthPublic = process.env.NEXT_PUBLIC_DISABLE_AUTH;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

console.log("\n=== Dissembargo OS Auth Environment Check ===\n");

const urlIsPlaceholder = isPlaceholder(url);
const anonIsPlaceholder = isPlaceholder(anonKey);
const serviceIsPlaceholder = isPlaceholder(serviceRoleKey);

record(
  "NEXT_PUBLIC_SUPABASE_URL",
  Boolean(url) && !urlIsPlaceholder,
  !url
    ? "MISSING"
    : urlIsPlaceholder
      ? `PLACEHOLDER (${url}) — replace with your project URL from Supabase Dashboard → Project Settings → API → Project URL`
      : url,
);

record(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  Boolean(anonKey) && !anonIsPlaceholder,
  !anonKey
    ? "MISSING"
    : anonIsPlaceholder
      ? `PLACEHOLDER (${anonKey}) — replace with anon public key from Supabase Dashboard → Project Settings → API → anon public`
      : `set (${anonKey.length} chars)`,
);

record(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  !publishableKey,
  publishableKey
    ? "INCORRECT — this project uses NEXT_PUBLIC_SUPABASE_ANON_KEY, not PUBLISHABLE_KEY"
    : "not set (correct — not used by this codebase)",
);

record(
  "SUPABASE_SERVICE_ROLE_KEY",
  Boolean(serviceRoleKey) && !serviceIsPlaceholder,
  !serviceRoleKey
    ? "MISSING"
    : serviceIsPlaceholder
      ? `PLACEHOLDER (${serviceRoleKey}) — replace with service_role key from Supabase Dashboard → Project Settings → API → service_role (secret)`
      : `set (${serviceRoleKey.length} chars)`,
);

record(
  "NEXT_PUBLIC_SITE_URL",
  Boolean(siteUrl),
  siteUrl ?? "MISSING — defaults to http://localhost:3000 in code",
);

record(
  "DISABLE_AUTH",
  disableAuth !== "true",
  disableAuth === "true"
    ? "ENABLED — login is bypassed; set to false for real auth"
    : "false (real auth enabled)",
);

record(
  "NEXT_PUBLIC_DISABLE_AUTH",
  disableAuthPublic !== "true",
  disableAuthPublic === "true"
    ? "ENABLED — login is bypassed; set to false for real auth"
    : "false (real auth enabled)",
);

if (!url || !anonKey || urlIsPlaceholder || anonIsPlaceholder) {
  console.log(
    "\nCannot test Supabase until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY contain real values.\n",
  );
  console.log(
    "Run: node scripts/setup-auth-env.mjs (after exporting your three Supabase values)\n",
  );
  const failed = checks.filter((check) => !check.ok).length;
  console.log(`=== ${failed} check(s) failed ===\n`);
  process.exit(1);
}

let healthOk = false;

try {
  const response = await fetch(`${url}/auth/v1/health`, {
    signal: AbortSignal.timeout(10000),
  });
  healthOk = response.ok;
  record(
    "Supabase reachability",
    healthOk,
    healthOk ? `HTTP ${response.status}` : `HTTP ${response.status}`,
  );
} catch (error) {
  record(
    "Supabase reachability",
    false,
    error instanceof Error ? error.message : "request failed",
  );
}

if (healthOk) {
  const supabase = createClient(url, anonKey);
  const testEmail = process.env.TEST_AUTH_EMAIL;
  const testPassword = process.env.TEST_AUTH_PASSWORD;

  if (testEmail && testPassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    record(
      "Email/password login",
      !error && Boolean(data.session),
      error
        ? error.message
        : `success — user ${data.user?.email}`,
    );
  } else {
    console.log(
      "\nℹ Set TEST_AUTH_EMAIL and TEST_AUTH_PASSWORD in .env.local to test login.",
    );
  }
}

const failed = checks.filter((check) => !check.ok).length;
console.log(
  `\n=== ${failed === 0 ? "All checks passed" : `${failed} check(s) failed`} ===\n`,
);
process.exit(failed > 0 ? 1 : 0);
