import { ConvexHttpClient } from "convex/browser";

// Initialize Convex client for server-side use
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
}

export const convex = new ConvexHttpClient(convexUrl);

/**
 * Server-side Convex client utilities
 * These functions provide a server-side interface to Convex queries and mutations
 */

/**
 * Get all active advisors
 */
export async function getActiveAdvisors() {
  return await convex.query("advisors:getActiveAdvisors");
}

/**
 * Get advisor by Convex ID
 */
export async function getAdvisorById(advisorId: string) {
  try {
    return await convex.query("advisors:getAdvisorById", { advisorId: advisorId as any });
  } catch (error) {
    console.error("Error getting advisor by ID:", error);
    return null;
  }
}

/**
 * Create a new advisor
 */
export async function createAdvisor(advisorData: any) {
  return await convex.mutation("advisors:createAdvisor", advisorData);
}

/**
 * Get user conversations (temporary migration version)
 */
export async function getUserConversations() {
  return await convex.query("conversations:getAllConversationsForMigration");
}

/**
 * Get conversation by ID (temporary migration version)
 */
export async function getConversationById(conversationId: string) {
  return await convex.query("conversations:getConversationByIdForMigration", {
    conversationId: conversationId as any
  });
}

/**
 * Create a new conversation (temporary migration version)
 */
export async function createConversation(data: {
  title?: string;
  activeAdvisorId?: string;
}) {
  return await convex.mutation("conversations:createConversationForMigration", {
    title: data.title,
    activeAdvisorId: data.activeAdvisorId as any
  });
}

/**
 * Update a conversation (temporary migration version)
 */
export async function updateConversation(data: {
  conversationId: string;
  title?: string;
  activeAdvisorId?: string;
}) {
  return await convex.mutation("conversations:updateConversationForMigration", {
    conversationId: data.conversationId as any,
    title: data.title,
    activeAdvisorId: data.activeAdvisorId as any
  });
}

/**
 * Delete a conversation (temporary migration version)
 */
export async function deleteConversation(conversationId: string) {
  return await convex.mutation("conversations:deleteConversationForMigration", {
    conversationId: conversationId as any
  });
}

/**
 * Get message by ID (temporary migration version)
 */
export async function getMessageById(messageId: string) {
  return await convex.query("messages:getMessageByIdForMigration", {
    messageId: messageId as any
  });
}

/**
 * Update a message (temporary migration version)
 */
export async function updateMessage(data: {
  messageId: string;
  content?: string;
  contentJson?: any;
  mentions?: string[];
}) {
  return await convex.mutation("messages:updateMessageForMigration", {
    messageId: data.messageId as any,
    content: data.content,
    contentJson: data.contentJson,
    mentions: data.mentions
  });
}

/**
 * Delete a message (temporary migration version)
 */
export async function deleteMessage(messageId: string) {
  return await convex.mutation("messages:deleteMessageForMigration", {
    messageId: messageId as any
  });
}

/**
 * Get conversation with messages for chat (temporary migration version)
 */
export async function getConversationWithMessages(data: {
  conversationId: string;
  userId: string;
  messageLimit?: number;
}) {
  return await convex.query("conversations:getConversationWithMessagesForMigration", {
    conversationId: data.conversationId as any,
    userId: data.userId,
    messageLimit: data.messageLimit
  });
}

/**
 * Create conversation for chat (temporary migration version)
 */
export async function createConversationForChat(data: {
  userId: string;
  activeAdvisorId: string;
  title: string;
}) {
  return await convex.mutation("conversations:createConversationForChat", {
    userId: data.userId,
    activeAdvisorId: data.activeAdvisorId as any,
    title: data.title
  });
}

/**
 * Update conversation active advisor (temporary migration version)
 */
export async function updateConversationActiveAdvisor(data: {
  conversationId: string;
  activeAdvisorId: string;
}) {
  return await convex.mutation("conversations:updateConversationActiveAdvisorForMigration", {
    conversationId: data.conversationId as any,
    activeAdvisorId: data.activeAdvisorId as any
  });
}

/**
 * Create user message for chat (temporary migration version)
 */
export async function createUserMessage(data: {
  conversationId: string;
  content: string;
  mentions: string[];
}) {
  return await convex.mutation("messages:createUserMessageForMigration", {
    conversationId: data.conversationId as any,
    content: data.content,
    mentions: data.mentions
  });
}

/**
 * Create advisor message for chat (temporary migration version)
 */
export async function createAdvisorMessage(data: {
  conversationId: string;
  advisorId: string;
  content: string;
  tokensUsed?: number;
  contentJson?: any;
}) {
  return await convex.mutation("messages:createAdvisorMessageForMigration", {
    conversationId: data.conversationId as any,
    advisorId: data.advisorId as any,
    content: data.content,
    tokensUsed: data.tokensUsed,
    contentJson: data.contentJson
  });
}

/**
 * Get message count for conversation (temporary migration version)
 */
export async function getMessageCount(conversationId: string) {
  return await convex.query("messages:getMessageCountForMigration", {
    conversationId: conversationId as any
  });
}

/**
 * Get conversation history for title generation (temporary migration version)
 */
export async function getConversationHistory(data: {
  conversationId: string;
  limit?: number;
}) {
  return await convex.query("messages:getConversationHistoryForMigration", {
    conversationId: data.conversationId as any,
    limit: data.limit
  });
}

/**
 * Update conversation title (temporary migration version)
 */
export async function updateConversationTitle(data: {
  conversationId: string;
  title: string;
}) {
  return await convex.mutation("conversations:updateConversationTitleForMigration", {
    conversationId: data.conversationId as any,
    title: data.title
  });
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string) {
  return await convex.query("messages:getConversationMessages", { conversationId });
}

/**
 * Send a message
 */
export async function sendMessage(data: {
  conversationId: string;
  content: string;
  sender: "user" | "advisor" | "system";
  advisorId?: string;
  mentions?: string[];
}) {
  return await convex.mutation("messages:sendMessage", data);
}

/**
 * Get or create user in Convex
 */
export async function getOrCreateUser(userData: {
  clerkId: string;
  email?: string;
  name?: string;
  image?: string;
}) {
  return await convex.mutation("auth:getOrEnsureUser", userData);
}
