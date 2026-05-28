#!/usr/bin/env node
// scripts/gdrive-auth.mjs
// ─────────────────────────────────────────────────────────────────────
// One-time OAuth2 setup to get a refresh token for Google Drive.
// This ensures uploads count against YOUR personal storage quota (5 TB)
// instead of the Service Account's (0 GB for consumer accounts).
//
// Prerequisites:
//   1. Go to https://console.cloud.google.com/apis/credentials
//      (Select the "tara-solar" project)
//   2. Click "Create Credentials" → "OAuth 2.0 Client ID"
//   3. Application type: "Desktop app"
//   4. Copy the Client ID and Client Secret
//
// Usage:
//   node scripts/gdrive-auth.mjs --client-id YOUR_ID --client-secret YOUR_SECRET
// ─────────────────────────────────────────────────────────────────────

import http from "http";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, "gdrive-oauth-token.json");
const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// ── Parse CLI args ───────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const CLIENT_ID = getArg("--client-id");
const CLIENT_SECRET = getArg("--client-secret");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║          Google Drive OAuth2 Setup                      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log("❌ Missing credentials. Usage:\n");
  console.log(
    '  node scripts/gdrive-auth.mjs --client-id "YOUR_CLIENT_ID" --client-secret "YOUR_CLIENT_SECRET"\n'
  );
  console.log("To get these credentials:");
  console.log("  1. Go to https://console.cloud.google.com/apis/credentials");
  console.log('  2. Select the "tara-solar" project');
  console.log('  3. Click "Create Credentials" → "OAuth 2.0 Client ID"');
  console.log('  4. Application type: "Desktop app"');
  console.log("  5. Copy the Client ID and Client Secret\n");
  console.log("If you see an OAuth consent screen warning:");
  console.log('  - Go to "OAuth consent screen" in GCP Console');
  console.log('  - Set the app to "External" and publish it (or add yourself as a test user)');
  process.exit(1);
}

// ── OAuth2 Client ────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
  prompt: "consent",
});

// ── Local callback server ────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname !== "/callback") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<p>Waiting for OAuth callback...</p>");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<h1>❌ Error</h1><p>${error}</p>`);
    console.error(`\n❌ Authorization error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h1>❌ No authorization code received</h1>");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Save credentials (client_id + secret + refresh token)
    const savedCreds = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
    };

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(savedCreds, null, 2));

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h1>✅ Authorization Successful!</h1><p>You can close this tab and return to the terminal.</p>"
    );

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   ✅ Authorization Successful!                          ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log(`\n   Token saved to: ${TOKEN_PATH}`);
    console.log("\n   You can now run the migration:");
    console.log(
      "   node scripts/migrate-to-gdrive.mjs --from-supabase\n"
    );

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h1>❌ Failed</h1><p>${err.message}</p>`);
    console.error(`\n❌ Token exchange failed: ${err.message}`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║          Google Drive OAuth2 Setup                      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log("🔐 Opening browser for Google authorization...\n");
  console.log("If the browser doesn't open, visit this URL manually:\n");
  console.log(`${authUrl}\n`);
  console.log(`Waiting for callback on http://localhost:${PORT}...`);

  // Open browser (Windows)
  exec(`start "" "${authUrl}"`);
});
