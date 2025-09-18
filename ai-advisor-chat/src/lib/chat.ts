import { useChat } from "@ai-sdk/react";
import { useState, useCallback } from "react";

// Types for our chat system
export interface Advisor {
  id: string;
  name: string;
  title: string;
  image?: string;
  oneLiner: string;
  archetype: string;
  bio: string;
  detailedBackground?: string;
  experience?: string;
  specialties?: string[];
  personalInterests?: string[];
  communicationStyle?: string;
  location: {
    city: string;
    region: string;
  };
  adviceDelivery: {
    mode: string;
    formality: string;
    signOff: string;
  };
  mission: string;
  tags: string[];
  modelHint?: string;
}

export interface Message {
  id: string;
  sender: "user" | "advisor" | "system";
  content: string;
  createdAt: Date;
  mentions?: string[];
  advisor?: Advisor;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  activeAdvisor?: Advisor;
  messages: Message[];
  messageCount?: number;
  lastMessage?: {
    content: string;
    createdAt: Date;
    sender: string;
  };
}

// Custom hook for chat functionality
export function useAdvisorChat(conversationId?: string) {
  const [activeAdvisorId, setActiveAdvisorId] = useState<string | undefined>();
  const [conversationData, setConversationData] = useState<Conversation | null>(null);

  // For now, use a simpler implementation until we can properly configure the AI SDK
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const originalHandleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);

    // Add user message to the messages array
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {

      // Call the chat API
      console.log('Calling chat API with:', {
        messages: newMessages,
        conversationId,
        advisorId: activeAdvisorId,
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: newMessages,
          conversationId,
          advisorId: activeAdvisorId,
        }),
      });

      console.log('Chat API response status:', response.status);
      console.log('Chat API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Chat API error response:', errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error('Chat API error response (text):', errorText);
          throw new Error(`Chat API error: ${response.status} - ${errorText}`);
        }

        // Handle structured error responses
        if (errorData.error === 'AUTH_REQUIRED') {
          throw new Error('AUTH_REQUIRED: Please sign in to use the chat functionality.');
        }

        const errorMessage = errorData && typeof errorData === 'object' && 'message' in errorData
          ? (errorData as { message: string }).message
          : `Chat API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Handle JSON response from simplified API
      console.log('Processing JSON response from chat API...');
      let responseData;
      try {
        responseData = await response.json();
        console.log('Chat API response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from chat API');
      }

      // Validate response structure
      if (!responseData.success || !responseData.message) {
        console.error('Invalid response structure:', responseData);
        throw new Error('Invalid response structure from chat API');
      }

      // Add the assistant message to state
      const assistantMessage = {
        id: responseData.message.id,
        role: "assistant" as const,
        content: responseData.message.content,
        advisor: responseData.message.advisorId,
        createdAt: responseData.message.createdAt,
        tokensUsed: responseData.message.tokensUsed,
        isDemo: responseData.isDemo || false, // Flag for demo responses
      };

      console.log('Adding assistant message to state:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

      // Sync advisor changes from API response (e.g., from @mentions)
      if (responseData.conversation?.activeAdvisorId &&
          responseData.conversation.activeAdvisorId !== activeAdvisorId) {
        console.log('Syncing advisor change from API:', responseData.conversation.activeAdvisorId);
        setActiveAdvisorId(responseData.conversation.activeAdvisorId as string);
      }

      // Propagate conversation updates (e.g., title changes) to consumers
      if (responseData.conversation) {
        setConversationData(prev => ({
          id: responseData.conversation.id ?? prev?.id ?? (conversationId || ''),
          title: responseData.conversation.title ?? prev?.title ?? 'New Conversation',
          createdAt: prev?.createdAt ?? new Date(),
          updatedAt: new Date(),
          activeAdvisor: prev?.activeAdvisor,
          messages: prev?.messages ?? [],
          messageCount: prev?.messageCount,
          lastMessage: prev?.lastMessage,
        } as any));
      }

      console.log('Chat API call completed successfully');
      console.log('- Message ID:', assistantMessage.id);
      console.log('- Content length:', assistantMessage.content.length);
      console.log('- Tokens used:', assistantMessage.tokensUsed);
      console.log('- Active advisor:', responseData.conversation?.activeAdvisorId);
      console.log('- Title:', responseData.conversation?.title);
    } catch (err) {
      console.error('Chat error:', err);

      // Remove the user message that was optimistically added if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes('AUTH_REQUIRED')) {
          setError(new Error('Please sign in to use the chat functionality.'));
        } else if (err.message.includes('401')) {
          setError(new Error('Authentication required. Please sign in to continue.'));
        } else if (err.message.includes('CONVERSATION_NOT_FOUND')) {
          setError(new Error('Conversation not found. Please start a new conversation.'));
        } else if (err.message.includes('NO_ADVISOR_AVAILABLE')) {
          setError(new Error('No advisor is available. Please try again later.'));
        } else {
          setError(new Error(err.message || 'An error occurred while sending your message.'));
        }
      } else {
        setError(new Error('An unexpected error occurred. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, conversationId, activeAdvisorId]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    originalHandleSubmit(e);
  }, [originalHandleSubmit, input]);

  const switchAdvisor = useCallback(async (advisorId: string) => {
    console.log("Switching advisor to:", advisorId);

    // Update local state immediately for responsive UI
    setActiveAdvisorId(advisorId);

    // If we have a conversation, persist the advisor switch to the database
    if (conversationData?.id) {
      try {
        console.log("Persisting advisor switch to database for conversation:", conversationData.id);

        const response = await fetch(`/api/conversations/${conversationData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activeAdvisorId: advisorId,
          }),
        });

        if (!response.ok) {
          console.error("Failed to persist advisor switch:", response.status);
          // Don't throw error - local state is already updated for better UX
        } else {
          console.log("Advisor switch persisted successfully");

          // Update conversation data with new active advisor
          setConversationData(prev => prev ? {
            ...prev,
            activeAdvisorId: advisorId,
          } : null);
        }
      } catch (error) {
        console.error("Error persisting advisor switch:", error);
        // Don't throw error - local state is already updated for better UX
      }
    }
  }, [conversationData?.id, setConversationData]);

  // Mention extraction is now handled server-side only
  // This removes the duplicate frontend logic that was causing conflicts

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    activeAdvisorId,
    switchAdvisor,
    conversationData,
    setConversationData,
  };
}

// Utility functions
export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export function getAdvisorInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAdvisorColor(advisorId: string): string {
  // Generate consistent colors based on advisor ID
  const colors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
  ];
  
  const hash = advisorId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] || "bg-gray-500";
}
