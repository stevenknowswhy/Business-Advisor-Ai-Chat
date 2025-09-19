import { createOpenAI } from "@ai-sdk/openai";

// Open Router Client Configuration
export const openRouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "AI Advisor Chat - Open Router",
  },
});

// Open Router Model Configuration
export const OPENROUTER_MODELS = {
  premium: {
    "anthropic/claude-3-opus": "Best for complex reasoning and analysis",
    "anthropic/claude-3-sonnet": "Balanced performance and cost",
    "openai/gpt-4-turbo": "Latest GPT-4 capabilities",
  },
  base: {
    "anthropic/claude-3-haiku": "Fast responses, good quality",
    "openai/gpt-3.5-turbo": "Reliable and cost-effective",
    "meta/llama-2-70b-chat": "Open-source alternative",
  },
  free: {
    "anthropic/claude-3-haiku": "Fast responses, good quality",
    "openai/gpt-3.5-turbo": "Reliable and cost-effective",
  },
} as const;

export type UserTier = keyof typeof OPENROUTER_MODELS;

export function getModelsForTier(tier: UserTier): Record<string, string> {
  return OPENROUTER_MODELS[tier];
}

export function getDefaultModelForTier(tier: UserTier): string {
  const models = getModelsForTier(tier);
  const modelKeys = Object.keys(models);
  return modelKeys[0] || "anthropic/claude-3-haiku";
}

// Model-agnostic configuration
export interface ModelConfig {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  enableFunctionCalling?: boolean;
  languagePreference?: string;
  cost?: number;
  capabilities?: string[];
}

export const defaultModelConfig: ModelConfig = {
  model: "anthropic/claude-3-haiku",
  provider: "anthropic",
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
  frequencyPenalty: 0.1,
  presencePenalty: 0.1,
  enableFunctionCalling: true,
  languagePreference: "auto",
  cost: 0.002, // per 1K tokens
  capabilities: ["text-generation", "function-calling", "reasoning"],
};

// Model-agnostic Response Types
export interface ModelChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      function_call?: any;
      tool_calls?: any[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelFunctionCall {
  name: string;
  arguments: string;
}

export interface ModelToolCall {
  id: string;
  type: "function";
  function: ModelFunctionCall;
}

// Model-agnostic Function Calling Schema
export interface ModelFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

// Performance Monitoring
export interface ModelPerformanceMetrics {
  responseTime: number;
  tokenCount: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  provider: string;
  timestamp: number;
  success: boolean;
  error?: string;
  cost?: number;
}

// Model Selection Strategy
export interface ModelSelectionCriteria {
  userTier: UserTier;
  advisorLanguage: string;
  contentComplexity: "simple" | "moderate" | "complex";
  requiresFunctionCalling: boolean;
  responseTimePreference: "fast" | "balanced" | "quality";
  costSensitivity: "low" | "medium" | "high";
  advisorSpecialty?: string;
}

export class ModelSelector {
  static selectOptimalModel(criteria: ModelSelectionCriteria): string {
    // Priority-based model selection
    if (criteria.contentComplexity === "complex" && criteria.userTier === "premium") {
      return "anthropic/claude-3-opus";
    }

    if (criteria.requiresFunctionCalling && criteria.userTier === "premium") {
      return "anthropic/claude-3-sonnet"; // Better function calling capabilities
    }

    if (criteria.advisorSpecialty?.toLowerCase().includes("chinese") || criteria.advisorLanguage === "zh") {
      return criteria.userTier === "premium" ? "anthropic/claude-3-opus" : "anthropic/claude-3-haiku";
    }

    return getDefaultModelForTier(criteria.userTier);
  }

  static getProviderForModel(model: string): string {
    if (model.startsWith("anthropic/")) return "anthropic";
    if (model.startsWith("openai/")) return "openai";
    if (model.startsWith("meta/")) return "meta";
    if (model.startsWith("google/")) return "google";
    if (model.startsWith("mistral/")) return "mistral";
    return "unknown";
  }

  static getModelCapabilities(model: string): string[] {
    const capabilities: Record<string, string[]> = {
      "anthropic/claude-3-opus": ["text-generation", "function-calling", "reasoning", "analysis"],
      "anthropic/claude-3-sonnet": ["text-generation", "function-calling", "reasoning"],
      "anthropic/claude-3-haiku": ["text-generation", "function-calling", "reasoning"],
      "openai/gpt-4-turbo": ["text-generation", "function-calling", "reasoning", "analysis"],
      "openai/gpt-3.5-turbo": ["text-generation", "function-calling"],
      "meta/llama-2-70b-chat": ["text-generation", "reasoning"],
    };

    return capabilities[model] || ["text-generation"];
  }

  static calculateCost(model: string, tokens: number): number {
    const costs: Record<string, number> = {
      "anthropic/claude-3-opus": 0.015,
      "anthropic/claude-3-sonnet": 0.003,
      "anthropic/claude-3-haiku": 0.00025,
      "openai/gpt-4-turbo": 0.01,
      "openai/gpt-3.5-turbo": 0.0015,
      "meta/llama-2-70b-chat": 0.0009,
    };

    return (costs[model] || 0.001) * (tokens / 1000);
  }
}

// Model-agnostic utilities
export class ModelUtils {
  static detectLanguage(text: string): string {
    // Simple language detection - can be enhanced with proper language detection library
    const chineseRegex = /[\u4e00-\u9fff]/;
    const spanishRegex = /[ñáéíóúü]/i;
    const frenchRegex = /[àâäçéèêëïîôùûüÿñæœ]/i;

    if (chineseRegex.test(text)) return "zh";
    if (spanishRegex.test(text)) return "es";
    if (frenchRegex.test(text)) return "fr";
    return "en";
  }

  static optimizePromptForModel(prompt: string, model: string, language: string): string {
    if (language === "zh" && model.includes("claude")) {
      return `[请用中文回答]\n\n${prompt}`;
    }
    return prompt;
  }

  static calculateTokenEstimate(text: string): number {
    // Rough token estimation - varies by language
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
  }

  static getModelDisplayName(model: string): string {
    const displayNames: Record<string, string> = {
      "anthropic/claude-3-opus": "Claude 3 Opus",
      "anthropic/claude-3-sonnet": "Claude 3 Sonnet",
      "anthropic/claude-3-haiku": "Claude 3 Haiku",
      "openai/gpt-4-turbo": "GPT-4 Turbo",
      "openai/gpt-3.5-turbo": "GPT-3.5 Turbo",
      "meta/llama-2-70b-chat": "Llama 2 70B",
    };

    return displayNames[model] || model;
  }
}

// Error Handling
export class ModelError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "ModelError";
  }
}

export const MODEL_ERROR_CODES = {
  INVALID_API_KEY: "invalid_api_key",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INSUFFICIENT_QUOTA: "insufficient_quota",
  INVALID_MODEL: "invalid_model",
  CONTENT_FILTERED: "content_filtered",
  TIMEOUT: "timeout",
  NETWORK_ERROR: "network_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

// Legacy support for existing GLM code
export const glm = openRouter;
export const GLM_MODELS = OPENROUTER_MODELS;
export type GLMModelTier = UserTier;
export const getGLMModelForTier = getDefaultModelForTier;
export const defaultGLMConfig = defaultModelConfig;

// Type aliases for legacy support
export type GLMChatResponse = ModelChatResponse;
export type GLMFunctionCall = ModelFunctionCall;
export type GLMToolCall = ModelToolCall;
export type GLMFunction = ModelFunction;
export type GLMPerformanceMetrics = ModelPerformanceMetrics;
export type GLMError = ModelError;
export const GLM_ERROR_CODES = MODEL_ERROR_CODES;
export const GLMModelSelector = ModelSelector;
export const GLMUtils = ModelUtils;