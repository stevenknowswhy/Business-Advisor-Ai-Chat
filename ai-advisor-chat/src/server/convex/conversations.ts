import { 
  getUserConversations, 
  getConversationById, 
  createConversation, 
  updateConversation, 
  deleteConversation 
} from "./client";

/**
 * Convex-based conversation utilities
 * These replace the Prisma-based functions in conversation API routes
 */

/**
 * Format conversation for client-side use
 * This maintains the same interface as the Prisma version
 */
export function formatConversationForClient(conversation: any) {
  return {
    id: conversation._id,
    title: conversation.title || "New Conversation",
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
    messageCount: conversation.messageCount || 0,
    lastMessage: conversation.lastMessage ? {
      content: conversation.lastMessage.content,
      createdAt: new Date(conversation.lastMessage.createdAt),
      sender: conversation.lastMessage.sender,
    } : null,
    activeAdvisor: conversation.activeAdvisor ? {
      id: conversation.activeAdvisor._id,
      name: conversation.activeAdvisor.name,
      title: conversation.activeAdvisor.title,
      imageUrl: conversation.activeAdvisor.imageUrl,
    } : null,
  };
}

/**
 * Format conversation with messages for client-side use
 */
export function formatConversationWithMessagesForClient(conversation: any) {
  const formattedMessages = conversation.messages?.map((message: any) => ({
    id: message._id,
    sender: message.sender,
    content: message.content,
    createdAt: new Date(message.createdAt),
    mentions: message.mentions || [],
    advisor: message.advisor ? {
      id: message.advisor._id,
      name: message.advisor.name,
      title: message.advisor.title,
      imageUrl: message.advisor.imageUrl,
      persona: message.advisor.persona,
    } : null,
  })) || [];

  return {
    id: conversation._id,
    title: conversation.title || "New Conversation",
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
    activeAdvisor: conversation.activeAdvisor ? {
      id: conversation.activeAdvisor._id,
      name: conversation.activeAdvisor.name,
      title: conversation.activeAdvisor.title,
      imageUrl: conversation.activeAdvisor.imageUrl,
      persona: conversation.activeAdvisor.persona,
    } : null,
    messages: formattedMessages,
  };
}

// Re-export the client functions for convenience
export { 
  getUserConversations, 
  getConversationById, 
  createConversation, 
  updateConversation, 
  deleteConversation 
};
