// src/app/api/documents/delete/route.ts
// Server-side delete from Google Drive using Service Account
import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/gdrive";

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "No fileId provided" },
        { status: 400 }
      );
    }

    const drive = getDriveClient();

    await drive.files.delete({ fileId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // If the file is already gone (404), treat as success
    if (error?.code === 404 || error?.status === 404) {
      return NextResponse.json({ success: true, note: "File already deleted" });
    }

    console.error("Google Drive delete error:", error);
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}
