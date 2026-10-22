import { NextResponse } from "next/server";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { MAX_BANNER_IMAGE_SIZE_MB } from "@/lib/upload-limits";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = (formData.get("folder") as string) || "kalawar_media";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const isProductUpload =
      requestedFolder === "wsf_products" ||
      requestedFolder.toLowerCase().includes("product");
    const isBannerUpload = requestedFolder === "kalawar_banners";
    const maxMb = isProductUpload ? 10 : isBannerUpload ? MAX_BANNER_IMAGE_SIZE_MB : 2;
    const maxAllowedBytes = maxMb * 1024 * 1024;

    if (file.size > maxAllowedBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the ${maxMb}MB limit. Please upload a file ${maxMb}MB or smaller.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileNameLower = file.name.toLowerCase();
    const isDocument =
      fileNameLower.endsWith(".pdf") ||
      fileNameLower.endsWith(".docx") ||
      fileNameLower.endsWith(".doc") ||
      fileNameLower.endsWith(".zip") ||
      fileNameLower.endsWith(".xlsx") ||
      fileNameLower.endsWith(".xls") ||
      fileNameLower.endsWith(".csv");

    // 1. Documents (PDFs, DOCX, ZIP, Spreadsheets):
    // Saved locally in public/uploads/documents/ for direct reliable downloads without Cloudinary PDF access restrictions
    if (isDocument) {
      const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, cleanFileName), buffer);

      const localUrl = `/uploads/documents/${cleanFileName}`;

      return NextResponse.json({
        success: true,
        url: localUrl,
        publicId: cleanFileName,
        filename: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        provider: "local",
      });
    }

    // 2. Images & Videos (JPG, PNG, WEBP, GIF, SVG, AVIF, MP4):
    // Primary: Upload directly to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadImageToCloudinary(buffer, requestedFolder);
        return NextResponse.json({
          success: true,
          url: result.url,
          publicId: result.public_id,
          filename: file.name,
          size: file.size,
          type: file.type || "image/jpeg",
          provider: "cloudinary",
        });
      } catch (cloudErr: any) {
        console.warn("Cloudinary upload failed, falling back to local file storage:", cloudErr?.message || cloudErr);
      }
    }

    // 3. Fallback / Offline Storage: Save file to local public/uploads/media directory
    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "media");

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, cleanFileName), buffer);

    const localUrl = `/uploads/media/${cleanFileName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      publicId: cleanFileName,
      filename: file.name,
      size: file.size,
      type: file.type || "image/jpeg",
      provider: "local",
    });
  } catch (error: any) {
    console.error("Upload error in /api/upload:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
