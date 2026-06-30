#!/usr/bin/env node
/**
 * Diagnose and optionally reprocess the Gmail → AI → CRM pipeline.
 * Usage:
 *   node scripts/verify-inbox-pipeline.mjs
 *   node scripts/verify-inbox-pipeline.mjs --reprocess 5
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, key);

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function count(table, filter = () => true) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) return { error: error.message, count: 0 };
  return { count: (data ?? []).filter(filter).length };
}

section("Pipeline diagnostics");

const tables = [
  "inbox",
  "potential_opportunities",
  "opportunities",
  "companies",
  "contacts",
  "clients",
  "ai_classification_logs",
];

for (const table of tables) {
  const { count: n, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  console.log(`${table}: ${error ? error.message : n}`);
}

const { data: inboxRows } = await supabase
  .from("inbox")
  .select("ai_processing_status, review_status, ai_processing_error");

const statusCounts = {};
const reviewCounts = {};
const failureReasons = {};

for (const row of inboxRows ?? []) {
  statusCounts[row.ai_processing_status] =
    (statusCounts[row.ai_processing_status] ?? 0) + 1;
  const review = row.review_status ?? "null";
  reviewCounts[review] = (reviewCounts[review] ?? 0) + 1;
  if (row.ai_processing_status === "failed" && row.ai_processing_error) {
    const reason = row.ai_processing_error.slice(0, 100);
    failureReasons[reason] = (failureReasons[reason] ?? 0) + 1;
  }
}

section("Inbox AI status");
console.log(statusCounts);

section("Inbox review status");
console.log(reviewCounts);

if (Object.keys(failureReasons).length) {
  section("Failure reasons");
  for (const [reason, n] of Object.entries(failureReasons)) {
    console.log(`  ${n}× ${reason}`);
  }
}

const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  section("OpenAI health");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "OK" }],
      max_tokens: 3,
    }),
  });
  const body = await res.json();
  console.log(`Status ${res.status}: ${body.error?.message ?? "OK"}`);
} else {
  console.log("\nOPENAI_API_KEY: not set");
}

const reprocessArg = process.argv.find((a) => a.startsWith("--reprocess"));
if (reprocessArg) {
  const limit = Number(reprocessArg.split("=")[1] ?? process.argv[process.argv.indexOf("--reprocess") + 1] ?? 3);
  section(`Reprocessing up to ${limit} unprocessed emails`);

  const { reprocessImportedEmails } = await import(
    "../src/lib/ai/reprocess-imported-emails.ts"
  ).catch(() => ({ reprocessImportedEmails: null }));

  if (!reprocessImportedEmails) {
    console.log("Reprocess requires running via Next.js API. Use POST /api/inbox/reprocess instead.");
  } else {
    const result = await reprocessImportedEmails({ limit });
    console.log(result);
  }
}

section("Diagnosis");
const waiting =
  (statusCounts.pending ?? 0) +
  (statusCounts.failed ?? 0) +
  (statusCounts.processing ?? 0);

if (waiting > 0) {
  console.log(
    `BLOCKED: ${waiting} emails imported but not classified. AI step has not completed.`,
  );
  console.log(
    "Fix: ensure OpenAI billing is active, then click Reprocess imported emails in Inbox.",
  );
} else if ((statusCounts.completed ?? 0) > 0) {
  console.log("AI classification has run on imported emails.");
}

if ((await supabase.from("opportunities").select("id", { count: "exact", head: true })).count === 0) {
  console.log(
    "No opportunities yet — either no genuine business enquiries in mailbox, or AI has not run.",
  );
}

console.log("\nDone.");
