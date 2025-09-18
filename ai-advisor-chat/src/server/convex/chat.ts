import {
  getActiveAdvisors,
  getAdvisorById,
} from "./advisors";
import {
  getConversationWithMessages,
  createConversationForChat,
  updateConversationActiveAdvisor,
  updateConversationTitle,
  convex,
} from "./client";
import {
  createUserMessage,
  createAdvisorMessage,
  getMessageCount,
  getConversationHistory,
} from "./client";

/**
 * Convex-based chat utilities
 * These replace the Prisma-based functions in the chat API route
 */

/**
 * Get available advisors for mention processing
 * Returns raw advisor data with full persona objects for prompt generation
 */
export async function getAvailableAdvisorsRaw() {
  // Get raw advisors from Convex without client formatting
  // This preserves the full persona structure needed for prompt generation
  return await convex.query("advisors:getAllActiveAdvisorsForMigration");
}

/**
 * Get advisor by ID with full persona data for prompt generation
 */
export async function getAdvisorByIdRaw(advisorId: string) {
  return await convex.query("advisors:getAdvisorByIdForMigration", {
    advisorId: advisorId as any
  });
}

/**
 * Get or create conversation for chat
 */
export async function getOrCreateConversation(data: {
  conversationId?: string;
  userId: string;
  activeAdvisorId: string;
  messageContent: string;
}) {
  if (data.conversationId) {
    // Get existing conversation
    const conversation = await getConversationWithMessages({
      conversationId: data.conversationId,
      userId: data.userId,
      messageLimit: 50,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  } else {
    // Create new conversation
    const title = data.messageContent.slice(0, 50) + (data.messageContent.length > 50 ? "..." : "");
    
    return await createConversationForChat({
      userId: data.userId,
      activeAdvisorId: data.activeAdvisorId,
      title,
    });
  }
}

/**
 * Update conversation active advisor if changed
 */
export async function updateActiveAdvisorIfChanged(data: {
  conversationId: string;
  currentActiveAdvisorId: string;
  newActiveAdvisorId: string;
}) {
  if (data.currentActiveAdvisorId !== data.newActiveAdvisorId) {
    await updateConversationActiveAdvisor({
      conversationId: data.conversationId,
      activeAdvisorId: data.newActiveAdvisorId,
    });
  }
}

/**
 * Save user message to conversation
 */
export async function saveUserMessage(data: {
  conversationId: string;
  content: string;
  mentions: string[];
}) {
  return await createUserMessage({
    conversationId: data.conversationId,
    content: data.content,
    mentions: data.mentions,
  });
}

/**
 * Save advisor message to conversation
 */
export async function saveAdvisorMessage(data: {
  conversationId: string;
  advisorId: string;
  content: string;
  tokensUsed?: number;
  contentJson?: any;
}) {
  return await createAdvisorMessage({
    conversationId: data.conversationId,
    advisorId: data.advisorId,
    content: data.content,
    tokensUsed: data.tokensUsed,
    contentJson: data.contentJson,
  });
}

/**
 * Generate conversation title if needed
 */
export async function generateTitleIfNeeded(data: {
  conversationId: string;
  currentTitle?: string;
  apiKey: string;
}) {
  try {
    const msgCount = await getMessageCount(data.conversationId);
    const shouldTitle = !data.currentTitle || 
                       data.currentTitle === 'New Conversation' || 
                       (data.currentTitle?.length ?? 0) > 30;

    if (msgCount >= 4 && shouldTitle) {
      const history = await getConversationHistory({
        conversationId: data.conversationId,
        limit: 10,
      });

      const historyText = history.map(m => 
        `${m.sender === 'user' ? 'User' : 'Advisor'}: ${m.content}`
      ).join('\n');

      const titlePrompt = `You are titling a chat. Return ONLY a concise, catchy title of at most 5 words. No punctuation beyond standard letters and digits. Title the conversation based on this transcript:\n\n${historyText}`;

      const titleResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${data.apiKey}`,
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
        const condensed = (raw || '')
          .replace(/[\n\r]/g, ' ')
          .trim()
          .replace(/[^\p{L}\p{N} \-]/gu, '')
          .split(' ')
          .filter(Boolean)
          .slice(0, 5)
          .join(' ');

        if (condensed) {
          await updateConversationTitle({
            conversationId: data.conversationId,
            title: condensed,
          });
          return condensed;
        }
      }
    }
  } catch (titleErr) {
    console.warn('Title generation skipped due to error:', titleErr);
  }

  return data.currentTitle;
}

/**
 * Format conversation for client response
 */
export function formatConversationForChatResponse(conversation: any) {
  return {
    id: conversation._id,
    activeAdvisorId: conversation.activeAdvisorId,
    title: conversation.title,
  };
}

/**
 * Format message for client response
 */
export function formatMessageForChatResponse(message: any, messageId: string) {
  return {
    id: messageId,
    content: message.content,
    sender: message.sender,
    advisorId: message.advisorId,
    createdAt: new Date(message.createdAt),
    tokensUsed: message.tokensUsed,
  };
}

// Re-export client functions for convenience
export {
  getActiveAdvisors,
  getAdvisorById,
  getConversationWithMessages,
  createConversationForChat,
  updateConversationActiveAdvisor,
  createUserMessage,
  createAdvisorMessage,
  getMessageCount,
  getConversationHistory,
  updateConversationTitle,
};
