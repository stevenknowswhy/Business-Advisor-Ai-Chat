import * as React from "react";
import type { Project } from "~/features/projects/hooks/useProjects";
import { ImageUpload } from "~/components/uploads/ImageUpload";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: Project) => void;
}

const colorOptions = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
];

const iconOptions = [
  { name: "Folder", emoji: "📁" },
  { name: "Briefcase", emoji: "💼" },
  { name: "Rocket", emoji: "🚀" },
  { name: "Star", emoji: "⭐" },
  { name: "Heart", emoji: "❤️" },
  { name: "Fire", emoji: "🔥" },
  { name: "Lightning", emoji: "⚡" },
  { name: "Diamond", emoji: "💎" },
];

export function ProjectCreateModal({
  isOpen,
  onClose,
  onSuccess
}: ProjectCreateModalProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    tags: "",
    color: colorOptions[0]?.value || "#3B82F6",
    icon: iconOptions[0]?.emoji || "📁",
    iconUrl: "", // For uploaded images
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        name: "",
        description: "",
        tags: "",
        color: colorOptions[0]?.value || "#3B82F6",
        icon: iconOptions[0]?.emoji || "📁",
        iconUrl: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Project name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          color: formData.color,
          icon: formData.iconUrl ? undefined : formData.icon, // Only send emoji if no custom icon
          iconUrl: formData.iconUrl || undefined, // Send custom icon URL if available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const project = await response.json();
      onSuccess?.(project);
      onClose();
    } catch (error: any) {
      setErrors({ form: error.message || "Failed to create project" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : ""
              }`}
              placeholder="Enter project name"
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.description ? "border-red-500" : ""
              }`}
              placeholder="Enter project description (optional)"
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tags separated by commas (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separate multiple tags with commas (e.g., marketing, sales, urgent)
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange("color", color.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? "border-gray-400 ring-2 ring-offset-2 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-full h-6 rounded"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-xs text-gray-600 mt-1">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Icon
            </label>

            {/* Image Upload */}
            <div className="mb-4">
              <ImageUpload
                currentImage={formData.iconUrl}
                onImageChange={(url) => handleInputChange("iconUrl", url)}
                onImageRemove={() => handleInputChange("iconUrl", "")}
                endpoint="project-icon"
                className="w-32 h-32"
                placeholder="Upload icon"
                showPreview={true}
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload a custom icon or choose from the emoji options below.
              </p>
            </div>

            {/* Emoji Options */}
            <div className="grid grid-cols-4 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon.emoji}
                  type="button"
                  onClick={() => {
                    handleInputChange("icon", icon.emoji);
                    handleInputChange("iconUrl", ""); // Clear uploaded image when emoji is selected
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-2xl ${
                    formData.icon === icon.emoji && !formData.iconUrl
                      ? "border-gray-400 ring-2 ring-offset-2 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Form Error */}
          {errors.form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.form}</p>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                {formData.iconUrl ? (
                  <img
                    src={formData.iconUrl}
                    alt="Project icon"
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <span className="text-lg">{formData.icon}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formData.name || "Project Name"}
                </p>
                {formData.description && (
                  <p className="text-xs text-gray-500">{formData.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}