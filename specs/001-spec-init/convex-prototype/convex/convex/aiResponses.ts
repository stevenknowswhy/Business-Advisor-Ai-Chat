import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Generate AI response using OpenRouter API
 */
export const generateAdvisorResponse = action({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    userMessage: v.string(),
    conversationHistory: v.array(v.object({
      role: v.string(),
      content: v.string(),
      senderName: v.string(),
    })),
  },
  handler: async (ctx, { conversationId, advisorId, userMessage, conversationHistory }) => {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_BASE_MODEL || "deepseek/deepseek-chat-v3-0324";

    console.log("🔧 DEBUG: Starting AI response generation");
    console.log("🔧 API Key present:", !!OPENROUTER_API_KEY);
    console.log("🔧 Model:", OPENROUTER_MODEL);
    console.log("🔧 User message:", userMessage);

    if (!OPENROUTER_API_KEY) {
      console.error("❌ OpenRouter API key not configured");
      throw new Error("OpenRouter API key not configured");
    }

    try {
      // Get advisor details
      const advisor = await ctx.runQuery(internal.advisors.getAdvisorById, { advisorId });
      if (!advisor) {
        console.error("❌ Advisor not found:", advisorId);
        throw new Error("Advisor not found");
      }

      console.log("✅ Advisor found:", advisor.name, "- Expertise:", advisor.persona?.expertise);

      // Build conversation context
      const systemPrompt = `You are ${advisor.name}, an AI advisor specializing in ${advisor.persona?.expertise || 'general consulting'}. 

Your background: ${advisor.persona?.description || 'You are a knowledgeable advisor ready to help.'}

Guidelines:
- Respond as ${advisor.name} in first person
- Keep responses conversational and helpful (2-3 sentences max)
- Draw from your expertise in ${advisor.persona?.expertise || 'your field'}
- Be encouraging and solution-focused
- If the user's message is a greeting, respond warmly and ask how you can help with your area of expertise`;

      // Format conversation history for the API
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: `${msg.senderName}: ${msg.content}`
        })),
        { role: "user", content: userMessage }
      ];

      console.log("🔧 System prompt:", systemPrompt);
      console.log("🔧 Messages for API:", JSON.stringify(messages, null, 2));

      // Call OpenRouter API
      console.log("🔧 Calling OpenRouter API...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-advisor-app.com",
          "X-Title": "AI Advisor Chat"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          max_tokens: 200,
          temperature: 0.7,
        })
      });

      console.log("🔧 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OpenRouter API error:", response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("🔧 API Response data:", JSON.stringify(data, null, 2));

      const aiResponse = data.choices?.[0]?.message?.content;
      console.log("🔧 Extracted AI response:", aiResponse);

      if (!aiResponse) {
        console.error("❌ No response content from AI");
        throw new Error("No response from AI");
      }

      console.log("✅ Successfully generated AI response, saving to conversation...");

      // Save the advisor response to the conversation
      await ctx.runMutation(internal.messages.createAdvisorMessage, {
        conversationId,
        advisorId,
        content: aiResponse.trim(),
      });

      console.log("✅ AI response saved successfully");
      return { success: true, response: aiResponse.trim() };

    } catch (error) {
      console.error("❌ Error generating advisor response:", error);
      console.error("❌ Error details:", error.message, error.stack);

      // Get advisor details for fallback
      const advisor = await ctx.runQuery(internal.advisors.getAdvisorById, { advisorId }).catch(() => null);

      // Enhanced contextual fallback responses
      const fallbackResponses = {
        marketing: `For app marketing, I'd focus on three key areas: identifying your target audience, creating compelling value propositions, and choosing the right channels. What's your app's main value proposition?`,
        strategy: `From a strategic perspective, let's break this down systematically. What's your primary business objective here? Understanding your goals will help me provide more targeted advice.`,
        perspective: `Based on my experience in ${advisor?.persona?.expertise || 'business strategy'}, I see several angles to consider. The key is understanding your specific context and constraints. Can you share more details about your situation?`,
        general: `That's an important topic in ${advisor?.persona?.expertise?.toLowerCase() || 'business'}. Let me share some insights based on my experience. What specific aspect would you like to dive deeper into?`
      };

      let fallbackResponse = fallbackResponses.general;
      const lowerMessage = userMessage.toLowerCase();

      if (lowerMessage.includes('marketing') || lowerMessage.includes('promote') || lowerMessage.includes('advertise')) {
        fallbackResponse = fallbackResponses.marketing;
      } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan') || lowerMessage.includes('approach')) {
        fallbackResponse = fallbackResponses.strategy;
      } else if (lowerMessage.includes('perspective') || lowerMessage.includes('opinion') || lowerMessage.includes('think')) {
        fallbackResponse = fallbackResponses.perspective;
      }

      console.log("🔧 Using fallback response:", fallbackResponse);

      // Save fallback response
      await ctx.runMutation(internal.messages.createAdvisorMessage, {
        conversationId,
        advisorId,
        content: fallbackResponse,
      });

      return { success: true, response: fallbackResponse, usedFallback: true };
    }
  },
});

/**
 * Test function to debug AI response generation
 */
export const testAIResponse = action({
  args: {
    advisorId: v.id("advisors"),
    userMessage: v.string(),
  },
  handler: async (ctx, { advisorId, userMessage }) => {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_BASE_MODEL || "deepseek/deepseek-chat-v3-0324";

    console.log("🧪 TEST: Starting AI response test");
    console.log("🧪 API Key present:", !!OPENROUTER_API_KEY);
    console.log("🧪 Model:", OPENROUTER_MODEL);
    console.log("🧪 User message:", userMessage);

    try {
      // Get advisor details
      const advisor = await ctx.runQuery(internal.advisors.getAdvisorById, { advisorId });
      console.log("🧪 Advisor data:", JSON.stringify(advisor, null, 2));

      if (!advisor) {
        return { error: "Advisor not found" };
      }

      // Build system prompt
      const systemPrompt = `You are ${advisor.name}, an AI advisor specializing in ${advisor.persona?.expertise || 'general consulting'}.

Your background: ${advisor.persona?.description || 'You are a knowledgeable advisor ready to help.'}

Guidelines:
- Respond as ${advisor.name} in first person
- Keep responses conversational and helpful (2-3 sentences max)
- Draw from your expertise in ${advisor.persona?.expertise || 'your field'}
- Be encouraging and solution-focused
- Provide specific, actionable advice`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ];

      console.log("🧪 System prompt:", systemPrompt);
      console.log("🧪 Messages:", JSON.stringify(messages, null, 2));

      // Test API call
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-advisor-app.com",
          "X-Title": "AI Advisor Chat Test"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          max_tokens: 200,
          temperature: 0.7,
        })
      });

      console.log("🧪 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🧪 API Error:", errorText);
        return { error: `API Error: ${response.status} - ${errorText}` };
      }

      const data = await response.json();
      console.log("🧪 API Response:", JSON.stringify(data, null, 2));

      const aiResponse = data.choices?.[0]?.message?.content;

      return {
        success: true,
        advisor: advisor.name,
        expertise: advisor.persona?.expertise,
        userMessage,
        aiResponse,
        systemPrompt,
        apiStatus: response.status,
      };

    } catch (error) {
      console.error("🧪 Test error:", error);
      return { error: error.message };
    }
  },
});
