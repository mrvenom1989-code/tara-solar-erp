// src/lib/gdrive.ts
// Shared Google Drive client using a Service Account
// ─────────────────────────────────────────────────────────
import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// ── Singleton auth + client ──────────────────────────────

let _drive: drive_v3.Drive | null = null;

export function getDriveClient(): drive_v3.Drive {
  if (_drive) return _drive;

  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing GOOGLE_DRIVE_CLIENT_EMAIL or GOOGLE_DRIVE_PRIVATE_KEY in environment variables."
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

// ── Helpers ──────────────────────────────────────────────

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
