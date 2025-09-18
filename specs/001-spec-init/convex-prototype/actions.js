// Prototype Convex actions implemented as local functions
import convex from './convexMock.js';
import { createUser, createConversation, appendMessage, listMessagesForConversation } from './convexMock.js';

// createConversation action: validates and creates a conversation document
export async function createConversationAction({ ctx = {}, ownerClerkId, title = '', advisorIds = [] }) {
  // In a real Convex action we'd resolve the user by clerkId; here we create a user if not present
  let user = ctx.user || null;
  if (!user) {
    user = createUser({ clerkId: ownerClerkId, email: `${ownerClerkId}@example.com`, name: 'Prototype User' });
  }

  const conv = createConversation({ ownerId: user.id, title, advisorIds });
  return { success: true, conversation: conv };
}

// appendMessage action: append a message to a conversation
export async function appendMessageAction({ ctx = {}, conversationId, senderId, role = 'user', content = '', partial = false }) {
  // Basic validation
  const conv = convex.conversations.get(conversationId);
  if (!conv) return { success: false, error: 'conversation_not_found' };

  const msg = appendMessage({ conversationId, senderId, role, content, partial });
  // In Convex we would notify subscribers; here we just return the appended message
  return { success: true, message: msg };
}

// helper to list messages
export async function listMessagesAction({ conversationId }) {
  const msgs = listMessagesForConversation(conversationId);
  return msgs;
}
