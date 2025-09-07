import { streamText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";
import { openrouter, getModelForTier } from "~/server/llm/openrouter";
import { generateSystemPrompt, generateConversationContext, generateUserMessage, extractMentions } from "~/server/llm/prompt";
import { getActiveAdvisors, getAdvisorById } from "~/server/advisors/persona";

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
  try {
    // Authenticate user
    const user = await requireUser();

    // Parse and validate request
    const body = await req.json();
    const { messages, conversationId, advisorId } = chatRequestSchema.parse(body);

    // Get the latest user message
    const userMessages = messages.filter(m => m.role === "user");
    const latestMessage = userMessages[userMessages.length - 1];

    if (!latestMessage) {
      return new Response("No user message found", { status: 400 });
    }

    const message = latestMessage.content;

    // Get available advisors for mention parsing
    const availableAdvisors = await getActiveAdvisors();
    
    // Extract mentions from message
    const mentions = extractMentions(message, availableAdvisors);
    
    // Determine active advisor
    let activeAdvisor;
    if (mentions.length > 0) {
      // If message starts with @mention, switch to that advisor
      activeAdvisor = await getAdvisorById(mentions[0]!);
    } else if (advisorId) {
      // Use specified advisor
      activeAdvisor = await getAdvisorById(advisorId);
    } else {
      // Default to first available advisor
      activeAdvisor = availableAdvisors[0];
    }

    if (!activeAdvisor) {
      return new Response("No advisor available", { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
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
        return new Response("Conversation not found", { status: 404 });
      }
    } else {
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
    }

    // Update active advisor if changed
    if (conversation.activeAdvisorId !== activeAdvisor.id) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { activeAdvisorId: activeAdvisor.id },
      });
    }

    // Save user message
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "user",
        content: message,
        mentions,
      },
    });

    // Generate system prompt and context
    const systemPrompt = generateSystemPrompt(activeAdvisor);
    const conversationContext = generateConversationContext(conversation.messages);
    const userMessageWithContext = generateUserMessage(message, mentions);

    // Prepare messages for AI
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(conversationContext ? [{ role: "system" as const, content: conversationContext }] : []),
      { role: "user" as const, content: userMessageWithContext },
    ];

    // Get model for user's tier
    const model = getModelForTier(user.plan);
    console.log("Chat API: User plan:", user.plan);
    console.log("Chat API: Selected model:", model);

    // Debug logging
    console.log("Chat API: Starting AI generation");
    console.log("Model:", model);
    console.log("AI Messages:", JSON.stringify(aiMessages, null, 2));
    console.log("OpenRouter API Key present:", !!process.env.OPENROUTER_API_KEY);

    // Stream response
    const result = streamText({
      model: openrouter.languageModel(model),
      messages: aiMessages,
      temperature: 0.7,
      onFinish: async (result) => {
        console.log("Chat API: AI generation finished");
        console.log("Result text length:", result.text?.length || 0);
        console.log("Usage:", result.usage);

        // Save advisor response
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
      },
      onError: (error) => {
        console.error("Chat API: AI generation error:", error);
      },
    });

    console.log("Chat API: Returning streaming response");
    return result.toTextStreamResponse({
      headers: {
        "X-Conversation-Id": conversation.id,
        "X-Active-Advisor": activeAdvisor.id,
      },
    });

  } catch (error) {
    console.error("Chat API error:", error);
    
    if (error instanceof z.ZodError) {
      return new Response("Invalid request data", { status: 400 });
    }
    
    return new Response("Internal server error", { status: 500 });
  }
}
