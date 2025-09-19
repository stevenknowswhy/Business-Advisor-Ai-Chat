import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Security middleware
import { securityMiddleware, addSecurityHeaders } from "@/lib/security";
import { applyRateLimit } from "@/lib/rateLimiter";
import { validateRequestBody } from "@/lib/validation";
import { validateChatRequestSchema } from "@/lib/validation";

// Authentication
import { auth, currentUser } from "@clerk/nextjs/server";

// Convex imports
import {
  getAvailableAdvisorsRaw,
  getAdvisorByIdRaw,
  getOrCreateConversation,
  updateActiveAdvisorIfChanged,
  saveUserMessage,
  saveAdvisorMessage,
  generateTitleIfNeeded,
  formatConversationForChatResponse,
} from "~/server/convex/chat";

// Open Router imports
import { openRouter, GLM_MODELS, GLM_ERROR_CODES, ModelError, MODEL_ERROR_CODES } from "~/server/llm/glm";
import type { GLMError, ModelConfig, GLMModelTier } from "~/server/llm/glm";
import { modelRouter, type ChatRequest, type ModelSelection } from "~/server/llm/modelRouter";

// AI SDK imports
import { generateText } from "ai";

// Prompt generation utilities
import { generateSystemPrompt, generateConversationContext, generateUserMessage, extractMentions } from "~/server/llm/prompt";

// Performance tracking
import { recordGLMPerformance, recordModelComparison } from "~/server/performance/tracking";

// Force Node.js runtime
export const runtime = "nodejs";

// Open Router request schema
const glmChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    id: z.string().optional(),
  })),
  conversationId: z.string().optional(),
  advisorId: z.string().optional(),
  forceGLM: z.boolean().optional(), // Force GLM usage regardless of advisor preference
});

// Helper function for authentication
async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User details not found from Clerk");

  return {
    id: userId,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    name: clerkUser.fullName || null,
    image: clerkUser.imageUrl || null,
    plan: "free", // This could be enhanced to get from user's actual plan
  };
}

export async function POST(req: NextRequest) {
  console.log("=== GLM CHAT API START ===");
  console.log("Request URL:", req.url);
  console.log("GLM API Key present:", !!process.env.GLM_API_KEY);

  try {
    // Apply security middleware
    const securityResult = await securityMiddleware(req);
    if (securityResult) {
      return securityResult;
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, 'chat');
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate request body
    const validationResult = await validateRequestBody(req, glmChatRequestSchema);
    if (!validationResult.success) {
      const errorResponse = NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
      return addSecurityHeaders(req, errorResponse);
    }

    // Authenticate user
    let user;
    try {
      user = await requireUser();
      console.log("User authenticated:", user.id);
    } catch (authError: any) {
      console.error("Authentication error:", authError.message);
      return NextResponse.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to use GLM chat functionality",
        code: 401
      }, { status: 401 });
    }

    // Use validated request data
    const validatedData = validationResult.data;
    const message = validatedData.messages[validatedData.messages.length - 1]?.content || "";
    const conversationId = validatedData.conversationId;
    const advisorId = validatedData.advisorId;
    const forceGLM = validatedData.forceGLM || false;

    // Get available advisors and process mentions
    const availableAdvisors = await getAvailableAdvisorsRaw();
    const mentions = extractMentions(message, availableAdvisors as any);

    // Determine active advisor
    let activeAdvisor;
    if (mentions.length > 0) {
      activeAdvisor = await getAdvisorByIdRaw(mentions[0]!);
    } else if (advisorId) {
      activeAdvisor = await getAdvisorByIdRaw(advisorId);
    } else {
      activeAdvisor = availableAdvisors[0];
    }

    if (!activeAdvisor) {
      return NextResponse.json({
        error: "NO_ADVISOR_AVAILABLE",
        message: "No advisor is available to handle this request"
      }, { status: 400 });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation({
      conversationId,
      userId: user.id,
      activeAdvisorId: activeAdvisor._id,
      messageContent: message,
    });

    if (conversationId && !conversation) {
      return NextResponse.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "The specified conversation could not be found",
        conversationId
      }, { status: 404 });
    }

    // Update active advisor if changed
    if (conversation.activeAdvisorId !== activeAdvisor._id) {
      await updateActiveAdvisorIfChanged({
        conversationId: conversation._id,
        currentActiveAdvisorId: conversation.activeAdvisorId || "",
        newActiveAdvisorId: activeAdvisor._id,
      });
    }

    // Save user message
    const userMessageId = await saveUserMessage({
      conversationId: conversation._id,
      content: message,
      mentions,
    });

    // Generate prompts
    const systemPrompt = generateSystemPrompt(activeAdvisor as any);
    const conversationContext = generateConversationContext(conversation.messages as any);
    const userMessageWithContext = generateUserMessage(message, mentions);

    // Prepare AI messages
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(conversationContext ? [{ role: "system" as const, content: conversationContext }] : []),
      { role: "user" as const, content: userMessageWithContext },
    ];

    // Check Open Router API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error("Open Router API key not configured");
      return NextResponse.json({
        error: "OPENROUTER_API_KEY_MISSING",
        message: "Open Router API key is not configured",
        conversationId: conversation._id,
      }, { status: 500 });
    }

    // Model selection logic
    let modelSelection: ModelSelection;
    const chatRequest: ChatRequest = {
      messages: aiMessages,
      advisorId: activeAdvisor._id,
      userId: user.id,
      userTier: user.plan,
      conversationId: conversation._id,
    };

    try {
      modelSelection = await modelRouter.selectOptimalModel(chatRequest, activeAdvisor as any);

      // Override to GLM if forced or if advisor prefers GLM
      if (forceGLM || activeAdvisor.modelHint === "glm") {
        const availableModels = GLM_MODELS[user.plan as GLMModelTier] || GLM_MODELS.free;
        const modelKeys = Object.keys(availableModels);
        const selectedModel = modelKeys[0] || "anthropic/claude-3-haiku";

        modelSelection = {
          provider: "glm",
          model: selectedModel,
          config: {
            model: selectedModel,
            provider: "anthropic",
            temperature: 0.7,
            maxTokens: 4000,
            enableFunctionCalling: true,
            languagePreference: "auto",
          },
          reasoning: forceGLM ? "Forced GLM usage" : "Advisor prefers GLM",
        };
      }
    } catch (modelError: any) {
      console.error("Model selection error:", modelError.message);
      // Fallback to default model
      modelSelection = {
        provider: "anthropic",
        model: "anthropic/claude-3-haiku",
        config: {
          model: "anthropic/claude-3-haiku",
          provider: "anthropic",
          temperature: 0.7,
          maxTokens: 4000,
          enableFunctionCalling: true,
          languagePreference: "auto",
        },
        reasoning: "Fallback model selection",
      };
    }

    console.log("Model selection:", modelSelection);

    // Start performance tracking
    const startTime = Date.now();

    try {
      // Make Open Router API call using generateText for simpler integration
      const response = await generateText({
        model: openRouter(modelSelection.model),
        messages: aiMessages,
        temperature: modelSelection.config.temperature,
        topP: modelSelection.config.topP,
        frequencyPenalty: modelSelection.config.frequencyPenalty,
        presencePenalty: modelSelection.config.presencePenalty,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Extract response content
      const assistantMessage = response.text;
      if (!assistantMessage) {
        throw new ModelError("No assistant message in response", MODEL_ERROR_CODES.UNKNOWN_ERROR);
      }

      // Save AI response
      const savedMessageId = await saveAdvisorMessage({
        conversationId: conversation._id,
        advisorId: activeAdvisor._id,
        content: assistantMessage,
        tokensUsed: response.usage?.totalTokens || 0,
        contentJson: {
          usage: response.usage,
          model: modelSelection.model,
          provider: modelSelection.provider,
          finishReason: response.finishReason,
          modelSelection: modelSelection.reasoning,
        },
      });

      // Record performance metrics
      await recordGLMPerformance({
        advisorId: activeAdvisor._id,
        model: modelSelection.model,
        responseTime,
        tokenCount: {
          prompt: response.usage?.inputTokens || 0,
          completion: response.usage?.outputTokens || 0,
          total: response.usage?.totalTokens || 0,
        },
        success: true,
        timestamp: Date.now(),
      });

      // Record model comparison
      await recordModelComparison({
        advisorId: activeAdvisor._id,
        provider: modelSelection.provider === "anthropic" || modelSelection.provider === "openai" ? "openrouter" : "glm",
        model: modelSelection.model,
        userTier: user.plan,
        conversationId: conversation._id,
        metrics: {
          responseTime,
          totalTokens: response.usage?.totalTokens || 0,
          cost: 0, // TODO: Calculate Open Router cost
          userRating: undefined,
          wasFollowedUp: undefined,
        },
        context: {
          language: modelSelection.config.languagePreference,
          complexity: "moderate", // TODO: Determine from content
          category: activeAdvisor.category,
          requiredFunctionCalling: modelSelection.config.enableFunctionCalling || false,
        },
        timestamp: Date.now(),
      });

      // Optional title generation
      try {
        const updatedTitle = await generateTitleIfNeeded({
          conversationId: conversation._id,
          currentTitle: conversation.title,
          apiKey: openRouterApiKey,
        });

        if (updatedTitle && updatedTitle !== conversation.title) {
          conversation.title = updatedTitle;
        }
      } catch (titleErr) {
        console.warn('Open Router title generation skipped due to error:', titleErr);
      }

      // Return successful response
      const successResponse = NextResponse.json({
        success: true,
        message: {
          id: savedMessageId,
          content: assistantMessage,
          sender: "advisor",
          advisorId: activeAdvisor._id,
          createdAt: new Date(),
          tokensUsed: response.usage?.totalTokens,
        },
        conversation: {
          id: conversation._id,
          activeAdvisorId: activeAdvisor._id,
          title: conversation.title,
        },
        usage: response.usage,
        provider: modelSelection.provider,
        model: modelSelection.model,
        modelSelection: modelSelection.reasoning,
        responseTime,
      });

      return addSecurityHeaders(req, successResponse);

    } catch (openRouterError: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.error("Open Router API error:", openRouterError);

      // Record error metrics
      await recordGLMPerformance({
        advisorId: activeAdvisor._id,
        model: modelSelection.model,
        responseTime,
        tokenCount: { prompt: 0, completion: 0, total: 0 },
        success: false,
        error: openRouterError.message,
        timestamp: Date.now(),
      });

      // Handle specific Open Router errors
      if (openRouterError.status === 401) {
        return NextResponse.json({
          error: "OPENROUTER_AUTH_ERROR",
          message: "Open Router API authentication failed",
          details: "Invalid API key",
        }, { status: 401 });
      }

      if (openRouterError.status === 429) {
        return NextResponse.json({
          error: "OPENROUTER_RATE_LIMIT",
          message: "Open Router API rate limit exceeded",
          details: "Please try again later",
        }, { status: 429 });
      }

      // Fallback response for Open Router errors
      const fallbackResponse = `I apologize, but I'm experiencing some technical difficulties with my Open Router integration. Let me try to help you based on my general expertise.

*Note: This is a fallback response while we resolve the Open Router connection issue.*

How can I assist you today?`;

      const fallbackMessageId = await saveAdvisorMessage({
        conversationId: conversation._id,
        advisorId: activeAdvisor._id,
        content: fallbackResponse,
        tokensUsed: 50,
        contentJson: {
          error: openRouterError.message,
          fallback: true,
          provider: modelSelection.provider,
        },
      });

      const fallbackResponseData = NextResponse.json({
        success: true,
        message: {
          id: fallbackMessageId,
          content: fallbackResponse,
          sender: "advisor",
          advisorId: activeAdvisor._id,
          createdAt: new Date(),
          tokensUsed: 50,
        },
        conversation: formatConversationForChatResponse(conversation),
        usage: { totalTokens: 50, promptTokens: 25, completionTokens: 25 },
        provider: modelSelection.provider,
        model: modelSelection.model,
        fallback: true,
        error: openRouterError.message,
      });

      return addSecurityHeaders(req, fallbackResponseData);
    }

  } catch (error: any) {
    console.error("Open Router Chat API error:", error);

    const errorResponse = NextResponse.json(
      {
        error: "OPENROUTER_INTERNAL_ERROR",
        message: "An unexpected error occurred with Open Router chat",
        details: error.message,
      },
      { status: 500 }
    );

    return addSecurityHeaders(req, errorResponse);
  }
}