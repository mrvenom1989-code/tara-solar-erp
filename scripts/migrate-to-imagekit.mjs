#!/usr/bin/env node
// scripts/migrate-to-imagekit.mjs
// ─────────────────────────────────────────────────────────────────────
// Migration script: Supabase Storage → ImageKit
//
// Downloads files from old Supabase storage URLs, re-uploads them to
// ImageKit, and updates the project_documents table in Supabase DB.
//
// Usage:
//   node scripts/migrate-to-imagekit.mjs              # run migration
//   node scripts/migrate-to-imagekit.mjs --dry-run    # preview only
// ─────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import ImageKit from "@imagekit/nodejs";
import { Blob } from "buffer";
import path from "path";

// ── Configuration ────────────────────────────────────────────────────
const SUPABASE_URL = "https://lcycqyvlwtikbycbxwul.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeWNxeXZsd3Rpa2J5Y2J4d3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc0Mzk0NCwiZXhwIjoyMDg0MzE5OTQ0fQ.zOSV_wFfUE2Vfc1AaRvk6wX2YUHAsW2zrucOVBFEMks";
const IMAGEKIT_PRIVATE_KEY = "private_hLMMnKilr6vY3lUOpzHwf31FF5M=";

// Pattern to detect old Supabase storage URLs
const SUPABASE_STORAGE_PATTERN = "supabase.co/storage";

// ── CLI flags ────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");

// ── Clients ──────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const imagekit = new ImageKit({ privateKey: IMAGEKIT_PRIVATE_KEY });

// ── Helpers ──────────────────────────────────────────────────────────

/** Guess a MIME type from the file name extension */
function guessMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
  };
  return mimeMap[ext] || "application/octet-stream";
}

/** Download a file from a URL and return the ArrayBuffer + content type */
async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType =
    res.headers.get("content-type") || "application/octet-stream";
  return { arrayBuffer, contentType };
}

/** Upload a file buffer to ImageKit */
async function uploadToImageKit(arrayBuffer, fileName, projectId, contentType) {
  const blob = new Blob([arrayBuffer], { type: contentType });
  const response = await imagekit.files.upload({
    file: blob,
    fileName: fileName,
    folder: `/project-files/${projectId}`,
    useUniqueFileName: true,
  });
  return { fileId: response.fileId, url: response.url };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Supabase Storage → ImageKit Migration Script      ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log();

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE — no changes will be made.\n");
  }

  // 1. Fetch ALL project_documents
  console.log("📋 Fetching all project documents from database...");
  const { data: allDocs, error: fetchError } = await supabase
    .from("project_documents")
    .select("*")
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("❌ Failed to fetch documents:", fetchError.message);
    process.exit(1);
  }

  console.log(`   Found ${allDocs.length} total document(s) in database.\n`);

  // 2. Filter to only legacy Supabase-hosted docs
  const legacyDocs = allDocs.filter(
    (doc) => doc.url && doc.url.includes(SUPABASE_STORAGE_PATTERN)
  );
  const alreadyMigrated = allDocs.length - legacyDocs.length;

  console.log(
    `   📦 ${legacyDocs.length} document(s) still on Supabase storage`
  );
  console.log(`   ✅ ${alreadyMigrated} document(s) already on ImageKit`);
  console.log();

  if (legacyDocs.length === 0) {
    console.log(
      "🎉 Nothing to migrate — all documents are already on ImageKit!"
    );
    return;
  }

  // 3. Process each legacy document
  const results = { success: [], failed: [], skipped: [] };

  for (let i = 0; i < legacyDocs.length; i++) {
    const doc = legacyDocs[i];
    const progress = `[${i + 1}/${legacyDocs.length}]`;

    console.log(
      `${progress} Processing: "${doc.name}" (project: ${doc.project_id})`
    );
    console.log(`       Old URL: ${doc.url}`);

    if (DRY_RUN) {
      console.log("       ➡️  Would download & re-upload to ImageKit");
      console.log();
      results.success.push({ id: doc.id, name: doc.name, status: "dry-run" });
      continue;
    }

    try {
      // 3a. Download from Supabase
      console.log("       ⬇️  Downloading from Supabase...");
      const { arrayBuffer, contentType } = await downloadFile(doc.url);
      const sizeKB = (arrayBuffer.byteLength / 1024).toFixed(1);
      console.log(`       📄 Downloaded ${sizeKB} KB (${contentType})`);

      // 3b. Upload to ImageKit
      console.log("       ⬆️  Uploading to ImageKit...");
      const mimeType =
        contentType !== "application/octet-stream"
          ? contentType
          : guessMimeType(doc.name);
      const { fileId, url: newUrl } = await uploadToImageKit(
        arrayBuffer,
        doc.name,
        doc.project_id,
        mimeType
      );
      console.log(`       🔗 New URL: ${newUrl}`);
      console.log(`       🆔 FileId:  ${fileId}`);

      // 3c. Update the database row
      console.log("       💾 Updating database record...");
      const { error: updateError } = await supabase
        .from("project_documents")
        .update({
          url: newUrl,
          storage_path: fileId,
        })
        .eq("id", doc.id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      console.log("       ✅ Migrated successfully!");
      results.success.push({
        id: doc.id,
        name: doc.name,
        oldUrl: doc.url,
        newUrl,
        fileId,
      });
    } catch (err) {
      console.log(`       ❌ FAILED: ${err.message}`);
      results.failed.push({ id: doc.id, name: doc.name, error: err.message });
    }

    console.log();

    // Small delay to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  // 4. Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("                    MIGRATION SUMMARY                  ");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Total documents in DB:     ${allDocs.length}`);
  console.log(`  Already on ImageKit:       ${alreadyMigrated}`);
  console.log(`  Legacy (Supabase):         ${legacyDocs.length}`);
  console.log(`  ✅ Successfully migrated:  ${results.success.length}`);
  console.log(`  ❌ Failed:                 ${results.failed.length}`);
  console.log("═══════════════════════════════════════════════════════");

  if (results.failed.length > 0) {
    console.log("\n⚠️  Failed documents:");
    results.failed.forEach((f) => {
      console.log(`   - [ID: ${f.id}] "${f.name}" → ${f.error}`);
    });
  }

  if (DRY_RUN) {
    console.log(
      "\n💡 This was a dry run. Run without --dry-run to perform the actual migration."
    );
  } else if (results.failed.length === 0 && results.success.length > 0) {
    console.log(
      "\n🎉 Migration complete! All documents are now served from ImageKit."
    );
    console.log(
      "   You can safely remove Supabase storage buckets to free up space."
    );
  }
}

// ── Run ──────────────────────────────────────────────────────────────
main().catch((err) => {
  console.error("💥 Unexpected error:", err);
  process.exit(1);
});
