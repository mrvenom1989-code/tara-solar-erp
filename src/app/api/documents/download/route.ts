// src/app/api/documents/download/route.ts
// Server-side download proxy for Google Drive files
// Used when direct Drive links are blocked or for private files
import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/gdrive";

export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "No fileId provided" },
        { status: 400 }
      );
    }

    const drive = getDriveClient();

    // 1. Get file metadata (name + mimeType)
    const meta = await drive.files.get({
      fileId,
      fields: "name, mimeType, size",
      supportsAllDrives: true,
    });

    const fileName = meta.data.name || "download";
    const mimeType = meta.data.mimeType || "application/octet-stream";

    // 2. Download file content as stream
    const response = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // 3. Return as downloadable response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Google Drive download error:", error);

    if (error?.code === 404 || error?.status === 404) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Download failed" },
      { status: 500 }
    );
  }
}
