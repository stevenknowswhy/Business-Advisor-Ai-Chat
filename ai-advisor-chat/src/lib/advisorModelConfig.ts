// Client-side compatible utilities for advisor model configuration
// These will work with API endpoints that handle the file system operations

export interface ModelTierAvailability {
  free: string[];
  regular: string[];
  pro: string[];
}

export interface ModelRecommendations {
  optimal: string;
  reasoning: string;
  alternatives: {
    budget: string;
    premium: string;
  };
}

export interface AdvisorModelConfiguration {
  category: string;
  defaultModel: string;
  tierAvailability: ModelTierAvailability;
  modelRecommendations: ModelRecommendations;
}

export interface AdvisorConfiguration {
  advisorId: string;
  advisorSchemaVersion: string;
  status: string;
  persona: any;
  roleDefinition: any;
  components: any[];
  modelConfiguration?: AdvisorModelConfiguration;
  metadata: any;
  localization: any;
}

/**
 * Get available models for a specific advisor and user tier (client-side)
 * This will fetch from an API endpoint that handles the file system operations
 */
export async function getAvailableModelsForAdvisor(advisorId: string, userTier: 'free' | 'regular' | 'pro' = 'free'): Promise<string[]> {
  try {
    const response = await fetch(`/api/advisors/${advisorId}/models?tier=${userTier}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models for advisor ${advisorId}`);
    }
    const data = await response.json();
    return data.models || getDefaultModelsForTier(userTier);
  } catch (error) {
    console.error(`Failed to fetch advisor models:`, error);
    return getDefaultModelsForTier(userTier);
  }
}

/**
 * Get model configuration for a specific advisor (client-side)
 */
export async function getAdvisorModelConfiguration(advisorId: string): Promise<AdvisorModelConfiguration | null> {
  try {
    const response = await fetch(`/api/advisors/${advisorId}/config`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.modelConfiguration || null;
  } catch (error) {
    console.error(`Failed to fetch advisor configuration:`, error);
    return null;
  }
}

/**
 * Get default models for a user tier (fallback)
 */
export function getDefaultModelsForTier(tier: 'free' | 'regular' | 'pro'): string[] {
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

  return defaultModels[tier];
}

/**
 * Get recommended model for an advisor
 */
export async function getRecommendedModelForAdvisor(advisorId: string): Promise<string | null> {
  const modelConfig = await getAdvisorModelConfiguration(advisorId);
  return modelConfig?.modelRecommendations.optimal || null;
}

/**
 * Check if a specific model is available for an advisor and user tier
 */
export async function isModelAvailableForAdvisor(advisorId: string, modelId: string, userTier: 'free' | 'regular' | 'pro' = 'free'): Promise<boolean> {
  const availableModels = await getAvailableModelsForAdvisor(advisorId, userTier);
  return availableModels.includes(modelId);
}

/**
 * Get model recommendations for an advisor
 */
export async function getModelRecommendationsForAdvisor(advisorId: string): Promise<ModelRecommendations | null> {
  const modelConfig = await getAdvisorModelConfiguration(advisorId);
  return modelConfig?.modelRecommendations || null;
}

/**
 * Get advisor category
 */
export async function getAdvisorCategory(advisorId: string): Promise<string | null> {
  const modelConfig = await getAdvisorModelConfiguration(advisorId);
  return modelConfig?.category || null;
}

/**
 * Get default model for an advisor
 */
export async function getDefaultModelForAdvisor(advisorId: string): Promise<string | null> {
  const modelConfig = await getAdvisorModelConfiguration(advisorId);
  return modelConfig?.defaultModel || null;
}