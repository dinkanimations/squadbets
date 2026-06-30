#!/usr/bin/env node
/**
 * Reprocess a batch of unprocessed inbox emails (uses service role from .env.local).
 * Usage: node scripts/reprocess-batch.mjs [limit]
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

const limit = Number(process.argv[2] ?? 25);

const { reprocessImportedEmails } = await import(
  "../src/lib/ai/reprocess-imported-emails.ts"
);

const result = await reprocessImportedEmails({ limit, scope: "unprocessed" });
console.log(JSON.stringify(result, null, 2));
