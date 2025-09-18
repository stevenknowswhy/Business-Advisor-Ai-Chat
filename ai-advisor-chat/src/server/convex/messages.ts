import { 
  getMessageById, 
  updateMessage, 
  deleteMessage 
} from "./client";

/**
 * Convex-based message utilities
 * These replace the Prisma-based functions in message API routes
 */

/**
 * Format message for client-side use
 * This maintains the same interface as the Prisma version
 */
export function formatMessageForClient(message: any) {
  return {
    id: message._id,
    content: message.content,
    sender: message.sender,
    createdAt: new Date(message.createdAt),
    conversationId: message.conversationId,
    mentions: message.mentions || [],
    advisor: message.advisor ? {
      id: message.advisor._id,
      name: message.advisor.name,
      title: message.advisor.title,
      imageUrl: message.advisor.imageUrl,
      persona: message.advisor.persona,
    } : null,
    conversation: message.conversation ? {
      id: message.conversation._id,
      title: message.conversation.title,
      userId: message.conversation.userId,
    } : null,
  };
}

// Re-export the client functions for convenience
export { 
  getMessageById, 
  updateMessage, 
  deleteMessage 
};
