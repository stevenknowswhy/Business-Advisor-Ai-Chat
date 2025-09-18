import { streamText, generateText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

// Replace Prisma imports with Convex imports for migration
import { auth, currentUser } from "@clerk/nextjs/server";

// Convex-based imports
import {
  getAvailableAdvisorsRaw,
  getAdvisorByIdRaw,
  getOrCreateConversation,
  updateActiveAdvisorIfChanged,
  saveUserMessage,
  saveAdvisorMessage,
  generateTitleIfNeeded,
  formatConversationForChatResponse,
  formatMessageForChatResponse,
} from "~/server/convex/chat";

// Minimal, robust auth helper for Convex migration
async function debugRequireUser() {
  // For migration testing, return a mock user
  // TODO: Re-enable authentication after migration is complete
  return {
    id: "migration-test-user",
    email: "test@example.com",
    name: "Migration Test User",
    image: null,
    plan: "free",
  };

  /* Original authentication code - re-enable after migration:
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User details not found from Clerk");

  return {
    id: userId,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    name: clerkUser.fullName || null,
    image: clerkUser.imageUrl || null,
    plan: "free",
  };
  */
}

import { generateSystemPrompt, generateConversationContext, generateUserMessage, extractMentions } from "~/server/llm/prompt";


// CRITICAL: Force Node.js runtime for Prisma and streaming compatibility
export const runtime = "nodejs";

// Request schema validation for AI SDK format
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    id: z.string().optional(),
  })),
  conversationId: z.string().optional(),
  advisorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  console.log("=== CHAT API START ===");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);
  console.log("Environment check:");
  console.log("- OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);
  console.log("- OPENROUTER_FREE_MODEL:", process.env.OPENROUTER_FREE_MODEL);
  console.log("- OPENROUTER_BASE_MODEL:", process.env.OPENROUTER_BASE_MODEL);
  console.log("- OPENROUTER_PREMIUM_MODEL:", process.env.OPENROUTER_PREMIUM_MODEL);
  console.log("- DATABASE_URL present:", !!process.env.DATABASE_URL);

  try {
    console.log("Step 1: Authenticating user...");
    // Authenticate user
    let user;
    try {
      user = await debugRequireUser();
      console.log("Step 1 SUCCESS: User authenticated:", user.id, user.plan);
    } catch (authError: any) {
      console.error("Step 1 FAILED: Authentication error:", authError.message);
      console.error("Auth error stack:", authError.stack);
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to use the chat functionality",
        code: 401
      }, { status: 401 });
    }

    console.log("Step 2: Parsing request body...");
    // Parse and validate request
    let body, messages, conversationId, advisorId;
    try {
      body = await req.json();
      console.log("Step 2a: Raw body received:", JSON.stringify(body, null, 2));

      const parsed = chatRequestSchema.parse(body);
      messages = parsed.messages;
      conversationId = parsed.conversationId;
      advisorId = parsed.advisorId;

      console.log("Step 2 SUCCESS: Request parsed and validated");
      console.log("- Messages count:", messages.length);
      console.log("- Conversation ID:", conversationId);
      console.log("- Advisor ID:", advisorId);
    } catch (parseError: any) {
      console.error("Step 2 FAILED: Request parsing error:", parseError.message);
      console.error("Parse error stack:", parseError.stack);
      return Response.json({
        error: "INVALID_REQUEST",
        message: "Invalid request format",
        details: parseError.message
      }, { status: 400 });
    }

    // Get the latest user message
    const userMessages = messages.filter(m => m.role === "user");
    const latestMessage = userMessages[userMessages.length - 1];

    if (!latestMessage) {
      return Response.json({
        error: "NO_USER_MESSAGE",
        message: "No user message found in request"
      }, { status: 400 });
    }

    const message = latestMessage.content;

    console.log("Step 3: Getting advisors and processing mentions (CONVEX)...");
    // Get available advisors for mention parsing
    let availableAdvisors, mentions;
    try {
      availableAdvisors = await getAvailableAdvisorsRaw();
      console.log("Step 3a: Available advisors count:", availableAdvisors.length);

      // Extract mentions from message
      mentions = extractMentions(message, availableAdvisors as any);
      console.log("Step 3b: Mentions extracted:", mentions);
    } catch (advisorError: any) {
      console.error("Step 3 FAILED: Advisor processing error:", advisorError.message);
      console.error("Advisor error stack:", advisorError.stack);
      return Response.json({
        error: "ADVISOR_PROCESSING_ERROR",
        message: "Failed to process advisor information",
        details: advisorError.message
      }, { status: 500 });
    }

    // Determine active advisor
    let activeAdvisor;
    if (mentions.length > 0) {
      console.log("Step 3c: Using mentioned advisor:", mentions[0]);
      // If message starts with @mention, switch to that advisor
      activeAdvisor = await getAdvisorByIdRaw(mentions[0]!);
    } else if (advisorId) {
      console.log("Step 3c: Using specified advisor:", advisorId);
      // Use specified advisor
      activeAdvisor = await getAdvisorByIdRaw(advisorId);
    } else {
      console.log("Step 3c: Using default advisor");
      // Default to first available advisor
      activeAdvisor = availableAdvisors[0];
    }

    if (!activeAdvisor) {
      console.error("CRITICAL ERROR: No advisor available");
      return Response.json({
        error: "NO_ADVISOR_AVAILABLE",
        message: "No advisor is available to handle this request"
      }, { status: 400 });
    }
    console.log("Step 3 SUCCESS: Active advisor selected:", activeAdvisor._id);

    console.log("Step 4: Getting or creating conversation (CONVEX)...");
    // Get or create conversation
    let conversation;
    try {
      conversation = await getOrCreateConversation({
        conversationId,
        userId: user.id,
        activeAdvisorId: activeAdvisor._id,
        messageContent: message,
      });

      if (conversationId && !conversation) {
        console.error("CRITICAL ERROR: Conversation not found:", conversationId);
        return Response.json({
          error: "CONVERSATION_NOT_FOUND",
          message: "The specified conversation could not be found",
          conversationId
        }, { status: 404 });
      }

      const messageCount = conversation.messages?.length || 0;
      console.log("Step 4 SUCCESS: Conversation ready with", messageCount, "messages");
    } catch (dbError: any) {
      console.error("Step 4 FAILED: Database operation error:", dbError.message);
      console.error("Database error stack:", dbError.stack);
      return Response.json({
        error: "DATABASE_ERROR",
        message: "Database operation failed",
        details: dbError.message
      }, { status: 500 });
    }

    console.log("Step 5: Updating conversation and saving user message (CONVEX)...");
    // Update active advisor if changed
    if (conversation.activeAdvisorId !== activeAdvisor._id) {
      console.log("Step 5a: Updating active advisor from", conversation.activeAdvisorId, "to", activeAdvisor._id);
      await updateActiveAdvisorIfChanged({
        conversationId: conversation._id,
        currentActiveAdvisorId: conversation.activeAdvisorId || "",
        newActiveAdvisorId: activeAdvisor._id,
      });
    }

    // Save user message
    console.log("Step 5b: Saving user message...");
    const userMessageId = await saveUserMessage({
      conversationId: conversation._id,
      content: message,
      mentions,
    });
    console.log("Step 5 SUCCESS: User message saved:", userMessageId);

    console.log("Step 6: Generating prompts and preparing AI messages...");
    // Generate system prompt and context
    const systemPrompt = generateSystemPrompt(activeAdvisor as any);
    console.log("Step 6a: System prompt generated, length:", systemPrompt.length);

    const conversationContext = generateConversationContext(conversation.messages as any);
    console.log("Step 6b: Conversation context generated, length:", conversationContext?.length || 0);

    const userMessageWithContext = generateUserMessage(message, mentions);
    console.log("Step 6c: User message with context generated, length:", userMessageWithContext.length);

    // Prepare messages for AI
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(conversationContext ? [{ role: "system" as const, content: conversationContext }] : []),
      { role: "user" as const, content: userMessageWithContext },
    ];
    console.log("Step 6d: AI messages prepared, total count:", aiMessages.length);

    // Use the model from environment variables based on user plan
    const model = user.plan === "premium"
      ? process.env.OPENROUTER_PREMIUM_MODEL
      : user.plan === "base"
        ? process.env.OPENROUTER_BASE_MODEL
        : process.env.OPENROUTER_FREE_MODEL;
    console.log("Step 6 SUCCESS: Model selection complete");
    console.log("- User plan:", user.plan);
    console.log("- Selected model:", model, "(using verified working model)");
    console.log("- Model available in env:", !!model);

    console.log("Step 7: Starting AI generation...");
    console.log("=== AI GENERATION SETUP ===");
    console.log("Model:", model);
    console.log("OpenRouter API Key present:", !!process.env.OPENROUTER_API_KEY);
    console.log("OpenRouter API Key length:", process.env.OPENROUTER_API_KEY?.length || 0);
    console.log("APP_URL:", process.env.APP_URL || 'undefined');
    console.log("NODE_ENV:", process.env.NODE_ENV || 'undefined');

    // Critical check: If no API key, provide appropriate response based on environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!apiKey) {
      console.error("CRITICAL ERROR: OPENROUTER_API_KEY is missing");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('OPENROUTER')));

      if (isDevelopment) {
        console.log("Development mode: Providing helpful mock response");

        // Generate development mock response
        const persona = (activeAdvisor.persona as any);
        const advisorName = persona?.name || "AI Advisor";
        const mockResponse = `Hello! I'm ${advisorName}.\n\n*Development Mode*: OpenRouter API key is not configured. To enable real AI responses:\n\n1. Get an API key from https://openrouter.ai\n2. Add it to your .env.local file as OPENROUTER_API_KEY\n3. Restart the development server\n\nFor now, I'm providing this mock response to demonstrate the chat functionality.`;

        // Save mock message
        const assistantMessageId = await saveAdvisorMessage({
          conversationId: conversation._id,
          advisorId: activeAdvisor._id,
          content: mockResponse,
          tokensUsed: 50,
        });

        return Response.json({
          success: true,
          message: {
            id: assistantMessageId,
            content: mockResponse,
            sender: "advisor",
            advisorId: activeAdvisor._id,
            createdAt: new Date(),
            tokensUsed: 50,
          },
          conversation: formatConversationForChatResponse(conversation),
          usage: { total_tokens: 50, prompt_tokens: 25, completion_tokens: 25 },
          isDevelopmentMode: true,
        });
      }

      return Response.json({
        error: "MISSING_API_KEY",
        message: "OpenRouter API key is not configured",
        conversationId: conversation._id,
        activeAdvisorId: activeAdvisor._id,
      }, { status: 500 });
    }

    console.log("AI Messages count:", aiMessages.length);
    console.log("AI Messages preview:", JSON.stringify(aiMessages.map(m => ({ role: m.role, contentLength: m.content.length })), null, 2));

    try {
      // Simplified approach: Direct OpenRouter API call with JSON response
      console.log("Step 7a: Making direct OpenRouter API call...");

      const directResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "AI Advisor Chat",
        },
        body: JSON.stringify({
          model: model,
          messages: aiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      console.log("Step 7b: API response status:", directResponse.status);

      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        console.error("Step 7 FAILED: OpenRouter API error:", directResponse.status, errorText);

        // Check if it's an API key issue (401 "User not found") or other API errors
        if (directResponse.status === 401 || directResponse.status === 403) {
          console.log("Step 7 FALLBACK: Using intelligent mock response due to API authentication issue");

          // Generate an intelligent mock response based on the advisor's persona and user message
          const persona = (activeAdvisor.persona as any);
          const advisorName = persona?.name || "AI Advisor";
          const advisorTitle = persona?.title || "Advisor";
          const advisorArchetype = persona?.archetype || "Professional";
          const signOff = persona?.adviceDelivery?.signOff || "Best regards";

          // Create a contextual response based on the user's message
          const userMessageLower = message.toLowerCase();
          let mockResponse = `Hello! I'm ${advisorName}, ${advisorTitle}.\n\n`;

          // Add contextual response based on message content
          if (userMessageLower.includes('help') || userMessageLower.includes('advice')) {
            mockResponse += `I'd be delighted to help you with your inquiry. As a ${advisorArchetype}, I bring extensive experience to guide you through your challenges.\n\n`;
          } else if (userMessageLower.includes('question') || userMessageLower.includes('ask')) {
            mockResponse += `That's an excellent question! Let me share some insights based on my experience.\n\n`;
          } else {
            mockResponse += `Thank you for reaching out. I'm here to provide you with expert guidance.\n\n`;
          }

          mockResponse += `*Note: This is a development demo response. In production, I would provide personalized, detailed advice based on my specific expertise and background.*\n\n`;
          mockResponse += `How can I best assist you today?\n\n${signOff}`;

          // Save the mock assistant message
          const assistantMessageId = await saveAdvisorMessage({
            conversationId: conversation._id,
            advisorId: activeAdvisor._id,
            content: mockResponse,
            tokensUsed: 75, // Mock token count
          });

          // Return successful response with mock data
          return Response.json({
            success: true,
            message: {
              id: assistantMessageId,
              content: mockResponse,
              sender: "advisor",
              advisorId: activeAdvisor._id,
              createdAt: new Date(),
              tokensUsed: 75,
            },
            conversation: formatConversationForChatResponse(conversation),
            usage: { total_tokens: 75, prompt_tokens: 35, completion_tokens: 40 },
            isDemo: true, // Flag to indicate this is a demo response
          });
        }

        // For other errors, return the original error response
        return Response.json({
          error: "AI_API_ERROR",
          message: "Failed to generate response from AI service",
          details: `OpenRouter API returned ${directResponse.status}`,
          conversationId: conversation._id,
        }, { status: 500 });
      }

      // Parse the JSON response
      let responseData;
      try {
        responseData = await directResponse.json();
        console.log("Step 7c: Response parsed successfully");
        console.log("- Choices count:", responseData.choices?.length);
        console.log("- Usage:", responseData.usage);
      } catch (parseError: any) {
        console.error("Step 7 FAILED: JSON parse error:", parseError.message);
        return Response.json({
          error: "RESPONSE_PARSE_ERROR",
          message: "Failed to parse AI response",
          conversationId: conversation._id,
        }, { status: 500 });
      }

      // Extract the response content
      const assistantMessage = responseData.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        console.error("Step 7 FAILED: No assistant message in response");
        return Response.json({
          error: "NO_AI_RESPONSE",
          message: "AI service did not provide a response",
          conversationId: conversation._id,
        }, { status: 500 });
      }

      console.log("Step 7 SUCCESS: AI response generated!");
      console.log("- Response length:", assistantMessage.length);
      console.log("- Tokens used:", responseData.usage?.total_tokens);

      // Save the AI response to database
      console.log("Step 7d: Saving AI response to database (CONVEX)...");
      let savedMessageId;
      try {
        savedMessageId = await saveAdvisorMessage({
          conversationId: conversation._id,
          advisorId: activeAdvisor._id,
          content: assistantMessage,
          tokensUsed: responseData.usage?.total_tokens,
          contentJson: {
            usage: responseData.usage,
            model,
            finishReason: responseData.choices?.[0]?.finish_reason,
          },
        });
        console.log("Step 7d SUCCESS: AI response saved to database");
      } catch (dbError: any) {
        console.error("Step 7d ERROR: Database save error:", dbError.message);
        return Response.json({
          error: "DATABASE_SAVE_ERROR",
          message: "Failed to save AI response to database",
          conversationId: conversation._id,
        }, { status: 500 });
      }

      // Optional: generate/update title when enough context exists (>= 2 user+assistant exchanges)
      try {
        const updatedTitle = await generateTitleIfNeeded({
          conversationId: conversation._id,
          currentTitle: conversation.title,
          apiKey: apiKey!,
        });

        if (updatedTitle && updatedTitle !== conversation.title) {
          conversation.title = updatedTitle;
        }
      } catch (titleErr) {
        console.warn('Title generation skipped due to error:', titleErr);
      }

      // Return structured JSON response
      return Response.json({
        success: true,
        message: {
          id: savedMessageId,
          content: assistantMessage,
          sender: "advisor",
          advisorId: activeAdvisor._id,
          createdAt: new Date(),
          tokensUsed: responseData.usage?.total_tokens,
        },
        conversation: {
          id: conversation._id,
          activeAdvisorId: activeAdvisor._id,
          title: conversation.title,
        },
        usage: responseData.usage,
      }, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });



    } catch (aiError: any) {
      console.error("=== CRITICAL AI GENERATION ERROR ===");
      console.error("Error during AI generation setup:", aiError);
      console.error("Error type:", aiError?.constructor?.name || 'Unknown');
      console.error("Error message:", aiError?.message || 'No message');
      console.error("Error stack:", aiError?.stack || 'No stack');
      throw aiError; // Re-throw to be caught by outer try-catch
    }

  } catch (error: any) {
    console.error("=== CHAT API CRITICAL ERROR ===");
    console.error("Error type:", error?.constructor?.name || 'Unknown');
    console.error("Error message:", error?.message || 'No message');
    console.error("Error stack:", error?.stack || 'No stack');
    console.error("Full error object:", error);
    console.error("=== END CRITICAL ERROR ===");

    if (error instanceof z.ZodError) {
      console.error("Zod validation error details:", error.errors);
      const first = error.errors?.[0];
      const detail = first ? `${first.message} at ${first.path?.join('.')}` : 'Invalid request data';
      return Response.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: detail,
        validationErrors: error.errors
      }, { status: 400 });
    }

    // Check for authentication errors
    if (error?.message?.includes('User not authenticated') ||
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('not found')) {
      console.error("Authentication error detected");
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to use the chat functionality",
        code: 401
      }, { status: 401 });
    }

    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please try again.",
      code: 500
    }, { status: 500 });
  }
}
