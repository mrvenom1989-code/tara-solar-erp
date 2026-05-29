// src/app/api/documents/upload/route.ts
// Server-side upload to Google Drive using Service Account
import { NextRequest, NextResponse } from "next/server";
import {
  getDriveClient,
  findOrCreateFolder,
  makeFilePublic,
  getDirectDownloadUrl,
  bufferToStream,
} from "@/lib/gdrive";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string; // project id

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) {
      return NextResponse.json(
        { error: "Google Drive folder not configured" },
        { status: 500 }
      );
    }

    const drive = getDriveClient();

    // 1. Find or create the project sub-folder
    const projectFolderId = await findOrCreateFolder(
      drive,
      folder,
      rootFolderId
    );

    // 2. Upload the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [projectFolderId],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: bufferToStream(buffer),
      },
      fields: "id, name, webViewLink",
      // Required for Shared Drives; harmless for personal Drive
      supportsAllDrives: true,
    });

    const fileId = driveResponse.data.id!;

    // 3. Make the file publicly accessible (anyone with link can view)
    await makeFilePublic(drive, fileId);

    // 4. Build a direct download URL
    const url = getDirectDownloadUrl(fileId);

    return NextResponse.json({ fileId, url });
  } catch (error: any) {
    console.error("Google Drive upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
