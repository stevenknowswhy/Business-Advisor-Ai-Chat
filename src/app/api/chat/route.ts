import { streamText, generateText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";
import { openrouter, getModelForTier } from "~/server/llm/openrouter";
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
      return new Response("Authentication failed", {
        status: 401,
        headers: { "X-Error": "Authentication-Failed" }
      });
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
      return new Response("Invalid request format", {
        status: 400,
        headers: { "X-Error": "Request-Parse-Failed" }
      });
    }

    // Get the latest user message
    const userMessages = messages.filter(m => m.role === "user");
    const latestMessage = userMessages[userMessages.length - 1];

    if (!latestMessage) {
      return new Response("No user message found", { status: 400 });
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
      return new Response("Advisor processing failed", {
        status: 500,
        headers: { "X-Error": "Advisor-Processing-Failed" }
      });
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
      return new Response("No advisor available", { status: 400 });
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
          return new Response("Conversation not found", { status: 404 });
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
      return new Response("Database operation failed", {
        status: 500,
        headers: { "X-Error": "Database-Operation-Failed" }
      });
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

    // Get model for user's tier
    const model = getModelForTier(user.plan);
    console.log("Step 6 SUCCESS: Model selection complete");
    console.log("- User plan:", user.plan);
    console.log("- Selected model:", model);
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
      return new Response("Configuration error: Missing OpenRouter API key", {
        status: 500,
        headers: {
          "X-Error": "Missing-API-Key",
          "X-Conversation-Id": conversation.id,
          "X-Active-Advisor": activeAdvisor.id,
        }
      });
    }

    console.log("AI Messages count:", aiMessages.length);
    console.log("AI Messages preview:", JSON.stringify(aiMessages.map(m => ({ role: m.role, contentLength: m.content.length })), null, 2));

    try {
      // DIAGNOSTIC: Test non-streaming first to isolate the issue
      console.log("Step 7a-DIAGNOSTIC: Testing non-streaming generateText with original openrouter client...");
      const diagnosticResult = await generateText({
        model: openrouter.languageModel(model),
        messages: aiMessages,
        temperature: 0.7,
      });
      console.log("Step 7a-DIAGNOSTIC Results:");
      console.log("- Text length:", diagnosticResult.text?.length || 0);
      console.log("- Text preview:", diagnosticResult.text?.substring(0, 100) || '(empty)');
      console.log("- Finish reason:", diagnosticResult.finishReason);
      console.log("- Usage:", JSON.stringify(diagnosticResult.usage));

      // If diagnostic works, return simple response for now
      if (diagnosticResult.text && diagnosticResult.text.length > 0) {
        console.log("Step 7a-DIAGNOSTIC: SUCCESS - returning non-streaming response");

        // Save the response to database
        try {
          await db.message.create({
            data: {
              conversationId: conversation.id,
              sender: "advisor",
              advisorId: activeAdvisor.id,
              content: diagnosticResult.text,
              tokensUsed: diagnosticResult.usage?.totalTokens,
              contentJson: {
                usage: diagnosticResult.usage,
                model,
                finishReason: diagnosticResult.finishReason,
              },
            },
          });
          console.log("Step 7a-DIAGNOSTIC: Response saved to database");
        } catch (dbError) {
          console.error("Step 7a-DIAGNOSTIC: Database save error:", dbError);
        }

        return new Response(diagnosticResult.text, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "X-Conversation-Id": conversation.id,
            "X-Active-Advisor": activeAdvisor.id,
            "X-Diagnostic": "non-streaming-success",
          },
        });
      }

      console.log("Step 7a-DIAGNOSTIC: Non-streaming failed, trying streaming...");
      // Stream response
      console.log("Step 7b: Creating streamText instance...");
      const result = streamText({
        model: openrouter.languageModel(model),
        messages: aiMessages,
        temperature: 0.7,
        onFinish: async (result) => {
          console.log("=== AI GENERATION FINISHED ===");
          console.log("Result text length:", result.text?.length || 0);
          console.log("Result text preview:", result.text?.substring(0, 100) + "...");
          console.log("Usage:", result.usage);
          console.log("Finish reason:", result.finishReason);

          try {
            // Save advisor response
            console.log("Saving advisor response to database...");
            await db.message.create({
              data: {
                conversationId: conversation.id,
                sender: "advisor",
                advisorId: activeAdvisor.id,
                content: result.text,
                tokensUsed: result.usage?.totalTokens,
                contentJson: {
                  usage: result.usage,
                  model,
                  finishReason: result.finishReason,
                },
              },
            });
            console.log("Advisor response saved successfully");
          } catch (dbError) {
            console.error("Database save error:", dbError);
          }
        },
        onError: (error) => {
          console.error("=== AI GENERATION ERROR ===");
          console.error("Full error object:", error);
          if (error.error) {
            console.error("Nested error:", error.error);
          }
        },
      });

      console.log("Step 7b: streamText instance created successfully");
      console.log("Step 7c: Converting to text stream response...");

      const response = result.toTextStreamResponse({
        headers: {
          "X-Conversation-Id": conversation.id,
          "X-Active-Advisor": activeAdvisor.id,
        },
      });

      console.log("Step 7 SUCCESS: Returning streaming response");
      console.log("=== CHAT API END (SUCCESS) ===");
      return response;

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
      // Echo back the first error path for easier client debugging in test page
      const first = error.errors?.[0];
      const detail = first ? `${first.message} at ${first.path?.join('.')}` : 'Invalid request data';
      return new Response(`Invalid request data: ${detail}` , { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
