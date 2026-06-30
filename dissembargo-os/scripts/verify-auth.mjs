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

function normalizeSupabaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function projectRefFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/\.supabase\.co$/, "");
  } catch {
    return null;
  }
}

function projectRefFromJwt(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

function describeFetchError(error) {
  if (!(error instanceof Error)) return "request failed";

  const cause = error.cause;
  if (cause && typeof cause === "object" && "code" in cause) {
    const code = String(cause.code);
    const hostname =
      "hostname" in cause ? String(cause.hostname) : "unknown host";

    if (code === "ENOTFOUND") {
      return `DNS lookup failed for ${hostname} (hostname does not exist — check NEXT_PUBLIC_SUPABASE_URL for typos)`;
    }

    if (code === "ECONNREFUSED") {
      return `Connection refused by ${hostname}`;
    }

    if (code === "ETIMEDOUT") {
      return `Connection timed out reaching ${hostname}`;
    }

    return `${error.message} (${code}: ${hostname})`;
  }

  return error.message;
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${name}: ${detail}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : undefined;
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

const urlRef = projectRefFromUrl(url);
const jwtRef = projectRefFromJwt(anonKey);

if (urlRef && jwtRef) {
  record(
    "URL matches anon key project ref",
    urlRef === jwtRef,
    urlRef === jwtRef
      ? `${urlRef}`
      : `URL ref "${urlRef}" does not match anon key ref "${jwtRef}" — copy Project URL from Supabase Dashboard → Project Settings → API`,
  );
}

const healthUrl = `${url}/auth/v1/health`;
console.log(`\nReachability test URL: ${healthUrl}`);

let healthOk = false;

try {
  const response = await fetch(healthUrl, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  healthOk = response.ok;

  if (healthOk) {
    record("Supabase reachability", true, `HTTP ${response.status} — GoTrue auth API is online`);
  } else {
    const body = await response.text();
    record(
      "Supabase reachability",
      false,
      `HTTP ${response.status} — ${body.slice(0, 160)}`,
    );
  }
} catch (error) {
  record("Supabase reachability", false, describeFetchError(error));
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
