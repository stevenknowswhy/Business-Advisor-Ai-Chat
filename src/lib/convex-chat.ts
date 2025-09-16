import { useState, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  useConversationMessages,
  useSendMessage,
  useCreateConversation,
  transformMessageForClient,
  type ConvexMessage,
  type ConvexAdvisor
} from "./convex-api";

// Types for the Convex chat system
export interface ConvexChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  advisor?: string;
  createdAt?: Date;
  tokensUsed?: number;
  isDemo?: boolean;
}

interface UseConvexChatProps {
  conversationId?: Id<"conversations">;
  activeAdvisorId?: Id<"advisors">;
  isAuthenticated?: boolean;
}

export function useConvexChat({ conversationId, activeAdvisorId, isAuthenticated = true }: UseConvexChatProps = {}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationData, setConversationData] = useState<any>(null);

  // Convex hooks
  const messages = useConversationMessages(conversationId, isAuthenticated);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  // TODO: Fix API generation issue
  // const sendChatMessage = useAction(api.chat.sendChatMessage);

  // Transform Convex messages to chat format
  const transformedMessages: ConvexChatMessage[] = (messages || []).map((msg: any) => ({
    id: msg._id,
    role: msg.sender === "user" ? "user" : msg.sender === "advisor" ? "assistant" : "system",
    content: msg.content,
    advisor: msg.advisorId,
    createdAt: new Date(msg.createdAt),
    tokensUsed: msg.tokensUsed,
  }));

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      let currentConversationId = conversationId;

      // Create conversation if it doesn't exist
      if (!currentConversationId) {
        console.log("Creating new conversation...");
        currentConversationId = await createConversation({
          title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
          activeAdvisorId,
        });
        console.log("Created conversation:", currentConversationId);
      }

      // TODO: Implement AI chat completion with Convex action
      // For now, just save the user message
      console.log("Sending user message...");
      await sendMessage({
        conversationId: currentConversationId,
        sender: "user",
        content: input,
        contentJson: null,
        mentions: [],
        tokensUsed: 0,
      });

      // Mock AI response for now
      await sendMessage({
        conversationId: currentConversationId,
        sender: "assistant",
        content: "This is a mock response. The AI integration will be completed in the next phase.",
        contentJson: null,
        mentions: [],
        tokensUsed: 0,
      });

      console.log("Messages sent successfully");
      setInput("");

    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [input, conversationId, activeAdvisorId, sendMessage, createConversation]);

  const reload = useCallback(() => {
    // Messages are automatically reloaded via Convex reactivity
    setError(null);
  }, []);

  const stop = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    messages: transformedMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    conversationData,
    setMessages: () => {}, // Not needed with Convex reactivity
    setInput,
  };
}

// Helper function to extract mentions from message content
export function extractMentions(content: string, advisors: any[]): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const mentionName = match[1]?.toLowerCase();
    const advisor = advisors.find(a => 
      a.name.toLowerCase().includes(mentionName) ||
      a.name.split(' ')[0]?.toLowerCase() === mentionName
    );
    if (advisor) {
      mentions.push(advisor.id);
    }
  }

  return mentions;
}

// Legacy compatibility - export the same interface as the original chat hook
export function useAdvisorChat(conversationId?: string) {
  const convexConversationId = conversationId as Id<"conversations"> | undefined;
  return useConvexChat({ conversationId: convexConversationId });
}
