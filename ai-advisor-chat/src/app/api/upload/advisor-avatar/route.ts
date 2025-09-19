import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_DIMENSION = 800; // Max width/height in pixels

// Request schema
const uploadSchema = z.object({
  file: z.instanceof(File),
});

export async function POST(req: NextRequest) {
  console.log("=== ADVISOR AVATAR UPLOAD START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validationResult = uploadSchema.safeParse({ file });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid file", details: validationResult.error },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed types: JPEG, PNG, WebP, GIF",
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // Check image dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      return NextResponse.json(
        {
          error: `Image dimensions too large. Maximum size is ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.`,
          dimensions: { width: dimensions.width, height: dimensions.height }
        },
        { status: 400 }
      );
    }

    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
      dimensions: dimensions,
    });

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `advisor-avatar-${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("File uploaded successfully:", {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      size: file.size,
      type: file.type,
      dimensions,
    });

  } catch (error) {
    console.error("Advisor avatar upload error:", error);

    // Handle specific Vercel Blob errors
    if (error instanceof Error) {
      if (error.message.includes("BLOB_READ_WRITE_TOKEN")) {
        return NextResponse.json(
          { error: "Storage configuration error. Please contact support." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Failed to upload file", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Helper function to get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}