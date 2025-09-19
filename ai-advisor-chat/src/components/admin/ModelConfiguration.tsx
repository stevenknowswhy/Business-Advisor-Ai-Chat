"use client";

import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge, Modal, Select } from '../ui';
import type { Id } from '../../../convex/_generated/dataModel';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AdvisorModelConfig {
  advisorId: Id<"advisors">;
  advisorName: string;
  defaultModel: string;
  availableModels: string[];
  modelHint?: string;
  category?: string;
  isConfigured: boolean;
}

interface ModelConfigurationProps {
  className?: string;
  advisorId?: Id<"advisors">;
  onConfigUpdate?: (advisorId: Id<"advisors">, config: Partial<AdvisorModelConfig>) => void;
}

// Available Open Router models
const OPEN_ROUTER_MODELS = [
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Best for complex reasoning and analysis',
    capabilities: ['text-generation', 'function-calling', 'reasoning', 'analysis'],
    cost: 0.015,
    tier: 'premium'
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    description: 'Balanced performance and cost',
    capabilities: ['text-generation', 'function-calling', 'reasoning'],
    cost: 0.003,
    tier: 'base'
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fast responses, good quality',
    capabilities: ['text-generation', 'function-calling', 'reasoning'],
    cost: 0.00025,
    tier: 'free'
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Latest GPT-4 capabilities',
    capabilities: ['text-generation', 'function-calling', 'reasoning', 'analysis'],
    cost: 0.01,
    tier: 'premium'
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Reliable and cost-effective',
    capabilities: ['text-generation', 'function-calling'],
    cost: 0.0015,
    tier: 'free'
  },
  {
    id: 'meta/llama-2-70b-chat',
    name: 'Llama 2 70B',
    provider: 'meta',
    description: 'Open-source alternative',
    capabilities: ['text-generation', 'reasoning'],
    cost: 0.0009,
    tier: 'base'
  }
];

export const ModelConfiguration: React.FC<ModelConfigurationProps> = ({
  className,
  advisorId,
  onConfigUpdate
}) => {
  const [selectedAdvisor, setSelectedAdvisor] = useState<Id<"advisors"> | null>(advisorId || null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AdvisorModelConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Mock data - will replace with real Convex queries
  const advisors = useQuery(api.advisors.getAllActiveAdvisorsForMigration) || [];

  const handleConfigureModel = (advisor: any) => {
    const config: AdvisorModelConfig = {
      advisorId: advisor._id,
      advisorName: advisor.persona?.name || 'Unknown',
      defaultModel: advisor.modelHint || getDefaultModelForCategory(advisor.category),
      availableModels: getAvailableModelsForCategory(advisor.category),
      modelHint: advisor.modelHint,
      category: advisor.category,
      isConfigured: !!advisor.modelHint
    };

    setCurrentConfig(config);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!currentConfig) return;

    setIsSaving(true);
    try {
      // TODO: Implement Convex mutation to save model configuration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      if (onConfigUpdate) {
        onConfigUpdate(currentConfig.advisorId, {
          defaultModel: currentConfig.defaultModel,
          modelHint: currentConfig.modelHint
        });
      }

      setShowConfigModal(false);
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save model configuration:', error);
      setIsSaving(false);
    }
  };

  const getDefaultModelForCategory = (category?: string): string => {
    const categoryDefaults: Record<string, string> = {
      'Technical': 'anthropic/claude-3-haiku',
      'Business': 'anthropic/claude-3-sonnet',
      'Creative': 'anthropic/claude-3-haiku',
      'Customer Service': 'openai/gpt-3.5-turbo',
      'Research': 'anthropic/claude-3-sonnet',
      'Strategy': 'anthropic/claude-3-opus',
    };
    return categoryDefaults[category || ''] || 'anthropic/claude-3-haiku';
  };

  const getAvailableModelsForCategory = (category?: string): string[] => {
    // Return models based on category requirements
    if (category === 'Strategy' || category === 'Research') {
      return OPEN_ROUTER_MODELS.map(m => m.id);
    }
    return OPEN_ROUTER_MODELS.filter(m => m.tier !== 'premium').map(m => m.id);
  };

  const getModelInfo = (modelId: string) => {
    return OPEN_ROUTER_MODELS.find(m => m.id === modelId);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'base': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (advisorId) {
    const advisor = advisors.find(a => a._id === advisorId);
    if (!advisor) return null;

    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Model Configuration</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConfigureModel(advisor)}
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>

        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Default Model</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">
                  {getModelInfo(advisor.modelHint || getDefaultModelForCategory(advisor.category))?.name || 'Not configured'}
                </span>
                <Badge className={advisor.modelHint ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {advisor.modelHint ? 'Configured' : 'Default'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <span className="text-sm text-gray-900">{advisor.category || 'General'}</span>
            </div>

            {advisor.modelHint && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Model ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {advisor.modelHint}
                </code>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Model Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure default AI models for each advisor
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {advisors.map((advisor) => (
          <Card key={advisor._id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {advisor.persona?.image ? (
                    <img
                      src={advisor.persona.image}
                      alt={advisor.persona.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {advisor.persona?.name?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {advisor.persona?.name || 'Unknown Advisor'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {advisor.persona?.title || 'No title'}
                  </p>
                  {advisor.category && (
                    <Badge className="mt-1 bg-gray-100 text-gray-800">
                      {advisor.category}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {getModelInfo(advisor.modelHint || getDefaultModelForCategory(advisor.category))?.name || 'Not configured'}
                  </div>
                  <div className="flex items-center space-x-1">
                    {advisor.modelHint ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <AdjustmentsHorizontalIcon className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      advisor.modelHint
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {advisor.modelHint ? 'Configured' : 'Using Default'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigureModel(advisor)}
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={`Configure Model for ${currentConfig?.advisorName}`}
      >
        {currentConfig && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <Select
                value={currentConfig.defaultModel}
                onChange={(value) => setCurrentConfig({
                  ...currentConfig,
                  defaultModel: value,
                  modelHint: value
                })}
                options={OPEN_ROUTER_MODELS
                  .filter(model => currentConfig.availableModels.includes(model.id))
                  .map(model => ({
                    value: model.id,
                    label: `${model.name} (${model.tier})`
                  }))}
              />
              <p className="mt-2 text-sm text-gray-600">
                This model will be used by default for conversations with this advisor.
              </p>
            </div>

            {currentConfig.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Recommendations
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        {currentConfig.category} Advisors
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Recommended models for {currentConfig.category.toLowerCase()} advisors typically
                        focus on {currentConfig.category === 'Technical' ? 'accuracy and detailed analysis' :
                                currentConfig.category === 'Business' ? 'strategic thinking and planning' :
                                currentConfig.category === 'Creative' ? 'flexibility and innovation' :
                                'balanced performance and cost efficiency'}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Models
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {OPEN_ROUTER_MODELS
                  .filter(model => currentConfig.availableModels.includes(model.id))
                  .map(model => (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between p-2 border rounded-lg ${
                        currentConfig.defaultModel === model.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{model.name}</span>
                        <Badge className={getTierColor(model.tier)}>
                          {model.tier}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        ${model.cost}/1K tokens
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};