"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Sparkles, Users, Lightbulb } from 'lucide-react';
import { CreateAdvisorWizard } from './CreateAdvisorWizard';

interface CreateAdvisorButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onAdvisorCreated?: (advisor: any) => void;
}

export function CreateAdvisorButton({
  className,
  variant = 'primary',
  size = 'md',
  onAdvisorCreated
}: CreateAdvisorButtonProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleWizardSuccess = (advisor: any) => {
    onAdvisorCreated?.(advisor);
    setIsWizardOpen(false);
  };

  return (
    <>
      <Button
        className={className}
        variant={variant}
        size={size}
        onClick={() => setIsWizardOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Advisor
      </Button>

      <CreateAdvisorWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </>
  );
}

// Prominent CTA Card for Marketplace
interface CreateAdvisorCTAProps {
  onAdvisorCreated?: (advisor: any) => void;
}

export function CreateAdvisorCTA({ onAdvisorCreated }: CreateAdvisorCTAProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleWizardSuccess = (advisor: any) => {
    onAdvisorCreated?.(advisor);
    setIsWizardOpen(false);
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => setIsWizardOpen(true)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-blue-900">Create Your Own Advisor</CardTitle>
          <p className="text-blue-700">Design a custom AI advisor tailored to your specific needs</p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">Custom Persona</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-blue-800">Unique Expertise</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">Specialized Skills</span>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsWizardOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Advisor
          </Button>
        </CardContent>
      </Card>

      <CreateAdvisorWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </>
  );
}