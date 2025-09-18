// Lightweight in-memory Convex-like store for prototyping actions
import { v4 as uuidv4 } from 'uuid';

const store = {
  users: new Map(),
  advisors: new Map(),
  conversations: new Map(),
  messages: new Map()
};

export function nowISO() {
  return new Date().toISOString();
}

export function createUser(user) {
  const id = `u_${uuidv4()}`;
  const doc = { id, ...user, createdAt: nowISO() };
  store.users.set(id, doc);
  return doc;
}

export function getUserById(id) {
  return store.users.get(id) || null;
}

export function createConversation({ ownerId, title = '', advisorIds = [] }) {
  const id = `conv_${uuidv4()}`;
  const doc = { id, ownerId, title, advisorIds, createdAt: nowISO() };
  store.conversations.set(id, doc);
  return doc;
}

export function appendMessage({ conversationId, senderId, role = 'user', content = '', partial = false }) {
  const id = `msg_${uuidv4()}`;
  const doc = { id, conversationId, senderId, role, content, partial, createdAt: nowISO() };
  store.messages.set(id, doc);

  // Keep lightweight index on conversation
  const conv = store.conversations.get(conversationId);
  if (!conv) throw new Error('Conversation not found');
  conv.lastMessageAt = doc.createdAt;

  return doc;
}

export function listMessagesForConversation(conversationId) {
  return Array.from(store.messages.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function debugDump() {
  return {
    users: Array.from(store.users.values()),
    advisors: Array.from(store.advisors.values()),
    conversations: Array.from(store.conversations.values()),
    messages: Array.from(store.messages.values())
  };
}

export default store;
