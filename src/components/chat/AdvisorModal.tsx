"use client";

import { useState, useRef } from "react";
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { type Advisor } from "~/lib/chat";

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advisorData: AdvisorFormData) => Promise<void>;
  advisor?: Advisor | null; // For editing existing advisor
  isLoading?: boolean;
}

export interface AdvisorFormData {
  firstName: string;
  lastName: string;
  title: string;
  jsonConfiguration: string;
  image?: File | string; // File for new upload, string URL for existing
}

export function AdvisorModal({ isOpen, onClose, onSave, advisor, isLoading }: AdvisorModalProps) {
  const [formData, setFormData] = useState<AdvisorFormData>({
    firstName: advisor?.name?.split(' ')[0] || "",
    lastName: advisor?.name?.split(' ').slice(1).join(' ') || "",
    title: advisor?.title || "",
    jsonConfiguration: advisor ? JSON.stringify(advisor, null, 2) : "",
    image: advisor?.image || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jsonError, setJsonError] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    typeof formData.image === "string" ? formData.image : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateJSON = () => {
    if (!formData.jsonConfiguration.trim()) {
      setJsonError("JSON configuration is required");
      return false;
    }

    try {
      JSON.parse(formData.jsonConfiguration);
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError(`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title/Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && validateJSON();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: "Please select a valid image file" }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: "Image must be less than 5MB" }));
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      setErrors(prev => ({ ...prev, image: "" }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        title: "",
        jsonConfiguration: "",
        image: undefined,
      });
      setImagePreview(null);
      setErrors({});
      setJsonError("");
    } catch (error) {
      console.error("Failed to save advisor:", error);
      // Could add toast notification here
    }
  };

  const handleCancel = () => {
    onClose();
    // Reset form to original state
    setFormData({
      firstName: advisor?.name?.split(' ')[0] || "",
      lastName: advisor?.name?.split(' ').slice(1).join(' ') || "",
      title: advisor?.title || "",
      jsonConfiguration: advisor ? JSON.stringify(advisor, null, 2) : "",
      image: advisor?.image || undefined,
    });
    setImagePreview(typeof advisor?.image === "string" ? advisor.image : null);
    setErrors({});
    setJsonError("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisor-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="advisor-modal-title" className="text-xl font-semibold text-gray-900">
            {advisor ? "Edit Advisor" : "Add New Advisor"}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
            title="Close modal"
            aria-label="Close advisor modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.firstName ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.lastName ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title/Role *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="e.g., Senior Product Manager, Marketing Director"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advisor Avatar (Optional)
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border border-gray-300"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={isLoading}
                  aria-label="Upload advisor avatar image"
                  title="Select an image file for the advisor avatar"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  <PhotoIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </span>
                </button>
              </div>
            </div>
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: JPG, PNG, WebP. Max size: 5MB.
            </p>
          </div>

          {/* JSON Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="jsonConfig" className="block text-sm font-medium text-gray-700">
                JSON Configuration *
              </label>
              <button
                type="button"
                onClick={validateJSON}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                disabled={isLoading}
              >
                Validate JSON
              </button>
            </div>
            <textarea
              id="jsonConfig"
              value={formData.jsonConfiguration}
              onChange={(e) => setFormData(prev => ({ ...prev, jsonConfiguration: e.target.value }))}
              rows={12}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                jsonError ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter valid JSON configuration for the advisor..."
              disabled={isLoading}
            />
            {jsonError && (
              <div className="mt-1 flex items-start space-x-2 text-sm text-red-600">
                <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.firstName.trim() || !formData.lastName.trim() || !formData.title.trim() || !formData.jsonConfiguration.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckIcon className="w-4 h-4" />
                  <span>{advisor ? "Update Advisor" : "Create Advisor"}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
