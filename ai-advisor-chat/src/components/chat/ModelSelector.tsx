"use client";

import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button, Badge, Modal, Select } from '../ui';
import {
  getAvailableModelsForAdvisor,
  getRecommendedModelForAdvisor,
  getAdvisorCategory,
  getDefaultModelForAdvisor,
  type ModelRecommendations
} from '~/lib/advisorModelConfig';

const getDefaultModelsForTier = (tier: string): string[] => {
  const defaultModels = {
    free: [
      'anthropic/claude-3-haiku',
      'openai/gpt-3.5-turbo'
    ],
    regular: [
      'anthropic/claude-3-haiku',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-sonnet',
      'meta/llama-2-70b-chat'
    ],
    pro: [
      'anthropic/claude-3-haiku',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-sonnet',
      'meta/llama-2-70b-chat',
      'anthropic/claude-3-opus',
      'openai/gpt-4-turbo'
    ]
  };

  return defaultModels[tier as keyof typeof defaultModels] || defaultModels.free;
};

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  cost: number;
  tier: 'free' | 'base' | 'premium';
}

interface UserModelPreference {
  advisorId: string;
  userId: string;
  preferredModel: string;
  fallbackModels: string[];
  lastUsed: Date;
}

interface ModelSelectorProps {
  advisorId: string;
  advisorName: string;
  advisorDefaultModel: string;
  category?: string;
  userPlan?: string;
  className?: string;
  onModelChange?: (modelId: string) => void;
}

const OPEN_ROUTER_MODELS: ModelInfo[] = [
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

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  advisorId,
  advisorName,
  advisorDefaultModel,
  category,
  userPlan = 'free',
  className = '',
  onModelChange
}) => {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(advisorDefaultModel);
  const [userPreferences, setUserPreferences] = useState<UserModelPreference | null>(null);
  const [isUsingDefault, setIsUsingDefault] = useState(true);
  const [advisorModels, setAdvisorModels] = useState<string[]>([]);
  const [advisorCategory, setAdvisorCategory] = useState<string>(category || 'General');
  const [loading, setLoading] = useState(true);

  // Load advisor model configuration and user preferences
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setLoading(true);

        // Load user preferences
        const savedPreference = localStorage.getItem(`model-preference-${advisorId}`);
        if (savedPreference) {
          try {
            const preference = JSON.parse(savedPreference);
            setUserPreferences(preference);
            setSelectedModel(preference.preferredModel);
            setIsUsingDefault(false);
          } catch (error) {
            console.error('Failed to parse model preference:', error);
          }
        }

        // Load advisor configuration
        const availableModels = await getAvailableModelsForAdvisor(advisorId, userPlan as any);
        const advisorCat = await getAdvisorCategory(advisorId);

        setAdvisorModels(availableModels);
        setAdvisorCategory(advisorCat || category || 'General');

        // Set default model if not already set
        if (!selectedModel || selectedModel === advisorDefaultModel) {
          const recommendedModel = await getRecommendedModelForAdvisor(advisorId);
          if (recommendedModel) {
            setSelectedModel(recommendedModel);
          }
        }
      } catch (error) {
        console.error('Failed to load advisor configuration:', error);
        // Fallback to default behavior
        setAdvisorModels(getDefaultModelsForTier(userPlan as any));
        setAdvisorCategory(category || 'General');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [advisorId, userPlan]);

  const getAvailableModels = (): ModelInfo[] => {
    // Use advisor-specific models if available, otherwise fallback to tier-based filtering
    if (advisorModels.length > 0) {
      return OPEN_ROUTER_MODELS.filter(model => advisorModels.includes(model.id));
    }

    // Fallback to tier-based filtering
    const userTier = userPlan.toLowerCase();
    return OPEN_ROUTER_MODELS.filter(model => {
      if (userTier === 'premium') return true;
      if (userTier === 'base') return model.tier !== 'premium';
      return model.tier === 'free';
    });
  };

  const getModelInfo = (modelId: string): ModelInfo | undefined => {
    return OPEN_ROUTER_MODELS.find(model => model.id === modelId);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'base': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setIsUsingDefault(modelId === advisorDefaultModel);

    // Save to localStorage (will be replaced with database persistence)
    const preference: UserModelPreference = {
      advisorId,
      userId: 'current-user', // Will be replaced with actual user ID
      preferredModel: modelId,
      fallbackModels: [advisorDefaultModel],
      lastUsed: new Date()
    };

    localStorage.setItem(`model-preference-${advisorId}`, JSON.stringify(preference));
    setUserPreferences(preference);
    onModelChange?.(modelId);
    setShowModelSelector(false);
  };

  const handleResetToDefault = () => {
    handleModelChange(advisorDefaultModel);
  };

  const currentModelInfo = getModelInfo(selectedModel);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="flex items-center space-x-2 opacity-50"
        >
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium hidden sm:inline">Loading...</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Model Selector Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModelSelector(true)}
        className="flex items-center space-x-2 hover:bg-gray-100"
        title="Select AI model"
      >
        <SparklesIcon className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentModelInfo?.name || 'Unknown Model'}
        </span>
        <Badge className={getTierColor(currentModelInfo?.tier || 'free')}>
          {currentModelInfo?.tier || 'free'}
        </Badge>
        {!isUsingDefault && (
          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Custom model selection" />
        )}
      </Button>

      {/* Model Selector Modal */}
      <Modal
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        title={`Choose AI Model for ${advisorName}`}
      >
        <div className="space-y-6">
          {/* Current Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Current Model</h3>
                <p className="text-xs text-gray-600">
                  {isUsingDefault ? 'Using advisor default' : 'Your custom selection'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{currentModelInfo?.name}</span>
                <Badge className={getTierColor(currentModelInfo?.tier || 'free')}>
                  {currentModelInfo?.tier}
                </Badge>
                {!isUsingDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefault}
                  >
                    Reset to Default
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Model
            </label>
            <Select
              value={selectedModel}
              onChange={handleModelChange}
              options={getAvailableModels().map(model => ({
                value: model.id,
                label: `${model.name} (${model.tier}) - $${model.cost}/1K tokens`
              }))}
            />
          </div>

          {/* Available Models Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Models
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getAvailableModels().map(model => (
                <div
                  key={model.id}
                  className={`
                    border rounded-lg p-3 cursor-pointer transition-all
                    ${selectedModel === model.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleModelChange(model.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{model.name}</span>
                        <Badge className={getTierColor(model.tier)}>
                          {model.tier}
                        </Badge>
                        {model.id === advisorDefaultModel && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          ${model.cost}/1K tokens
                        </span>
                        <div className="flex space-x-1">
                          {model.capabilities.slice(0, 3).map(capability => (
                            <span
                              key={capability}
                              className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                            >
                              {capability}
                            </span>
                          ))}
                          {model.capabilities.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{model.capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedModel === model.id && (
                      <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation based on category */}
          {advisorCategory && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Recommended for {advisorCategory} Advisors
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {advisorCategory === 'Technical' && 'Models with strong reasoning capabilities for technical analysis'}
                    {advisorCategory === 'Business' && 'Models that excel at strategic thinking and business planning'}
                    {advisorCategory === 'Creative' && 'Fast, flexible models for creative brainstorming'}
                    {advisorCategory === 'Customer Service' && 'Quick, empathetic models for customer interactions'}
                    {advisorCategory === 'Research' && 'Models with deep analytical capabilities for research tasks'}
                    {advisorCategory === 'Strategy' && 'Advanced reasoning models for strategic planning'}
                    {!['Technical', 'Business', 'Creative', 'Customer Service', 'Research', 'Strategy'].includes(advisorCategory) &&
                      'Models balanced for general advisory conversations'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Plan Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Your plan: <span className="font-medium capitalize">{userPlan}</span>
              </span>
              <span className="text-xs text-gray-500">
                {getAvailableModels().length} of {OPEN_ROUTER_MODELS.length} models available
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowModelSelector(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};