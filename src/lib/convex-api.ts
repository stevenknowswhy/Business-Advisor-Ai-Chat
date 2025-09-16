import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Types for our Convex API
export interface ConvexAdvisor {
  _id: Id<"advisors">;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  schemaVersion: string;
  status: "active" | "inactive" | "archived";
  persona: {
    name: string;
    title: string;
    description?: string;
    expertise?: string[];
    personality?: string[];
  };
  roleDefinition?: {
    role?: string;
    responsibilities?: string[];
    constraints?: string[];
  };
  components: any[];
  metadata?: {
    version?: string;
    author?: string;
    category?: string;
  };
  localization?: {
    language?: string;
    region?: string;
  };
  modelHint?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ConvexConversation {
  _id: Id<"conversations">;
  userId: Id<"users">;
  title?: string;
  activeAdvisorId?: Id<"advisors">;
  createdAt: number;
  updatedAt: number;
}

export interface ConvexMessage {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  sender: "user" | "advisor" | "system";
  content: string;
  advisorId?: Id<"advisors">;
  mentions: string[];
  createdAt: number;
  tokensUsed?: number;
}

// Convex API hooks for Advisors
export function useAdvisors() {
  return useQuery(api.advisors.getAllAdvisors);
}

export function useActiveAdvisors() {
  return useQuery(api.advisors.getActiveAdvisors);
}

export function useAdvisor(advisorId: Id<"advisors"> | undefined) {
  return useQuery(api.advisors.getAdvisorById, advisorId ? { advisorId } : "skip");
}

export function useCreateAdvisor() {
  return useMutation(api.advisors.createAdvisor);
}

export function useUpdateAdvisor() {
  return useMutation(api.advisors.updateAdvisor);
}

export function useDeleteAdvisor() {
  return useMutation(api.advisors.deleteAdvisor);
}

// Convex API hooks for Conversations
export function useConversations(enabled: boolean = true) {
  // Always call the hook, but use "skip" to prevent execution when not enabled
  return useQuery(api.conversations.getUserConversations, enabled ? {} : "skip");
}

export function useConversation(conversationId: Id<"conversations"> | undefined, enabled: boolean = true) {
  // Always call the hook, but use "skip" to prevent execution when not enabled or no conversationId
  return useQuery(
    api.conversations.getConversationById,
    (enabled && conversationId) ? { conversationId } : "skip"
  );
}

export function useCreateConversation() {
  return useMutation(api.conversations.createConversation);
}

export function useUpdateConversation() {
  return useMutation(api.conversations.updateConversation);
}

export function useDeleteConversation() {
  return useMutation(api.conversations.deleteConversation);
}

// Convex API hooks for Messages
export function useConversationMessages(conversationId: Id<"conversations"> | undefined, enabled: boolean = true) {
  // Always call the hook, but use "skip" to prevent execution when not enabled or no conversationId
  return useQuery(
    api.messages.getConversationMessages,
    (enabled && conversationId) ? { conversationId } : "skip"
  );
}

export function useSendMessage() {
  return useMutation(api.messages.sendMessage);
}

export function useUpdateMessage() {
  return useMutation(api.messages.updateMessage);
}

export function useDeleteMessage() {
  return useMutation(api.messages.deleteMessage);
}

// Convex API hooks for Real-time features
export function useTypingUsers(conversationId: Id<"conversations"> | undefined, enabled: boolean = true) {
  // Always call the hook, but use "skip" to prevent execution when not enabled or no conversationId
  return useQuery(
    api.realtime.getTypingUsers,
    (enabled && conversationId) ? { conversationId } : "skip"
  );
}

export function useSetTypingStatus() {
  return useMutation(api.realtime.setTypingStatus);
}

export function useUpdateUserPresence() {
  return useMutation(api.realtime.updateUserPresence);
}

// Convex API hooks for Authentication
export function useCurrentUser() {
  return useQuery(api.auth.getCurrentUserInfo);
}

export function useSyncUser() {
  return useMutation(api.auth.syncUserFromClerk);
}

export function useUpdateUserProfile() {
  return useMutation(api.auth.updateCurrentUserProfile);
}

// Utility functions for data transformation
export function transformAdvisorForClient(advisor: ConvexAdvisor) {
  const persona = advisor.persona as any;
  const fullName = persona?.name || [advisor.firstName, advisor.lastName].filter(Boolean).join(" ") || "Unknown";
  const title = persona?.title || "Advisor";
  const oneLiner = persona?.oneLiner || persona?.description || "";
  const archetype = persona?.archetype || advisor.metadata?.category || "General";
  const bio = persona?.bio || persona?.description || "";
  const expertise = (persona?.expertise as string[] | undefined) || advisor.tags || [];
  const image = persona?.image || advisor.imageUrl;
  const location = persona?.location || { city: "Remote", region: "Global" };
  const adviceDelivery = persona?.adviceDelivery || { mode: "conversational", formality: "professional", signOff: "Best regards" };
  const mission = (advisor.roleDefinition as any)?.mission || bio;

  return {
    id: advisor._id,
    name: fullName,
    title,
    image,
    oneLiner,
    archetype,
    bio,
    tags: expertise,
    location,
    adviceDelivery,
    mission,
  };
}

export function transformConversationForClient(conversation: ConvexConversation & { messages?: ConvexMessage[]; activeAdvisor?: ConvexAdvisor }) {
  return {
    id: conversation._id,
    title: conversation.title || "New Conversation",
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
    activeAdvisor: conversation.activeAdvisor ? transformAdvisorForClient(conversation.activeAdvisor) : undefined,
    messages: conversation.messages?.map(transformMessageForClient) || [],
    messageCount: conversation.messages?.length || 0,
    lastMessage: conversation.messages?.length ? {
      content: conversation.messages[conversation.messages.length - 1]!.content,
      createdAt: new Date(conversation.messages[conversation.messages.length - 1]!.createdAt),
      sender: conversation.messages[conversation.messages.length - 1]!.sender,
    } : undefined,
  };
}

export function transformMessageForClient(message: ConvexMessage & { advisor?: ConvexAdvisor }) {
  return {
    id: message._id,
    sender: message.sender,
    content: message.content,
    createdAt: new Date(message.createdAt),
    mentions: message.mentions,
    advisor: message.advisor ? transformAdvisorForClient(message.advisor) : undefined,
  };
}


// Actions for JSON-based advisor workflows
export function useUploadAdvisorJSON() {
  return useAction(api.advisors.uploadAdvisorJSON);
}

export function useEnrichAdvisorsFromJSON() {
  return useAction(api.advisors.enrichAdvisorsFromJSON);
}
