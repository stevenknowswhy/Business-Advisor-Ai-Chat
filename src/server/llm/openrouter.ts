import { createOpenAI } from "@ai-sdk/openai";
import { env } from "~/env";

/**
 * OpenRouter client configuration
 * Uses OpenAI SDK with OpenRouter endpoint
 */
export const openrouter = createOpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": env.APP_URL,
    "X-Title": "AI Advisor Chat",
  },
});

/**
 * Model selection based on user subscription tier
 */
export function getModelForTier(tier: string): string {
  switch (tier) {
    case "premium":
      return env.OPENROUTER_PREMIUM_MODEL;
    case "base":
      return env.OPENROUTER_BASE_MODEL;
    case "free":
    default:
      return env.OPENROUTER_FREE_MODEL;
  }
}

/**
 * Model fallback chain for reliability
 * Primary: qwen/qwen-2.5-72b-instruct
 * Fallback: deepseek/deepseek-chat
 */
export const MODEL_FALLBACKS: Record<string, string[]> = {
  [env.OPENROUTER_PREMIUM_MODEL]: [
    env.OPENROUTER_BASE_MODEL,
    env.OPENROUTER_FREE_MODEL,
  ],
  [env.OPENROUTER_BASE_MODEL]: [
    env.OPENROUTER_FREE_MODEL,
  ],
  [env.OPENROUTER_FREE_MODEL]: [],
};

/**
 * Get model with fallback support
 */
export function getModelWithFallback(preferredModel: string): string[] {
  return [preferredModel, ...(MODEL_FALLBACKS[preferredModel] || [])];
}
