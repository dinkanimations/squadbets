#!/usr/bin/env node
/**
 * Reprocess all unprocessed inbox emails in batches.
 * Usage: npx tsx scripts/reprocess-all.mjs [batchSize] [maxBatches]
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

const batchSize = Number(process.argv[2] ?? 25);
const maxBatches = Number(process.argv[3] ?? 20);

const { reprocessImportedEmails } = await import(
  "../src/lib/ai/reprocess-imported-emails.ts"
);

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

let totalProcessed = 0;
let totalLeads = 0;
let totalNeedsReview = 0;
let totalFailed = 0;

for (let batch = 1; batch <= maxBatches; batch++) {
  const { count: waiting } = await supabase
    .from("inbox")
    .select("id", { count: "exact", head: true })
    .in("ai_processing_status", ["pending", "failed"]);

  if (!waiting) {
    console.log("\nAll emails processed.");
    break;
  }

  console.log(`\n=== Batch ${batch} (${waiting} remaining) ===`);
  const result = await reprocessImportedEmails({
    limit: batchSize,
    scope: "unprocessed",
  });

  totalProcessed += result.processed;
  totalLeads += result.leadsFound;
  totalNeedsReview += result.needsReview;
  totalFailed += result.failed;

  console.log(
    `Batch: processed=${result.processed} leads=${result.leadsFound} needsReview=${result.needsReview} failed=${result.failed}`,
  );

  if (result.processed === 0) break;
}

console.log("\n=== Totals ===");
console.log({
  totalProcessed,
  totalLeads,
  totalNeedsReview,
  totalFailed,
});
