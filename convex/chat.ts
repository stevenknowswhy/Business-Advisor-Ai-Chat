import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireUser } from "./auth";
import { validateConversationOwnership } from "./middleware";

/**
 * Chat Action for AI Completions
 * 
 * This action handles AI chat completions by calling external APIs
 * and then saving the response back to the database.
 */

export const sendChatMessage: any = action({
  args: {
    conversationId: v.id("conversations"),
    message: v.string(),
    advisorId: v.optional(v.id("advisors")),
  },
  handler: async (ctx, args) => {
    console.log("=== CONVEX CHAT ACTION START ===");
    
    // Note: Actions can't use authentication context directly
    // We'll need to pass the user token and validate it
    
    try {
      // First, save the user message
      const userMessageId = await ctx.runMutation(api.messages.sendMessage, {
        conversationId: args.conversationId,
        sender: "user",
        content: args.message,
        mentions: [], // TODO: Extract mentions
      });

      console.log("User message saved:", userMessageId);

      // Get conversation and advisor details for AI context
      const conversation = await ctx.runQuery(api.conversations.getConversationById, {
        conversationId: args.conversationId,
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Get advisor details
      let activeAdvisor;
      if (args.advisorId) {
        activeAdvisor = await ctx.runQuery(api.advisors.getAdvisorById, {
          advisorId: args.advisorId,
        });
      } else if (conversation.activeAdvisor) {
        activeAdvisor = conversation.activeAdvisor;
      }

      if (!activeAdvisor) {
        throw new Error("No advisor available");
      }

      // Prepare messages for AI
      const systemPrompt = generateSystemPrompt(activeAdvisor);
      const conversationHistory = conversation.messages || [];
      
      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-10).map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content: args.message },
      ];

      console.log("Calling OpenRouter API...");

      // Call OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "AI Advisor Chat",
        },
        body: JSON.stringify({
          model: "x-ai/grok-code-fast-1",
          messages: aiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", response.status, errorText);
        
        // Fallback to mock response
        const mockResponse = `Hello! I'm ${activeAdvisor.persona.name}, and I'd be happy to help you.

*Note: This is a demo response because the OpenRouter API key needs to be updated. In a production environment, I would provide personalized advice based on my expertise.*

How can I assist you today?`;

        // Save mock assistant message
        const assistantMessageId = await ctx.runMutation(api.messages.sendMessage, {
          conversationId: args.conversationId,
          sender: "advisor",
          advisorId: args.advisorId || (activeAdvisor as any)?._id,
          content: mockResponse,
          tokensUsed: 50,
        });

        return {
          success: true,
          messageId: assistantMessageId,
          content: mockResponse,
          isDemo: true,
        };
      }

      // Parse AI response
      const responseData = await response.json();
      const assistantContent = responseData.choices?.[0]?.message?.content;

      if (!assistantContent) {
        throw new Error("No response from AI");
      }

      // Save assistant message
      const assistantMessageId = await ctx.runMutation(api.messages.sendMessage, {
        conversationId: args.conversationId,
        sender: "advisor",
        advisorId: args.advisorId || (activeAdvisor as any)?._id,
        content: assistantContent,
        tokensUsed: responseData.usage?.total_tokens,
      });

      console.log("Assistant message saved:", assistantMessageId);

      return {
        success: true,
        messageId: assistantMessageId,
        content: assistantContent,
        tokensUsed: responseData.usage?.total_tokens,
      };

    } catch (error) {
      console.error("Chat action error:", error);
      throw error;
    }
  },
});

// Helper function to generate system prompt
function generateSystemPrompt(advisor: any): string {
  const persona = advisor.persona;
  return `You are ${persona.name}, ${persona.title}.

${persona.description || "You are an expert advisor ready to help with any questions."}

Your expertise includes: ${persona.expertise?.join(", ") || "general advice"}

Please provide helpful, accurate, and personalized advice based on your expertise. Be conversational but professional.`;
}
