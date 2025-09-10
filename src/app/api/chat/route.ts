import { streamText, generateText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createOpenAI } from "@ai-sdk/openai";
import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";
import { getModelForTier } from "~/server/llm/openrouter";
import { generateSystemPrompt, generateConversationContext, generateUserMessage, extractMentions } from "~/server/llm/prompt";
import { getActiveAdvisors, getAdvisorById } from "~/server/advisors/persona";

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
      user = await requireUser();
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

    console.log("Step 3: Getting advisors and processing mentions...");
    // Get available advisors for mention parsing
    let availableAdvisors, mentions;
    try {
      availableAdvisors = await getActiveAdvisors();
      console.log("Step 3a: Available advisors count:", availableAdvisors.length);

      // Extract mentions from message
      mentions = extractMentions(message, availableAdvisors);
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
      activeAdvisor = await getAdvisorById(mentions[0]!);
    } else if (advisorId) {
      console.log("Step 3c: Using specified advisor:", advisorId);
      // Use specified advisor
      activeAdvisor = await getAdvisorById(advisorId);
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
    console.log("Step 3 SUCCESS: Active advisor selected:", activeAdvisor.id);

    console.log("Step 4: Getting or creating conversation...");
    // Get or create conversation
    let conversation;
    try {
      if (conversationId) {
        console.log("Step 4a: Finding existing conversation:", conversationId);
        conversation = await db.conversation.findUnique({
          where: { id: conversationId, userId: user.id },
          include: {
            messages: {
              include: { advisor: true },
              orderBy: { createdAt: "asc" },
              take: 50, // Limit context window
            },
          },
        });

        if (!conversation) {
          console.error("CRITICAL ERROR: Conversation not found:", conversationId);
          return Response.json({
            error: "CONVERSATION_NOT_FOUND",
            message: "The specified conversation could not be found",
            conversationId
          }, { status: 404 });
        }
        console.log("Step 4a SUCCESS: Found conversation with", conversation.messages.length, "messages");
      } else {
        console.log("Step 4b: Creating new conversation...");
        // Create new conversation
        conversation = await db.conversation.create({
          data: {
            userId: user.id,
            activeAdvisorId: activeAdvisor.id,
            title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          },
          include: {
            messages: { include: { advisor: true } },
          },
        });
        console.log("Step 4b SUCCESS: Created new conversation:", conversation.id);
      }
    } catch (dbError: any) {
      console.error("Step 4 FAILED: Database operation error:", dbError.message);
      console.error("Database error stack:", dbError.stack);
      return Response.json({
        error: "DATABASE_ERROR",
        message: "Database operation failed",
        details: dbError.message
      }, { status: 500 });
    }

    console.log("Step 5: Updating conversation and saving user message...");
    // Update active advisor if changed
    if (conversation.activeAdvisorId !== activeAdvisor.id) {
      console.log("Step 5a: Updating active advisor from", conversation.activeAdvisorId, "to", activeAdvisor.id);
      await db.conversation.update({
        where: { id: conversation.id },
        data: { activeAdvisorId: activeAdvisor.id },
      });
    }

    // Save user message
    console.log("Step 5b: Saving user message...");
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "user",
        content: message,
        mentions,
      },
    });
    console.log("Step 5 SUCCESS: User message saved:", userMessage.id);

    console.log("Step 6: Generating prompts and preparing AI messages...");
    // Generate system prompt and context
    const systemPrompt = generateSystemPrompt(activeAdvisor);
    console.log("Step 6a: System prompt generated, length:", systemPrompt.length);

    const conversationContext = generateConversationContext(conversation.messages);
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

    // Use the verified working model directly (same as chat-minimal)
    const model = "x-ai/grok-code-fast-1";
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

    // Critical check: If no API key, fail fast with detailed error
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL ERROR: OPENROUTER_API_KEY is missing in production environment");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('OPENROUTER')));
      return Response.json({
        error: "MISSING_API_KEY",
        message: "OpenRouter API key is not configured",
        conversationId: conversation.id,
        activeAdvisorId: activeAdvisor.id,
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

        // Check if it's an API key issue (401 "User not found")
        if (directResponse.status === 401 && errorText.includes("User not found")) {
          console.log("Step 7 FALLBACK: Using mock response due to invalid API key");

          // Generate a helpful mock response based on the advisor
          const advisorName = (activeAdvisor.persona as any)?.name || "AI Advisor";
          const mockResponse = `Hello! I'm ${advisorName}, and I'd be happy to help you.

*Note: This is a demo response because the OpenRouter API key needs to be updated. In a production environment, I would provide personalized advice based on my expertise.*

How can I assist you today?`;

          // Save the mock assistant message
          const assistantMessage = await db.message.create({
            data: {
              conversationId: conversation.id,
              sender: "advisor",
              advisorId: activeAdvisor.id,
              content: mockResponse,
              tokensUsed: 50, // Mock token count
            },
          });

          // Return successful response with mock data
          return Response.json({
            success: true,
            message: {
              id: assistantMessage.id,
              content: mockResponse,
              sender: "advisor",
              advisorId: activeAdvisor.id,
              createdAt: assistantMessage.createdAt,
              tokensUsed: 50,
            },
            conversation: {
              id: conversation.id,
              activeAdvisorId: activeAdvisor.id,
              title: conversation.title,
            },
            usage: { total_tokens: 50, prompt_tokens: 25, completion_tokens: 25 },
            isDemo: true, // Flag to indicate this is a demo response
          });
        }

        // For other errors, return the original error response
        return Response.json({
          error: "AI_API_ERROR",
          message: "Failed to generate response from AI service",
          details: `OpenRouter API returned ${directResponse.status}`,
          conversationId: conversation.id,
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
          conversationId: conversation.id,
        }, { status: 500 });
      }

      // Extract the response content
      const assistantMessage = responseData.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        console.error("Step 7 FAILED: No assistant message in response");
        return Response.json({
          error: "NO_AI_RESPONSE",
          message: "AI service did not provide a response",
          conversationId: conversation.id,
        }, { status: 500 });
      }

      console.log("Step 7 SUCCESS: AI response generated!");
      console.log("- Response length:", assistantMessage.length);
      console.log("- Tokens used:", responseData.usage?.total_tokens);

      // Save the AI response to database
      console.log("Step 7d: Saving AI response to database...");
      let savedMessage;
      try {
        savedMessage = await db.message.create({
          data: {
            conversationId: conversation.id,
            sender: "advisor",
            advisorId: activeAdvisor.id,
            content: assistantMessage,
            tokensUsed: responseData.usage?.total_tokens,
            contentJson: {
              usage: responseData.usage,
              model,
              finishReason: responseData.choices?.[0]?.finish_reason,
            },
          },
        });
        console.log("Step 7d SUCCESS: AI response saved to database");
      } catch (dbError: any) {
        console.error("Step 7d ERROR: Database save error:", dbError.message);
        return Response.json({
          error: "DATABASE_SAVE_ERROR",
          message: "Failed to save AI response to database",
          conversationId: conversation.id,
        }, { status: 500 });
      }

      // Optional: generate/update title when enough context exists (>= 2 user+assistant exchanges)
      try {
        const msgCount = await db.message.count({ where: { conversationId: conversation.id } });
        const shouldTitle = !conversation.title || conversation.title === 'New Conversation' || (conversation.title?.length ?? 0) > 30;
        if (msgCount >= 4 && shouldTitle) {
          const history = await db.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: 10,
          });
          const historyText = history.map(m => `${m.sender === 'user' ? 'User' : 'Advisor'}: ${m.content}`).join('\n');

          const titlePrompt = `You are titling a chat. Return ONLY a concise, catchy title of at most 5 words. No punctuation beyond standard letters and digits. Title the conversation based on this transcript:\n\n${historyText}`;

          const titleResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
              "X-Title": "AI Advisor Chat",
            },
            body: JSON.stringify({
              model: "x-ai/grok-code-fast-1",
              messages: [
                { role: "system", content: "Return ONLY a title, max 5 words." },
                { role: "user", content: titlePrompt }
              ],
              temperature: 0.5,
              max_tokens: 12,
            }),
          });

          if (titleResp.ok) {
            const json = await titleResp.json();
            const raw = json?.choices?.[0]?.message?.content || '';
            const condensed = (raw || '').replace(/[\n\r]/g, ' ').trim().replace(/[^\p{L}\p{N} \-]/gu, '').split(' ').filter(Boolean).slice(0, 5).join(' ');
            if (condensed) {
              await db.conversation.update({ where: { id: conversation.id }, data: { title: condensed } });
              conversation.title = condensed;
            }
          }
        }
      } catch (titleErr) {
        console.warn('Title generation skipped due to error:', titleErr);
      }

      // Return structured JSON response
      return Response.json({
        success: true,
        message: {
          id: savedMessage.id,
          content: assistantMessage,
          sender: "advisor",
          advisorId: activeAdvisor.id,
          createdAt: savedMessage.createdAt,
          tokensUsed: responseData.usage?.total_tokens,
        },
        conversation: {
          id: conversation.id,
          activeAdvisorId: activeAdvisor.id,
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
