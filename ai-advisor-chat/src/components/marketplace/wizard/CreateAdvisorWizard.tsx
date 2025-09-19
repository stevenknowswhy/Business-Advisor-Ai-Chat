"use client";

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { Upload, X, Plus, Eye, Download, Save } from 'lucide-react';

// Step 1: Identity Schema
const identitySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  avatarUrl: z.string().url().optional().nullable(),
});

// Step 2: Expertise Schema
const expertiseSchema = z.object({
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  expertise: z.array(z.string()).min(1, 'At least one area of expertise is required'),
  personalityTraits: z.array(z.string()).min(1, 'At least one personality trait is required'),
  experience: z.string().min(10, 'Experience description must be at least 10 characters'),
});

// Step 3: Role Schema
const roleSchema = z.object({
  mission: z.string().min(10, 'Mission must be at least 10 characters'),
  scopeIn: z.array(z.string()).min(1, 'At least one "in scope" item is required'),
  scopeOut: z.array(z.string()).min(1, 'At least one "out of scope" item is required'),
  kpis: z.array(z.string()).min(1, 'At least one KPI is required'),
  adviceStyle: z.string().min(1, 'Advice style is required'),
  voice: z.string().min(1, 'Voice/tone is required'),
});

// Complete Advisor Schema
const advisorSchema = z.object({
  ...identitySchema.shape,
  ...expertiseSchema.shape,
  ...roleSchema.shape,
  schemaVersion: z.string().default('1.0.0'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

type AdvisorFormData = z.infer<typeof advisorSchema>;

interface CreateAdvisorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (advisor: AdvisorFormData) => void;
}

const steps = [
  { id: 'identity', title: 'Identity', description: 'Basic information and appearance' },
  { id: 'expertise', title: 'Expertise', description: 'Skills, specialties, and personality' },
  { id: 'role', title: 'Role', description: 'Mission, scope, and working style' },
  { id: 'review', title: 'Review', description: 'Preview and finalize your advisor' },
];

const tagOptions = [
  'Business', 'Technology', 'Marketing', 'Sales', 'Finance', 'Operations',
  'Strategy', 'Leadership', 'Product', 'Design', 'Data', 'AI/ML',
  'Startup', 'Enterprise', 'Consulting', 'Investment', 'Healthcare', 'Education'
];

const specialtyOptions = [
  'Strategic Planning', 'Product Management', 'Marketing Strategy', 'Sales Operations',
  'Financial Analysis', 'Technical Architecture', 'User Experience', 'Data Analytics',
  'Business Development', 'Operations Management', 'Team Building', 'Change Management',
  'Risk Assessment', 'Compliance', 'Project Management', 'Process Improvement'
];

const personalityOptions = [
  'Analytical', 'Creative', 'Strategic', 'Practical', 'Innovative', 'Detail-oriented',
  'Big-picture', 'Collaborative', 'Independent', 'Adaptable', 'Decisive', 'Patient',
  'Direct', 'Supportive', 'Visionary', 'Methodical', 'Results-driven', 'People-focused'
];

export function CreateAdvisorWizard({ isOpen, onClose, onSuccess }: CreateAdvisorWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AdvisorFormData>>({});
  const [draftKey, setDraftKey] = useState('advisor-wizard-draft');

  // Load draft from localStorage on mount
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [draftKey]);

  // Save draft to localStorage when form data changes
  React.useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, draftKey]);

  const handleIdentitySubmit = (data: z.infer<typeof identitySchema>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleExpertiseSubmit = (data: z.infer<typeof expertiseSchema>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleRoleSubmit = (data: z.infer<typeof roleSchema>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      schemaVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const validatedData = advisorSchema.parse(formData);

      // Call API to create advisor
      const response = await fetch('/api/advisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to create advisor');
      }

      const createdAdvisor = await response.json();

      // Clear draft
      localStorage.removeItem(draftKey);

      onSuccess(createdAdvisor);
      onClose();
    } catch (error) {
      console.error('Error creating advisor:', error);
    }
  };

  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const validatedData = advisorSchema.parse(json);
        setFormData(validatedData);
        setCurrentStep(3); // Go to review step
      } catch (error) {
        console.error('Invalid JSON file:', error);
        alert('Invalid advisor JSON file. Please check the format and try again.');
      }
    };
    reader.readAsText(file);
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'advisor-config.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Create Your Own Advisor</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />

            {/* Step Navigation */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`flex flex-col items-center p-2 rounded-lg min-w-[100px] ${
                    index === currentStep ? 'bg-blue-100 text-blue-700' :
                    index < currentStep ? 'text-green-600' : 'text-gray-400'
                  }`}
                  disabled={index > currentStep}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentStep ? 'bg-blue-600 text-white' :
                    index < currentStep ? 'bg-green-600 text-white' : 'bg-gray-200'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 text-center">{step.title}</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {currentStep === 0 && (
            <IdentityStep
              onSubmit={handleIdentitySubmit}
              defaultValues={formData}
              onJsonUpload={handleJsonUpload}
            />
          )}
          {currentStep === 1 && (
            <ExpertiseStep
              onSubmit={handleExpertiseSubmit}
              defaultValues={formData}
              onBack={handleBack}
            />
          )}
          {currentStep === 2 && (
            <RoleStep
              onSubmit={handleRoleSubmit}
              defaultValues={formData}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              formData={formData}
              onBack={handleBack}
              onSubmit={handleFinalSubmit}
              onDownloadJson={downloadJson}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Identity Step Component
function IdentityStep({ onSubmit, defaultValues, onJsonUpload }: {
  onSubmit: (data: z.infer<typeof identitySchema>) => void;
  defaultValues: Partial<AdvisorFormData>;
  onJsonUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    defaultValues
  });

  const watchedTags = watch('tags', []);

  const addTag = (tag: string) => {
    if (!watchedTags.includes(tag)) {
      setValue('tags', [...watchedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Identity & Appearance</h2>
        <p className="text-gray-600">Let's start with the basic information about your advisor.</p>
      </div>

      {/* JSON Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Or Upload JSON Configuration</h3>
        <p className="text-gray-600 mb-4">Have an existing advisor configuration? Upload it here.</p>
        <input
          type="file"
          accept=".json"
          onChange={onJsonUpload}
          className="hidden"
          id="json-upload"
        />
        <label htmlFor="json-upload">
          <Button variant="secondary" className="cursor-pointer">
            Upload JSON File
          </Button>
        </label>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input {...register('firstName')} placeholder="e.g., Sarah" />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input {...register('lastName')} placeholder="e.g., Johnson" />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="title">Professional Title *</Label>
          <Input {...register('title')} placeholder="e.g., Chief Technology Officer" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="tagline">Tagline *</Label>
          <Input {...register('tagline')} placeholder="e.g., Transforming ideas into scalable solutions" />
          {errors.tagline && <p className="text-red-500 text-sm">{errors.tagline.message}</p>}
        </div>

        <div>
          <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
          <Input {...register('avatarUrl')} placeholder="https://example.com/avatar.jpg" />
          {errors.avatarUrl && <p className="text-red-500 text-sm">{errors.avatarUrl.message}</p>}
        </div>

        <div>
          <Label>Tags *</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {watchedTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {tagOptions.filter(tag => !watchedTags.includes(tag)).map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => addTag(tag)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          {errors.tags && <p className="text-red-500 text-sm">{errors.tags.message}</p>}
        </div>

        <div className="flex justify-end">
          <Button type="submit">Continue to Expertise</Button>
        </div>
      </form>
    </div>
  );
}

// Expertise Step Component
function ExpertiseStep({ onSubmit, defaultValues, onBack }: {
  onSubmit: (data: z.infer<typeof expertiseSchema>) => void;
  defaultValues: Partial<AdvisorFormData>;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<z.infer<typeof expertiseSchema>>({
    resolver: zodResolver(expertiseSchema),
    defaultValues
  });

  const watchedSpecialties = watch('specialties', []);
  const watchedExpertise = watch('expertise', []);
  const watchedPersonalityTraits = watch('personalityTraits', []);

  const addArrayItem = (field: keyof z.infer<typeof expertiseSchema>, item: string) => {
    const currentArray = watch(field, []);
    if (!currentArray.includes(item)) {
      setValue(field, [...currentArray, item]);
    }
  };

  const removeArrayItem = (field: keyof z.infer<typeof expertiseSchema>, itemToRemove: string) => {
    const currentArray = watch(field) || [];
    if (Array.isArray(currentArray)) {
      setValue(field, currentArray.filter((item: string) => item !== itemToRemove));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Expertise & Skills</h2>
        <p className="text-gray-600">Define your advisor's areas of expertise and professional characteristics.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label>Specialties *</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {watchedSpecialties.map((specialty, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {specialty}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeArrayItem('specialties', specialty)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {specialtyOptions.filter(specialty => !watchedSpecialties.includes(specialty)).map(specialty => (
              <Badge
                key={specialty}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => addArrayItem('specialties', specialty)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {specialty}
              </Badge>
            ))}
          </div>
          {errors.specialties && <p className="text-red-500 text-sm">{errors.specialties.message}</p>}
        </div>

        <div>
          <Label htmlFor="expertise">Areas of Expertise *</Label>
          <Textarea
            {...register('expertise')}
            placeholder="e.g., Strategic planning, product management, team leadership, technical architecture"
            rows={3}
          />
          {errors.expertise && <p className="text-red-500 text-sm">{errors.expertise.message}</p>}
        </div>

        <div>
          <Label>Personality Traits *</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {watchedPersonalityTraits.map((trait, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {trait}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeArrayItem('personalityTraits', trait)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {personalityOptions.filter(trait => !watchedPersonalityTraits.includes(trait)).map(trait => (
              <Badge
                key={trait}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => addArrayItem('personalityTraits', trait)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {trait}
              </Badge>
            ))}
          </div>
          {errors.personalityTraits && <p className="text-red-500 text-sm">{errors.personalityTraits.message}</p>}
        </div>

        <div>
          <Label htmlFor="experience">Experience Background *</Label>
          <Textarea
            {...register('experience')}
            placeholder="Describe your advisor's professional background, key achievements, and relevant experience..."
            rows={4}
          />
          {errors.experience && <p className="text-red-500 text-sm">{errors.experience.message}</p>}
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
          <Button type="submit">Continue to Role</Button>
        </div>
      </form>
    </div>
  );
}

// Role Step Component
function RoleStep({ onSubmit, defaultValues, onBack }: {
  onSubmit: (data: z.infer<typeof roleSchema>) => void;
  defaultValues: Partial<AdvisorFormData>;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues
  });

  const watchedScopeIn = watch('scopeIn', []);
  const watchedScopeOut = watch('scopeOut', []);
  const watchedKpis = watch('kpis', []);

  const addArrayItem = (field: keyof z.infer<typeof roleSchema>, item: string) => {
    const currentArray = watch(field, []);
    if (!currentArray.includes(item)) {
      setValue(field, [...currentArray, item]);
    }
  };

  const removeArrayItem = (field: keyof z.infer<typeof roleSchema>, itemToRemove: string) => {
    const currentArray = watch(field) || [];
    if (Array.isArray(currentArray)) {
      setValue(field, currentArray.filter((item: string) => item !== itemToRemove));
    }
  };

  const scopeOptions = [
    'Strategic planning', 'Product development', 'Team management', 'Technical decisions',
    'Budget planning', 'Hiring', 'Marketing strategy', 'Sales operations', 'Customer experience',
    'Process improvement', 'Risk management', 'Compliance', 'Partnership development'
  ];

  const kpiOptions = [
    'Revenue growth', 'Customer satisfaction', 'Team productivity', 'Product quality',
    'Market share', 'Operational efficiency', 'Innovation output', 'Employee retention',
    'Cost optimization', 'Time-to-market', 'User engagement', 'Technical debt reduction'
  ];

  const adviceStyleOptions = [
    'Direct and actionable', 'Collaborative and supportive', 'Analytical and data-driven',
    'Strategic and big-picture', 'Practical and hands-on', 'Innovative and creative',
    'Methodical and detailed', 'Inspiring and motivational'
  ];

  const voiceOptions = [
    'Professional and formal', 'Friendly and approachable', 'Authoritative and confident',
    'Empathetic and understanding', 'Casual and conversational', 'Technical and precise',
    'Inspirational and visionary', 'Pragmatic and results-oriented'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Role & Working Style</h2>
        <p className="text-gray-600">Define your advisor's mission, scope of work, and communication style.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="mission">Mission *</Label>
          <Textarea
            {...register('mission')}
            placeholder="What is this advisor's primary mission and purpose?"
            rows={3}
          />
          {errors.mission && <p className="text-red-500 text-sm">{errors.mission.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>In Scope *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watchedScopeIn.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeArrayItem('scopeIn', item)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.filter(item => !watchedScopeIn.includes(item)).map(item => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="cursor-pointer hover:bg-green-50"
                  onClick={() => addArrayItem('scopeIn', item)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {item}
                </Badge>
              ))}
            </div>
            {errors.scopeIn && <p className="text-red-500 text-sm">{errors.scopeIn.message}</p>}
          </div>

          <div>
            <Label>Out of Scope *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watchedScopeOut.map((item, index) => (
                <Badge key={index} variant="danger" className="flex items-center gap-1">
                  {item}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeArrayItem('scopeOut', item)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.filter(item => !watchedScopeOut.includes(item)).map(item => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-50"
                  onClick={() => addArrayItem('scopeOut', item)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {item}
                </Badge>
              ))}
            </div>
            {errors.scopeOut && <p className="text-red-500 text-sm">{errors.scopeOut.message}</p>}
          </div>
        </div>

        <div>
          <Label>Key Performance Indicators *</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {watchedKpis.map((kpi, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {kpi}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeArrayItem('kpis', kpi)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {kpiOptions.filter(kpi => !watchedKpis.includes(kpi)).map(kpi => (
              <Badge
                key={kpi}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => addArrayItem('kpis', kpi)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {kpi}
              </Badge>
            ))}
          </div>
          {errors.kpis && <p className="text-red-500 text-sm">{errors.kpis.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adviceStyle">Advice Style *</Label>
            <select {...register('adviceStyle')} className="w-full p-2 border rounded-md">
              <option value="">Select advice style...</option>
              {adviceStyleOptions.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
            {errors.adviceStyle && <p className="text-red-500 text-sm">{errors.adviceStyle.message}</p>}
          </div>

          <div>
            <Label htmlFor="voice">Voice & Tone *</Label>
            <select {...register('voice')} className="w-full p-2 border rounded-md">
              <option value="">Select voice/tone...</option>
              {voiceOptions.map(voice => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
            {errors.voice && <p className="text-red-500 text-sm">{errors.voice.message}</p>}
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
          <Button type="submit">Review Advisor</Button>
        </div>
      </form>
    </div>
  );
}

// Review Step Component
function ReviewStep({ formData, onBack, onSubmit, onDownloadJson }: {
  formData: Partial<AdvisorFormData>;
  onBack: () => void;
  onSubmit: () => void;
  onDownloadJson: () => void;
}) {
  const [showJson, setShowJson] = useState(false);

  if (!formData || Object.keys(formData).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No advisor data to review. Please go back and fill in the form.</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review Your Advisor</h2>
        <p className="text-gray-600">Review your advisor configuration and make any final adjustments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Advisor Preview</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={`${formData.firstName} ${formData.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{formData.firstName} {formData.lastName}</h4>
                  <p className="text-blue-600">{formData.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{formData.tagline}</p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h4 className="font-medium mb-2">Mission</h4>
            <p className="text-sm text-gray-600">{formData.mission}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Key Specialties</h4>
            <div className="flex flex-wrap gap-1">
              {formData.specialties?.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* JSON Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Configuration</h3>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowJson(!showJson)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showJson ? 'Hide' : 'Show'} JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownloadJson}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {showJson && (
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Ready to create your advisor!</strong> Once submitted, your advisor will be available in your marketplace and ready for conversations.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
        <div className="flex space-x-2">
          <Button type="button" variant="secondary" onClick={onDownloadJson}>
            <Save className="h-4 w-4 mr-1" />
            Save Draft
          </Button>
          <Button onClick={onSubmit}>
            Create Advisor
          </Button>
        </div>
      </div>
    </div>
  );
}