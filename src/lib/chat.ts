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
    try {
      // Add user message to the messages array
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: input,
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");

      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          conversationId,
          advisorId: activeAdvisorId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "",
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                assistantMessage.content += parsed.choices[0].delta.content;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err : new Error('Chat error'));
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, conversationId, activeAdvisorId]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    originalHandleSubmit(e);
  }, [originalHandleSubmit, input]);

  const switchAdvisor = useCallback((advisorId: string) => {
    setActiveAdvisorId(advisorId);
  }, []);

  const extractMentions = useCallback((text: string, availableAdvisors: Advisor[]): string[] => {
    const mentions: string[] = [];
    const mentionRegex = /@(\w+(?:\s+\w+)*)/gi;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[1]?.toLowerCase();
      
      const matchedAdvisor = availableAdvisors.find(advisor =>
        advisor.name.toLowerCase().includes(mentionText || "") ||
        advisor.name.split(' ')[0]?.toLowerCase() === mentionText
      );

      if (matchedAdvisor && !mentions.includes(matchedAdvisor.id)) {
        mentions.push(matchedAdvisor.id);
      }
    }

    return mentions;
  }, []);

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
    extractMentions,
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
