#!/usr/bin/env node
// scripts/migrate-to-gdrive.mjs
// ─────────────────────────────────────────────────────────────────────
// Migration script: Supabase Storage/Local Offline Files → Google Drive
//
// Reads from the CSV backup, matches with local offline files (if provided),
// uploads to Google Drive, and generates SQL updates (and attempts REST updates).
//
// Usage:
//   node scripts/migrate-to-gdrive.mjs --from-supabase                     # download from Supabase & upload to Drive
//   node scripts/migrate-to-gdrive.mjs --from-supabase --dry-run           # preview what would be migrated
//   node scripts/migrate-to-gdrive.mjs --from-supabase --resume            # resume from checkpoint
//   node scripts/migrate-to-gdrive.mjs --from-supabase --project 12        # migrate only project 12
//   node scripts/migrate-to-gdrive.mjs --local-dir <path>                  # migrate local files
//   node scripts/migrate-to-gdrive.mjs --local-dir <path> --dry-run        # preview matches only
//   node scripts/migrate-to-gdrive.mjs --local-dir <path> --resume         # resume from checkpoint
//   node scripts/migrate-to-gdrive.mjs --local-dir <path> --project 12     # migrate only project 12
// ────────────────────────────────────────────────────────────────────�// Load environment variables from .env.local if present
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf-8");
  for (const line of envText.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

// ── Configuration ────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lcycqyvlwtikbycbxwul.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GOOGLE_DRIVE_CLIENT_EMAIL = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
const GOOGLE_DRIVE_PRIVATE_KEY = process.env.GOOGLE_DRIVE_PRIVATE_KEY ? process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "16g6MWEZR89C2qZrub_Uy1h7GeJQutdz0";

const CSV_PATH = path.join(__dirname, "..", "public", "project_documents_rows.csv");
const CHECKPOINT_PATH = path.join(__dirname, "local-migration-checkpoint.json");
const REPORT_PATH = path.join(__dirname, "local-migration-report.json");
const SQL_PATH = path.join(__dirname, "update_documents.sql");

// ── CLI flags ────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const RESUME = process.argv.includes("--resume");
const FROM_SUPABASE = process.argv.includes("--from-supabase");
const PROJECT_FLAG_IDX = process.argv.indexOf("--project");
const ONLY_PROJECT =
  PROJECT_FLAG_IDX >= 0 ? process.argv[PROJECT_FLAG_IDX + 1] : null;

const LOCAL_DIR_FLAG_IDX = process.argv.indexOf("--local-dir");
const LOCAL_DIR =
  LOCAL_DIR_FLAG_IDX >= 0 ? process.argv[LOCAL_DIR_FLAG_IDX + 1] : null;

// ── Clients ──────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OAUTH_TOKEN_PATH = path.join(__dirname, "gdrive-oauth-token.json");
let drive;
let authMode;

if (fs.existsSync(OAUTH_TOKEN_PATH)) {
  // OAuth2 — uploads count against YOUR storage quota (5 TB)
  const creds = JSON.parse(fs.readFileSync(OAUTH_TOKEN_PATH, "utf-8"));
  const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret);
  oauth2Client.setCredentials({ refresh_token: creds.refresh_token });
  drive = google.drive({ version: "v3", auth: oauth2Client });
  authMode = "oauth2";
} else {
  // Fallback: Service Account (may fail with quota error on consumer accounts)
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: GOOGLE_DRIVE_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  drive = google.drive({ version: "v3", auth });
  authMode = "service-account";
}

// ── CSV Parser (simple, handles quoted fields) ───────────────────────
function parseCSV(csvText) {
  const lines = csvText.split("\n").filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Directory Scanner (recursive) ────────────────────────────────────
function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// ── Helpers ──────────────────────────────────────────────────────────
function guessMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".mp4": "video/mp4",
  };
  return map[ext] || "application/octet-stream";
}

/** Find or create a folder in Google Drive */
const folderCache = {};
async function getProjectFolder(projectId) {
  if (folderCache[projectId]) return folderCache[projectId];

  const q = [
    `name = '${projectId}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
    `trashed = false`,
  ].join(" and ");

  const res = await drive.files.list({ q, fields: "files(id)", spaces: "drive" });
  if (res.data.files && res.data.files.length > 0) {
    folderCache[projectId] = res.data.files[0].id;
    return res.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: projectId,
      mimeType: "application/vnd.google-apps.folder",
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    },
    fields: "id",
  });
  folderCache[projectId] = created.data.id;
  return created.data.id;
}

/** Upload local file stream to Google Drive */
async function uploadLocalToDrive(filePath, fileName, folderId, mimeType) {
  const stream = fs.createReadStream(filePath);

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: "id",
  });

  const fileId = res.data.id;

  // Make publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId,
    url: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

/** Download file from URL (fallback if needed) */
async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Upload buffer to Google Drive (fallback) */
async function uploadToDrive(buffer, fileName, folderId, mimeType) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: "id",
  });

  const fileId = res.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId,
    url: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

/** Sleep helper */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Load checkpoint */
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf-8"));
  }
  return { migratedIds: [] };
}

/** Save checkpoint */
function saveCheckpoint(checkpoint) {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2));
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   Supabase Storage → Google Drive Migration Script      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  if (authMode === "oauth2") {
    console.log("🔐 Auth: OAuth2 user credentials (your 5 TB storage quota)\n");
  } else {
    console.log("🔑 Auth: Service Account (⚠️ may have 0 storage quota)");
    console.log("   Run 'node scripts/gdrive-auth.mjs' first to use your personal quota.\n");
  }

  if (DRY_RUN) console.log("🔍 DRY RUN MODE — no changes will be written.\n");
  if (ONLY_PROJECT) console.log(`📌 Filtering to project: ${ONLY_PROJECT}\n`);
  if (FROM_SUPABASE) console.log("☁️  Mode: Download directly from Supabase URLs\n");

  if (!FROM_SUPABASE && !LOCAL_DIR) {
    console.error("❌ ERROR: Please specify either --from-supabase or --local-dir <path>");
    console.log("Examples:");
    console.log("  node scripts/migrate-to-gdrive.mjs --from-supabase");
    console.log("  node scripts/migrate-to-gdrive.mjs --local-dir C:\\path\\to\\documents");
    process.exit(1);
  }

  // ── Local file scanning (only when using --local-dir) ──
  let localFiles = [];
  let resolvedLocalDir = null;
  if (LOCAL_DIR) {
    resolvedLocalDir = path.resolve(LOCAL_DIR);
    if (!fs.existsSync(resolvedLocalDir)) {
      console.error(`❌ ERROR: Local directory not found: ${resolvedLocalDir}`);
      process.exit(1);
    }
    console.log(`📂 Scanning local directory: ${resolvedLocalDir}...`);
    localFiles = scanDir(resolvedLocalDir);
    console.log(`   Found ${localFiles.length} file(s) on disk.\n`);
  }

  // ── Load CSV ──
  console.log("📋 Loading CSV backup...");
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ ERROR: CSV backup file not found at ${CSV_PATH}`);
    process.exit(1);
  }
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  let rows = parseCSV(csvText);
  console.log(`   Found ${rows.length} total document(s) in CSV.\n`);

  // Filter to Supabase-hosted docs only
  rows = rows.filter((r) => r.url && r.url.includes("supabase.co/storage"));
  console.log(`   ${rows.length} Supabase-hosted document(s).\n`);

  // Filter by project if specified
  if (ONLY_PROJECT) {
    rows = rows.filter((r) => r.project_id === ONLY_PROJECT);
    console.log(`   ${rows.length} document(s) in CSV for project ${ONLY_PROJECT}.\n`);
  }

  // ── Build rows to process ──
  let rowsToProcess;

  if (FROM_SUPABASE) {
    // All rows are processable — we download directly from Supabase
    console.log(`☁️  All ${rows.length} document(s) will be downloaded from Supabase URLs.\n`);
    rowsToProcess = rows;
  } else {
    // Match CSV rows with local files
    console.log("🔄 Matching local files with CSV rows...");
    const matchedRows = [];
    const missingRows = [];

    for (const row of rows) {
      const supabaseFilename = row.url.split("/").pop();
      const decodedSupabaseFilename = decodeURIComponent(supabaseFilename);
      const cleanOriginalName = row.name;

      let localPath = localFiles.find((f) => {
        const base = path.basename(f);
        return base === supabaseFilename || base === decodedSupabaseFilename;
      });

      if (!localPath) {
        localPath = localFiles.find((f) => {
          const base = path.basename(f);
          const relative = path.relative(resolvedLocalDir, f);
          const parts = relative.split(path.sep);
          const isNameMatch = base === cleanOriginalName || base === decodeURIComponent(cleanOriginalName);
          const hasProjectFolder = parts.includes(row.project_id);
          return isNameMatch && hasProjectFolder;
        });
      }

      if (localPath) {
        matchedRows.push({ ...row, localPath });
      } else {
        missingRows.push(row);
      }
    }

    console.log(`   ✅ Matched: ${matchedRows.length} document(s)`);
    console.log(`   ❌ Missing: ${missingRows.length} document(s)\n`);
    rowsToProcess = matchedRows;
  }

  // ── Load checkpoint for resume ──
  let checkpoint = { migratedIds: [] };
  if (RESUME) {
    checkpoint = loadCheckpoint();
    const already = checkpoint.migratedIds.length;
    rowsToProcess = rowsToProcess.filter((r) => !checkpoint.migratedIds.includes(r.id));
    console.log(`♻️  Resuming — ${already} already done, ${rowsToProcess.length} remaining.\n`);
  }

  if (rowsToProcess.length === 0) {
    console.log("🎉 Nothing to migrate!");
    return;
  }

  // Initialize SQL output
  if (!DRY_RUN) {
    if (!RESUME || !fs.existsSync(SQL_PATH)) {
      fs.writeFileSync(
        SQL_PATH,
        "-- Supabase Migration SQL\n-- Run this in the Supabase Dashboard SQL Editor to update document paths\n\n"
      );
    }
  }

  // Group by project
  const byProject = {};
  rowsToProcess.forEach((r) => {
    if (!byProject[r.project_id]) byProject[r.project_id] = [];
    byProject[r.project_id].push(r);
  });

  const projectIds = Object.keys(byProject);
  console.log(`📦 Processing ${rowsToProcess.length} file(s) across ${projectIds.length} project(s).\n`);

  const results = { success: 0, failed: 0, errors: [] };
  let processed = 0;

  for (const projectId of projectIds) {
    const docs = byProject[projectId];
    console.log(`\n━━━ Project ${projectId} (${docs.length} files) ━━━`);

    let folderId;
    if (!DRY_RUN) {
      try {
        folderId = await getProjectFolder(projectId);
        console.log(`   📁 Drive folder ready: ${folderId}`);
      } catch (err) {
        console.error(`   ❌ Failed to create/find folder: ${err.message}`);
        docs.forEach((d) => results.errors.push({ id: d.id, name: d.name, error: err.message }));
        results.failed += docs.length;
        continue;
      }
    }

    for (const doc of docs) {
      processed++;
      const progress = `[${processed}/${rowsToProcess.length}]`;
      console.log(`\n${progress} "${doc.name}"`);

      if (FROM_SUPABASE) {
        console.log(`   Source: ${doc.url}`);
      } else {
        console.log(`   Disk Path: ${doc.localPath}`);
      }

      if (DRY_RUN) {
        console.log(`   ➡️  Would upload & generate SQL for document ID: ${doc.id}`);
        results.success++;
        continue;
      }

      try {
        const mimeType = guessMimeType(doc.name);
        let fileId, newUrl;

        if (FROM_SUPABASE) {
          // Download from Supabase → upload buffer to Google Drive
          process.stdout.write("   ⬇️  Downloading from Supabase... ");
          const buffer = await downloadFile(doc.url);
          const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
          console.log(`done (${sizeMB} MB)`);

          process.stdout.write("   ⬆️  Uploading to Google Drive... ");
          const result = await uploadToDrive(buffer, doc.name, folderId, mimeType);
          fileId = result.fileId;
          newUrl = result.url;
          console.log(`done (${fileId})`);
        } else {
          // Upload from local disk stream
          process.stdout.write("   ⬆️  Uploading stream to Google Drive... ");
          const result = await uploadLocalToDrive(doc.localPath, doc.name, folderId, mimeType);
          fileId = result.fileId;
          newUrl = result.url;
          console.log(`done (${fileId})`);
        }

        // Update DB via REST
        process.stdout.write("   💾 Updating database via REST... ");
        try {
          const { error: dbError } = await supabase
            .from("project_documents")
            .update({ url: newUrl, storage_path: fileId })
            .eq("id", parseInt(doc.id));

          if (dbError) throw dbError;
          console.log("REST success ✅");
        } catch (dbErr) {
          console.log(`failed ⚠️ [Using SQL fallback]`);
        }

        // Append to SQL file
        const sqlStatement = `UPDATE project_documents SET url = '${newUrl}', storage_path = '${fileId}' WHERE id = ${doc.id};\n`;
        fs.appendFileSync(SQL_PATH, sqlStatement);

        results.success++;
        checkpoint.migratedIds.push(doc.id);

        if (results.success % 5 === 0) {
          saveCheckpoint(checkpoint);
          console.log(`   💾 Checkpoint saved (${checkpoint.migratedIds.length} done)`);
        }
      } catch (err) {
        console.log(`   ❌ FAILED: ${err.message}`);
        results.failed++;
        results.errors.push({ id: doc.id, name: doc.name, project: projectId, error: err.message });
      }

      // Throttle to avoid rate limits (slightly longer for Supabase downloads)
      await sleep(FROM_SUPABASE ? 500 : 200);
    }
  }

  // 4. Save final checkpoint & report
  if (!DRY_RUN) {
    saveCheckpoint(checkpoint);
    fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
  }

  // 5. Summary
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("                    MIGRATION SUMMARY                  ");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Total CSV documents:       ${rows.length}`);
  console.log(`  Attempted to process:      ${rowsToProcess.length}`);
  console.log(`  ✅ Successfully migrated:  ${results.success}`);
  console.log(`  ❌ Failed:                 ${results.failed}`);
  console.log("═══════════════════════════════════════════════════════");

  if (DRY_RUN) {
    console.log("\n💡 This was a dry run. Run without --dry-run to perform the actual migration.");
  } else {
    console.log(`\n🎉 Processed. Generated SQL updates written to: ${SQL_PATH}`);
    console.log("👉 If REST updates succeeded, the DB is already updated.");
    console.log("   Otherwise, copy the SQL file and run it in the Supabase Dashboard SQL Editor.");
    if (results.failed > 0) {
      console.log(`⚠️  ${results.failed} files failed. Run with --resume to retry them.`);
    }
  }
}

main().catch((err) => {
  console.error("💥 Unexpected error:", err);
  process.exit(1);
});
