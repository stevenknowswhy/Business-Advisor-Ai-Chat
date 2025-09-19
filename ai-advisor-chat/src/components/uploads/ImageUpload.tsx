import * as React from "react";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useImageUpload, type ImageUploadResult } from "~/features/uploads/hooks/useImageUpload";

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove?: () => void;
  endpoint?: "advisor-avatar" | "project-icon";
  className?: string;
  disabled?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  maxDimension?: number;
  placeholder?: string;
  showPreview?: boolean;
}

export function ImageUpload({
  currentImage,
  onImageChange,
  onImageRemove,
  endpoint = "advisor-avatar",
  className = "",
  disabled = false,
  maxSize,
  allowedTypes,
  maxDimension,
  placeholder = "Upload image",
  showPreview = true,
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const getEndpointConfig = () => {
    switch (endpoint) {
      case "project-icon":
        return {
          endpoint: "/api/upload/project-icon",
          maxSize: maxSize || 2 * 1024 * 1024, // 2MB
          maxDimension: maxDimension || 200,
          allowedTypes: allowedTypes || ["image/jpeg", "image/png", "image/webp", "image/gif"],
        };
      default:
        return {
          endpoint: "/api/upload/advisor-avatar",
          maxSize: maxSize || 5 * 1024 * 1024, // 5MB
          maxDimension: maxDimension || 800,
          allowedTypes: allowedTypes || ["image/jpeg", "image/png", "image/webp", "image/gif"],
        };
    }
  };

  const config = getEndpointConfig();

  const { uploadImage, isUploading, progress, previewUrl, clearPreview } = useImageUpload({
    maxSize: config.maxSize,
    allowedTypes: config.allowedTypes,
    maxDimension: config.maxDimension,
    onUploadStart: () => {
      setError(null);
    },
    onUploadComplete: (result: ImageUploadResult) => {
      if (result.success && result.url) {
        onImageChange(result.url);
        clearPreview();
      } else {
        setError(result.error || "Upload failed");
      }
    },
    onUploadError: (errorMessage: string) => {
      setError(errorMessage);
    },
  });

  const handleFileSelect = async (file: File) => {
    const result = await uploadImage(file, config.endpoint);
    return result;
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onImageRemove) {
      onImageRemove();
    } else {
      onImageChange("");
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={config.allowedTypes.join(",")}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-all cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
          ${error ? "border-red-500 bg-red-50" : ""}
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {displayImage && showPreview ? (
          <div className="relative">
            {/* Image Preview */}
            <div className="aspect-square w-full overflow-hidden rounded-lg">
              <img
                src={displayImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="text-white text-center p-4">
                <CloudArrowUpIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Click to change image</p>
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              disabled={disabled || isUploading}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            {/* Upload Progress */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-16 h-16 mx-auto mb-2">
                    <svg className="animate-spin w-full h-full text-white" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm">{progress}%</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            {isUploading ? (
              <div className="text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg className="animate-spin w-full h-full text-gray-400" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Uploading...</p>
                <p className="text-xs text-gray-500 mt-1">{progress}%</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-700 mb-1">{placeholder}</p>
                <p className="text-xs text-gray-500">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max size: {formatFileSize(config.maxSize)} • Max dimension: {config.maxDimension}px
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Help Text */}
      {!error && !displayImage && (
        <p className="mt-2 text-xs text-gray-500">
          Supported formats: {config.allowedTypes.join(", ").replace(/image\//g, "")}
        </p>
      )}
    </div>
  );
}