import { openRouter, ModelSelector, ModelUtils } from "./glm";
import type { ModelConfig } from "./glm";

// Define Convex Advisor type for model router compatibility
interface ConvexAdvisor {
  _id: string;
  _creationTime: number;
  persona: {
    name: string;
    title: string;
    image?: string;
    description?: string;
    oneLiner?: string;
    archetype?: string;
    bio?: string;
    detailedBackground?: string;
    experience?: string;
    specialties?: string[];
    personalInterests?: string[];
    communicationStyle?: string;
    location?: {
      city?: string;
      region?: string;
      country?: string;
    };
  };
  category?: string;
  modelHint?: string;
}

export interface ModelSelection {
  provider: string;
  model: string;
  config: ModelConfig;
  reasoning: string;
}

export interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  advisorId: string;
  userId: string;
  userTier: string;
  conversationId?: string;
  context?: {
    language?: string;
    complexity?: "simple" | "moderate" | "complex";
    requiresFunctionCalling?: boolean;
    costSensitivity?: "low" | "medium" | "high";
  };
}

export interface PerformanceMetrics {
  provider: string;
  model: string;
  responseTime: number;
  tokenCount: number;
  success: boolean;
  error?: string;
  cost?: number;
}

export class ModelRouter {
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private modelCache: Map<string, ModelConfig> = new Map();

  /**
   * Select the optimal model for a given chat request
   */
  async selectOptimalModel(
    request: ChatRequest,
    advisor: ConvexAdvisor,
    availableModels: string[] = []
  ): Promise<ModelSelection> {
    const { messages, userTier, advisorId, context = {} } = request;

    // Get user preferences for this advisor if available
    const userPreference = await this.getUserModelPreference(advisorId, request.userId);

    // Get advisor's preferred models
    const advisorModels = this.getAdvisorModels(advisor);

    // Select model based on context and preferences
    let selectedModel: string;
    let reasoning: string;

    if (userPreference) {
      selectedModel = userPreference.model;
      reasoning = "User preference";
    } else if (advisorModels.default) {
      selectedModel = advisorModels.default;
      reasoning = "Advisor default model";
    } else {
      selectedModel = this.selectModelByContext(userTier, context, messages);
      reasoning = "Context-based selection";
    }

    // Create configuration
    const config: ModelConfig = {
      model: selectedModel,
      provider: this.getProviderForModel(selectedModel),
      temperature: this.getTemperatureForContext(context),
      maxTokens: this.getMaxTokensForContext(context),
      enableFunctionCalling: context.requiresFunctionCalling || false,
      languagePreference: context.language || "auto",
    };

    return {
      provider: config.provider,
      model: selectedModel,
      config,
      reasoning,
    };
  }

  private async getUserModelPreference(advisorId: string, userId: string): Promise<{ model: string } | null> {
    // TODO: Implement database lookup for user model preferences
    // For now, return null to use advisor default
    return null;
  }

  private getAdvisorModels(advisor: ConvexAdvisor): { default: string; available: string[] } {
    // Use advisor's modelHint if available, otherwise use category-based default
    const defaultModel = advisor.modelHint || this.getDefaultModelForCategory(advisor.category || "General");
    const availableModels = this.getAvailableModelsForTier("free"); // Start with free tier

    return {
      default: defaultModel,
      available: availableModels,
    };
  }

  private getDefaultModelForCategory(category: string): string {
    const categoryDefaults: Record<string, string> = {
      "Technical": "anthropic/claude-3-haiku",
      "Business": "anthropic/claude-3-sonnet",
      "Creative": "anthropic/claude-3-haiku",
      "Customer Service": "openai/gpt-3.5-turbo",
      "Research": "anthropic/claude-3-sonnet",
      "Strategy": "anthropic/claude-3-opus",
    };

    return categoryDefaults[category] || "anthropic/claude-3-haiku";
  }

  private getAvailableModelsForTier(tier: string): string[] {
    const models: Record<string, string[]> = {
      premium: [
        "anthropic/claude-3-opus",
        "anthropic/claude-3-sonnet",
        "openai/gpt-4-turbo",
        "anthropic/claude-3-haiku",
        "openai/gpt-3.5-turbo",
      ],
      base: [
        "anthropic/claude-3-sonnet",
        "anthropic/claude-3-haiku",
        "openai/gpt-3.5-turbo",
      ],
      free: [
        "anthropic/claude-3-haiku",
        "openai/gpt-3.5-turbo",
      ],
    };

    return models[tier] || models.free || [];
  }

  private selectModelByContext(userTier: string, context: any, messages: Array<{ role: string; content: string }>): string {
    const { complexity = "moderate", requiresFunctionCalling = false, costSensitivity = "medium" } = context;

    // Analyze message content for additional context
    const messageContent = messages.map(m => m.content).join(' ').toLowerCase();
    const messageLength = messageContent.length;

    // Select based on complexity and requirements
    if (complexity === "complex" && userTier === "premium") {
      return "anthropic/claude-3-opus";
    }

    if (requiresFunctionCalling && (userTier === "premium" || userTier === "base")) {
      return "anthropic/claude-3-sonnet";
    }

    if (costSensitivity === "high") {
      return "openai/gpt-3.5-turbo";
    }

    if (messageLength > 2000 && userTier === "premium") {
      return "anthropic/claude-3-opus";
    }

    // Default selections based on tier
    switch (userTier) {
      case "premium":
        return "anthropic/claude-3-sonnet";
      case "base":
        return "anthropic/claude-3-haiku";
      default:
        return "anthropic/claude-3-haiku";
    }
  }

  private getProviderForModel(model: string): string {
    if (model.startsWith("anthropic/")) return "anthropic";
    if (model.startsWith("openai/")) return "openai";
    if (model.startsWith("meta/")) return "meta";
    if (model.startsWith("google/")) return "google";
    if (model.startsWith("mistral/")) return "mistral";
    return "unknown";
  }

  private getTemperatureForContext(context: any): number {
    const { complexity = "moderate" } = context;

    switch (complexity) {
      case "simple":
        return 0.3;
      case "complex":
        return 0.8;
      default:
        return 0.7;
    }
  }

  private getMaxTokensForContext(context: any): number {
    const { complexity = "moderate" } = context;

    switch (complexity) {
      case "simple":
        return 2000;
      case "complex":
        return 8000;
      default:
        return 4000;
    }
  }

  /**
   * Get all available models for user selection UI
   */
  getAvailableModels(tier: string = "free"): Array<{ id: string; name: string; provider: string; description: string; cost: number }> {
    const models = this.getAvailableModelsForTier(tier);

    return models.map(model => ({
      id: model,
      name: this.getModelDisplayName(model),
      provider: this.getProviderForModel(model),
      description: this.getModelDescription(model),
      cost: this.getModelCost(model),
    }));
  }

  private getModelDisplayName(model: string): string {
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

  private getModelDescription(model: string): string {
    const descriptions: Record<string, string> = {
      "anthropic/claude-3-opus": "Best for complex reasoning, analysis, and strategic thinking",
      "anthropic/claude-3-sonnet": "Balanced performance and cost, good for most tasks",
      "anthropic/claude-3-haiku": "Fast and cost-effective, great for quick responses",
      "openai/gpt-4-turbo": "Latest GPT-4 with improved capabilities",
      "openai/gpt-3.5-turbo": "Reliable and cost-effective for general tasks",
      "meta/llama-2-70b-chat": "Open-source alternative with good reasoning",
    };

    return descriptions[model] || "General purpose AI model";
  }

  private getModelCost(model: string): number {
    const costs: Record<string, number> = {
      "anthropic/claude-3-opus": 0.015,
      "anthropic/claude-3-sonnet": 0.003,
      "anthropic/claude-3-haiku": 0.00025,
      "openai/gpt-4-turbo": 0.01,
      "openai/gpt-3.5-turbo": 0.0015,
      "meta/llama-2-70b-chat": 0.0009,
    };

    return costs[model] || 0.001;
  }

  /**
   * Record performance metrics for model selection optimization
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    const key = `${metrics.provider}:${metrics.model}`;
    const existing = this.performanceMetrics.get(key) || [];
    existing.push(metrics);

    // Keep only last 100 metrics per model
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }

    this.performanceMetrics.set(key, existing);
  }

  /**
   * Get performance summary for a provider
   */
  private getProviderPerformance(provider: string): {
    avgResponseTime: number;
    avgTokenCount: number;
    successRate: number;
  } {
    const providerMetrics = Array.from(this.performanceMetrics.values())
      .flat()
      .filter(m => m.provider === provider);

    if (providerMetrics.length === 0) {
      return { avgResponseTime: 1000, avgTokenCount: 500, successRate: 0.95 };
    }

    const successfulMetrics = providerMetrics.filter(m => m.success);

    return {
      avgResponseTime: providerMetrics.reduce((sum, m) => sum + m.responseTime, 0) / providerMetrics.length,
      avgTokenCount: providerMetrics.reduce((sum, m) => sum + m.tokenCount, 0) / providerMetrics.length,
      successRate: successfulMetrics.length / providerMetrics.length,
    };
  }

  /**
   * Get model recommendations for advisor optimization
   */
  getRecommendations(): Array<{
    advisorId: string;
    recommendedProvider: string;
    recommendedModel: string;
    reason: string;
    expectedImprovement: string;
  }> {
    const recommendations: Array<{
      advisorId: string;
      recommendedProvider: string;
      recommendedModel: string;
      reason: string;
      expectedImprovement: string;
    }> = [];

    // Analyze performance data and generate recommendations
    // This would be implemented with actual advisor data analysis

    return recommendations;
  }

  /**
   * Get model performance analytics
   */
  getModelPerformance(modelId: string): {
    avgResponseTime: number;
    avgTokenCount: number;
    successRate: number;
    avgCost: number;
    totalRequests: number;
  } {
    const key = modelId.includes(":") ? modelId : `unknown:${modelId}`;
    const modelMetrics = this.performanceMetrics.get(key) || [];

    if (modelMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        avgTokenCount: 0,
        successRate: 0,
        avgCost: 0,
        totalRequests: 0,
      };
    }

    const successfulMetrics = modelMetrics.filter(m => m.success);

    return {
      avgResponseTime: modelMetrics.reduce((sum, m) => sum + m.responseTime, 0) / modelMetrics.length,
      avgTokenCount: modelMetrics.reduce((sum, m) => sum + m.tokenCount, 0) / modelMetrics.length,
      successRate: successfulMetrics.length / modelMetrics.length,
      avgCost: modelMetrics.reduce((sum, m) => sum + (m.cost || 0), 0) / modelMetrics.length,
      totalRequests: modelMetrics.length,
    };
  }
}

// Export singleton instance
export const modelRouter = new ModelRouter();