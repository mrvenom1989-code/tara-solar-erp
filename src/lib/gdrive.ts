// src/lib/gdrive.ts
// Shared Google Drive client
//
// Auth priority:
//   1. OAuth2 (GOOGLE_DRIVE_OAUTH_CLIENT_ID + _CLIENT_SECRET + _REFRESH_TOKEN)
//      → Uploads count against your personal Google storage quota (15 GB+).
//      → Required when the target folder is on personal Google Drive.
//   2. Service Account (GOOGLE_DRIVE_CLIENT_EMAIL + GOOGLE_DRIVE_PRIVATE_KEY)
//      → Falls back only when OAuth2 vars are absent.
//      → Only works with Shared Drives, NOT personal Drive folders.
// ─────────────────────────────────────────────────────────────────────
import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// ── Singleton auth + client ──────────────────────────────────────────

let _drive: drive_v3.Drive | null = null;

export function getDriveClient(): drive_v3.Drive {
  if (_drive) return _drive;

  const oauthClientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN;

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    // ── OAuth2 path (preferred) ──────────────────────────────────────
    // Uploads are made as your Google user account → uses your quota.
    const oauth2Client = new google.auth.OAuth2(oauthClientId, oauthClientSecret);
    oauth2Client.setCredentials({ refresh_token: oauthRefreshToken });
    _drive = google.drive({ version: "v3", auth: oauth2Client });
    return _drive;
  }

  // ── Service Account fallback ─────────────────────────────────────
  // NOTE: Service Accounts have 0 storage quota on personal Google Drive.
  // This path only works if the target folder is inside a Shared Drive
  // where the service account is a member.
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Drive is not configured. Set either:\n" +
      "  GOOGLE_DRIVE_OAUTH_CLIENT_ID + GOOGLE_DRIVE_OAUTH_CLIENT_SECRET + GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN\n" +
      "  or: GOOGLE_DRIVE_CLIENT_EMAIL + GOOGLE_DRIVE_PRIVATE_KEY"
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  _drive = google.drive({ version: "v3", auth });
  return _drive;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Find an existing sub-folder by name inside a parent, or create one.
 * Returns the folder ID.
 */
export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  // Search for existing folder
  const query = [
    `name = '${folderName}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `'${parentFolderId}' in parents`,
    `trashed = false`,
  ].join(" and ");

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    // Required to query inside Shared Drives (harmless for personal Drive)
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Create new folder
  const folderRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
    // Required to create inside Shared Drives (harmless for personal Drive)
    supportsAllDrives: true,
  });

  return folderRes.data.id!;
}

/**
 * Make a file publicly readable (anyone with the link can view).
 */
export async function makeFilePublic(
  drive: drive_v3.Drive,
  fileId: string
): Promise<void> {
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
    // Required for Shared Drives (harmless for personal Drive)
    supportsAllDrives: true,
  });
}

/**
 * Build a direct-download URL for a Google Drive file.
 * This works for publicly shared files.
 */
export function getDirectDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Build a web-view URL for a Google Drive file (opens in browser).
 */
export function getWebViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Convert a Buffer / ArrayBuffer into a Node.js Readable stream.
 */
export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
