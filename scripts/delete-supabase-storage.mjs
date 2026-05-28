#!/usr/bin/env node
// scripts/delete-supabase-storage.mjs
// ─────────────────────────────────────────────────────────────────────
// Bulk Deletion Script: Supabase Storage
//
// Reads from the CSV backup, extracts S3 relative paths, and deletes
// files from the 'project-files' bucket in batches using the service role key.
// ─────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://lcycqyvlwtikbycbxwul.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeWNxeXZsd3Rpa2J5Y2J4d3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc0Mzk0NCwiZXhwIjoyMDg0MzE5OTQ0fQ.zOSV_wFfUE2Vfc1AaRvk6wX2YUHAsW2zrucOVBFEMks";
const CSV_PATH = path.join(__dirname, "..", "public", "project_documents_rows.csv");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseCSV(csvText) {
  const lines = csvText.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < currentLine.length; j++) {
      const ch = currentLine[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

async function main() {
  console.log("🧹 Supabase Storage Bulk Deletion Script");
  console.log("Reading CSV to find files to delete...");

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(csvText);

  // Extract relative storage paths
  const paths = rows
    .map((row) => {
      if (!row.url || !row.url.includes("supabase.co/storage")) return null;
      const parts = row.url.split("/project-files/");
      if (parts.length < 2) return null;
      return decodeURIComponent(parts[1]);
    })
    .filter(Boolean);

  console.log(`Found ${paths.length} file path(s) to delete from 'project-files' bucket.`);

  if (paths.length === 0) {
    console.log("No files to delete.");
    return;
  }

  const batchSize = 500;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    console.log(`\nDeleting batch ${i / batchSize + 1} (${batch.length} files)...`);

    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .remove(batch);

      if (error) {
        console.error(`❌ Error deleting batch:`, error.message, error);
        failCount += batch.length;
      } else {
        console.log(`✅ Successfully deleted ${data?.length || 0} files.`);
        successCount += data?.length || 0;
      }
    } catch (err) {
      console.error(`❌ Unexpected error on batch:`, err.message);
      failCount += batch.length;
    }

    await new Promise((r) => setTimeout(r, 500)); // Throttling
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("               DELETION RUN SUMMARY                    ");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Total files processed:    ${paths.length}`);
  console.log(`  ✅ Successfully deleted:  ${successCount}`);
  console.log(`  ❌ Failed:                 ${failCount}`);
  console.log("═══════════════════════════════════════════════════════");
}

main().catch(console.error);
