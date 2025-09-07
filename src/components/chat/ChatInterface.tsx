"use client";

import { useState, useEffect } from "react";
import { AdvisorRail } from "./AdvisorRail";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationHeader } from "./ConversationHeader";
import { useAdvisorChat, type Advisor, type Conversation } from "~/lib/chat";
import { AdvisorsAPI, ConversationsAPI } from "~/lib/api";

export function ChatInterface() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    activeAdvisorId,
    switchAdvisor,
    extractMentions,
    setMessages,
  } = useAdvisorChat(currentConversation?.id);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [advisorsData, conversationsData] = await Promise.all([
          AdvisorsAPI.getAll(),
          ConversationsAPI.getAll(),
        ]);
        
        setAdvisors(advisorsData);
        setConversations(conversationsData);
        
        // If no conversations exist, create a new one
        if (conversationsData.length === 0) {
          const newConversation = await ConversationsAPI.create({
            title: "New Conversation",
            advisorId: advisorsData[0]?.id,
          });
          setCurrentConversation(newConversation);
          setConversations([newConversation]);
        } else {
          // Load the most recent conversation
          const latestConversation = await ConversationsAPI.getById(conversationsData[0]!.id);
          setCurrentConversation(latestConversation);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleNewConversation = async () => {
    try {
      const newConversation = await ConversationsAPI.create({
        title: "New Conversation",
        advisorId: advisors[0]?.id,
      });
      setCurrentConversation(newConversation);
      setConversations(prev => [newConversation, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      const conversation = await ConversationsAPI.getById(conversationId);
      setCurrentConversation(conversation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await ConversationsAPI.delete(conversationId);

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If the deleted conversation was the current one, clear it
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  const handleAdvisorSwitch = (advisorId: string) => {
    switchAdvisor(advisorId);
  };

  const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Extract mentions and switch advisor if needed
    const mentions = extractMentions(input, advisors);
    if (mentions.length > 0) {
      switchAdvisor(mentions[0]!);
    }
    
    handleSubmit(e);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your AI advisors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Advisor Rail */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <AdvisorRail
          advisors={advisors}
          conversations={conversations}
          activeAdvisorId={activeAdvisorId}
          currentConversationId={currentConversation?.id}
          onAdvisorSelect={handleAdvisorSwitch}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Conversation Header */}
        <ConversationHeader
          conversation={currentConversation}
          activeAdvisor={advisors.find(a => a.id === activeAdvisorId)}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            advisors={advisors}
            isLoading={isChatLoading}
          />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleMessageSubmit}
            isLoading={isChatLoading}
            advisors={advisors}
          />
        </div>
      </div>
    </div>
  );
}
