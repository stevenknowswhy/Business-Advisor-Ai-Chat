import * as React from "react";
import { useMutation, useAction } from "convex/react";
// import { api } from "../../../convex/_generated/api";

// Types for the advisor wizard
export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

export interface AdvisorFormData {
  // Step 1: Identity
  name: string;
  title: string;
  oneLiner: string;
  imageUrl?: string;
  tags: string[];

  // Step 2: Expertise
  specialties: string[];
  expertise: string[];
  personality: string[];

  // Step 3: Role
  mission: string;
  scopeIn: string;
  scopeOut: string;
  adviceStyle: string;

  // Step 4: Review
  // This step just shows the preview
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Basic information about your advisor"
  },
  {
    id: "expertise",
    title: "Expertise",
    description: "Specialized skills and personality traits"
  },
  {
    id: "role",
    title: "Role",
    description: "Mission scope and advisory style"
  },
  {
    id: "review",
    title: "Review",
    description: "Preview and create your advisor"
  }
];

const PERSONALITY_TRAITS = [
  "Analytical", "Creative", "Strategic", "Practical", "Visionary",
  "Detail-oriented", "Big-picture", "Collaborative", "Independent",
  "Mentor", "Coach", "Advisor", "Consultant", "Partner"
];

const EXPERTISE_AREAS = [
  "Business Strategy", "Marketing", "Sales", "Finance", "Operations",
  "Technology", "Product Management", "Design", "Leadership",
  "Fundraising", "Growth", "Innovation", "Data Analysis"
];

interface AdvisorWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvisorCreated?: (advisorId: string) => void;
}

export function AdvisorWizardDialog({ open, onOpenChange, onAdvisorCreated }: AdvisorWizardDialogProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<AdvisorFormData>({
    name: "",
    title: "",
    oneLiner: "",
    tags: [],
    specialties: [],
    expertise: [],
    personality: [],
    mission: "",
    scopeIn: "",
    scopeOut: "",
    adviceStyle: ""
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // const createAdvisor = useMutation(api.advisors.createAdvisorFromTeam);

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Identity
        if (!formData.name.trim()) {
          newErrors.name = "Name is required";
        }
        if (!formData.title.trim()) {
          newErrors.title = "Title is required";
        }
        if (!formData.oneLiner.trim()) {
          newErrors.oneLiner = "One-liner is required";
        }
        break;
      case 1: // Expertise
        if (formData.expertise.length === 0) {
          newErrors.expertise = "At least one expertise area is required";
        }
        if (formData.personality.length === 0) {
          newErrors.personality = "At least one personality trait is required";
        }
        break;
      case 2: // Role
        if (!formData.mission.trim()) {
          newErrors.mission = "Mission is required";
        }
        if (!formData.scopeIn.trim()) {
          newErrors.scopeIn = "Scope in is required";
        }
        if (!formData.adviceStyle.trim()) {
          newErrors.adviceStyle = "Advice style is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Mock implementation - replace with actual Convex mutation when types are available
      console.log("Creating advisor:", {
        name: formData.name,
        title: formData.title,
        oneLiner: formData.oneLiner,
        expertise: formData.expertise,
        persona: {
          name: formData.name,
          title: formData.title,
          oneLiner: formData.oneLiner,
          description: formData.mission,
          expertise: formData.expertise,
          personality: formData.personality,
          specialties: formData.specialties,
        },
        userId: "current-user-id",
        source: "custom"
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAdvisorId = `advisor_${Date.now()}`;
      onAdvisorCreated?.(mockAdvisorId);
      onOpenChange(false);
      // Reset form
      setCurrentStep(0);
      setFormData({
        name: "",
        title: "",
        oneLiner: "",
        tags: [],
        specialties: [],
        expertise: [],
        personality: [],
        mission: "",
        scopeIn: "",
        scopeOut: "",
        adviceStyle: ""
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to create advisor:", error);
      setErrors({ submit: "Failed to create advisor. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof AdvisorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleArrayItem = (field: keyof AdvisorFormData, item: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(item)) {
      updateFormData(field, currentArray.filter(i => i !== item));
    } else {
      updateFormData(field, [...currentArray, item]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Identity
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Advisor Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Sarah Chen"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., CEO & Growth Strategist"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="mt-1 text-sm text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="oneLiner" className="block text-sm font-medium text-gray-700 mb-2">
                One-Liner Description *
              </label>
              <textarea
                id="oneLiner"
                value={formData.oneLiner}
                onChange={(e) => updateFormData("oneLiner", e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.oneLiner ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Brief description of their expertise..."
                aria-invalid={!!errors.oneLiner}
                aria-describedby={errors.oneLiner ? "oneLiner-error" : undefined}
              />
              {errors.oneLiner && (
                <p id="oneLiner-error" className="mt-1 text-sm text-red-600">
                  {errors.oneLiner}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {["business", "marketing", "technology", "finance", "leadership"].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleArrayItem("tags", tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      formData.tags.includes(tag)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Expertise
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expertise Areas *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXPERTISE_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArrayItem("expertise", area)}
                    className={`px-3 py-2 rounded-md text-sm text-left ${
                      formData.expertise.includes(area)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    } border`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              {errors.expertise && (
                <p className="mt-1 text-sm text-red-600">{errors.expertise}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personality Traits *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {PERSONALITY_TRAITS.map(trait => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => toggleArrayItem("personality", trait)}
                    className={`px-3 py-2 rounded-md text-sm ${
                      formData.personality.includes(trait)
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    } border`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
              {errors.personality && (
                <p className="mt-1 text-sm text-red-600">{errors.personality}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties (optional)
              </label>
              <input
                type="text"
                value={formData.specialties.join(", ")}
                onChange={(e) => updateFormData("specialties",
                  e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., SaaS scaling, fundraising, UX research..."
              />
            </div>
          </div>
        );

      case 2: // Role
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="mission" className="block text-sm font-medium text-gray-700 mb-2">
                Mission *
              </label>
              <textarea
                id="mission"
                value={formData.mission}
                onChange={(e) => updateFormData("mission", e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mission ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="What is this advisor's primary mission?"
                aria-invalid={!!errors.mission}
                aria-describedby={errors.mission ? "mission-error" : undefined}
              />
              {errors.mission && (
                <p id="mission-error" className="mt-1 text-sm text-red-600">
                  {errors.mission}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="scopeIn" className="block text-sm font-medium text-gray-700 mb-2">
                Scope In *
              </label>
              <textarea
                id="scopeIn"
                value={formData.scopeIn}
                onChange={(e) => updateFormData("scopeIn", e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.scopeIn ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="What areas does this advisor focus on?"
                aria-invalid={!!errors.scopeIn}
                aria-describedby={errors.scopeIn ? "scopeIn-error" : undefined}
              />
              {errors.scopeIn && (
                <p id="scopeIn-error" className="mt-1 text-sm text-red-600">
                  {errors.scopeIn}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="scopeOut" className="block text-sm font-medium text-gray-700 mb-2">
                Scope Out (optional)
              </label>
              <textarea
                id="scopeOut"
                value={formData.scopeOut}
                onChange={(e) => updateFormData("scopeOut", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What areas is this advisor NOT focused on?"
              />
            </div>

            <div>
              <label htmlFor="adviceStyle" className="block text-sm font-medium text-gray-700 mb-2">
                Advice Style *
              </label>
              <select
                id="adviceStyle"
                value={formData.adviceStyle}
                onChange={(e) => updateFormData("adviceStyle", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.adviceStyle ? "border-red-500" : "border-gray-300"
                }`}
                aria-invalid={!!errors.adviceStyle}
                aria-describedby={errors.adviceStyle ? "adviceStyle-error" : undefined}
              >
                <option value="">Select advice style...</option>
                <option value="Direct and actionable">Direct and actionable</option>
                <option value="Supportive and encouraging">Supportive and encouraging</option>
                <option value="Analytical and data-driven">Analytical and data-driven</option>
                <option value="Strategic and big-picture">Strategic and big-picture</option>
                <option value="Practical and hands-on">Practical and hands-on</option>
              </select>
              {errors.adviceStyle && (
                <p id="adviceStyle-error" className="mt-1 text-sm text-red-600">
                  {errors.adviceStyle}
                </p>
              )}
            </div>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Advisor Preview</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2">{formData.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="ml-2">{formData.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <span className="ml-2">{formData.oneLiner}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Expertise:</span>
                  <span className="ml-2">{formData.expertise.join(", ")}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mission:</span>
                  <span className="ml-2">{formData.mission}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Review the information above. When you click "Create Advisor", this advisor will be added to your collection and available for conversations.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 id="wizard-title" className="text-xl font-semibold">
            Create Custom Advisor
          </h2>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </span>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close wizard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex space-x-1">
                {WIZARD_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded ${
                      index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step titles */}
            <div className="mt-3">
              <h3 className="font-medium text-gray-900">
                {WIZARD_STEPS[currentStep]?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {WIZARD_STEPS[currentStep]?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {renderStep()}

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Advisor"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvisorWizardDialog;