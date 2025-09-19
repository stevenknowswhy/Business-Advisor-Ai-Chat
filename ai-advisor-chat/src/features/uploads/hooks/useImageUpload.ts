import * as React from "react";

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  downloadUrl?: string;
  pathname?: string;
  size?: number;
  type?: string;
  dimensions?: { width: number; height: number };
  error?: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxDimension?: number; // in pixels
  onUploadStart?: () => void;
  onUploadComplete?: (result: ImageUploadResult) => void;
  onUploadError?: (error: string) => void;
}

export function useImageUpload(options: ImageUploadOptions = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxDimension = 800,
    onUploadStart,
    onUploadComplete,
    onUploadError,
  } = options;

  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const uploadImage = async (
    file: File,
    endpoint: string = "/api/upload/advisor-avatar"
  ): Promise<ImageUploadResult> => {
    // Validate file
    if (!allowedTypes.includes(file.type)) {
      const error = `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
      onUploadError?.(error);
      return { success: false, error };
    }

    if (file.size > maxSize) {
      const error = `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
      onUploadError?.(error);
      return { success: false, error };
    }

    // Check dimensions
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width > maxDimension || dimensions.height > maxDimension) {
        const error = `Image dimensions too large. Maximum size is ${maxDimension}x${maxDimension} pixels.`;
        onUploadError?.(error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to validate image";
      onUploadError?.(errorMessage);
      return { success: false, error: errorMessage };
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      onUploadStart?.();
      setIsUploading(true);
      setProgress(0);

      // Simulate progress (since fetch doesn't provide progress for simple uploads)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image");
      }

      onUploadComplete?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const uploadAdvisorAvatar = (file: File): Promise<ImageUploadResult> => {
    return uploadImage(file, "/api/upload/advisor-avatar");
  };

  const uploadProjectIcon = (file: File): Promise<ImageUploadResult> => {
    return uploadImage(file, "/api/upload/project-icon");
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    uploadImage,
    uploadAdvisorAvatar,
    uploadProjectIcon,
    isUploading,
    progress,
    previewUrl,
    clearPreview,
  };
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