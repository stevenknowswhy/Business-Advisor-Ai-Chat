"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { AdvisorRail } from "./AdvisorRail";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationHeader } from "./ConversationHeader";
import { useAdvisorChat, type Advisor, type Conversation } from "~/lib/chat";
import { AdvisorsAPI, ConversationsAPI } from "~/lib/api";

export function ChatInterface() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advisorSwitched, setAdvisorSwitched] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    activeAdvisorId,
    switchAdvisor,
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
      console.log("Attempting to delete conversation:", conversationId);

      await ConversationsAPI.delete(conversationId);

      console.log("Conversation deleted successfully:", conversationId);

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If the deleted conversation was the current one, clear it
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      // Clear any previous errors
      setError(null);

    } catch (error) {
      console.error("Failed to delete conversation:", error);

      // Provide specific error messages based on the error type
      let errorMessage = "Failed to delete conversation";

      if (error instanceof Error) {
        if (error.message.includes("Unable to connect")) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else if (error.message.includes("sign in")) {
          errorMessage = "Please sign in to delete conversations.";
        } else if (error.message.includes("not found")) {
          errorMessage = "Conversation not found or already deleted.";
        } else if (error.message.includes("permission")) {
          errorMessage = "You don't have permission to delete this conversation.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      throw error; // Re-throw so the UI can handle it
    }
  };

  const handleAdvisorSwitch = (advisorId: string) => {
    // Check if this is actually a switch (different from current advisor)
    if (advisorId !== activeAdvisorId) {
      console.log("Manual advisor switch from", activeAdvisorId, "to", advisorId);
      setAdvisorSwitched(true);

      // Clear the switched indicator after 3 seconds
      setTimeout(() => {
        setAdvisorSwitched(false);
      }, 3000);
    }

    switchAdvisor(advisorId);
  };

  const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Mention extraction and advisor switching is now handled server-side
    // The chat API will automatically process mentions and switch advisors as needed
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

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!isSignedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Advisor Chat</h1>
            <p className="text-gray-600">Your personal board of AI advisors</p>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">Authentication Required</p>
              <p className="text-blue-700 text-sm mt-1">
                Please sign in to access the chat functionality and start conversations with your AI advisors.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="/sign-in"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors inline-block"
            >
              Create Account
            </a>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href="/test-auth"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Test Authentication Status
            </a>
          </div>
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
          advisorSwitched={advisorSwitched}
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
