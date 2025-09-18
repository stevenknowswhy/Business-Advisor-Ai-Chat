"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AdvisorRail } from "./AdvisorRail";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationHeader } from "./ConversationHeader";
import { useAdvisorChat, type Advisor, type Conversation } from "~/lib/chat";
import { AdvisorsAPI, ConversationsAPI, MessagesAPI } from "~/lib/api";
import { type AdvisorFormData } from "./AdvisorModal";

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
    conversationData,
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
          setMessages([]);
        } else {
          // Load the most recent conversation fully (with messages)
          const latestConversation = await ConversationsAPI.getById(conversationsData[0]!.id);
          setCurrentConversation(latestConversation);
          const loaded = (latestConversation.messages || []).map((m: any) => ({
            id: m.id,
            role: m.sender === 'user' ? 'user' : m.sender === 'advisor' ? 'assistant' : 'system',
            content: m.content,
            advisor: (m as any).advisor?.id,
            createdAt: m.createdAt,
          }));
          setMessages(loaded);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Reflect dynamic conversation updates (e.g., new titles) into sidebar and header
  useEffect(() => {
    if (!currentConversation || !conversationData?.title) return;
    if (conversationData.title !== currentConversation.title) {
      const updated = { ...currentConversation, title: conversationData.title } as any;
      setCurrentConversation(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, title: updated.title } : c));
    }
  }, [conversationData?.title, currentConversation]);

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
      // Replace current message list with loaded messages
      const loaded = (conversation.messages || []).map((m: any) => ({
        id: m.id,
        role: m.sender === 'user' ? 'user' : m.sender === 'advisor' ? 'assistant' : 'system',
        content: m.content,
        advisor: (m as any).advisor?.id,
        createdAt: m.createdAt,
      }));
      setMessages(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    console.log("handleDeleteConversation called with ID:", conversationId);

    // Prevent multiple simultaneous delete operations
    if (loading) {
      console.log("Delete operation already in progress, ignoring");
      return;
    }

    try {
      console.log("Starting delete conversation process...");
      setError(null); // Clear any previous errors

      // Show loading state to prevent user from clicking multiple times
      // Note: We don't have a specific delete loading state, but we can use the general loading

      await ConversationsAPI.delete(conversationId);

      console.log("Conversation deleted successfully:", conversationId);

      // Remove from local state immediately for responsive UI
      setConversations(prev => {
        const updated = prev.filter(c => c.id !== conversationId);
        console.log("Updated conversations list:", updated.length, "conversations remaining");
        return updated;
      });

      // If the deleted conversation was the current one, handle gracefully
      if (currentConversation?.id === conversationId) {
        console.log("Deleted conversation was current, clearing current conversation");
        setCurrentConversation(null);
        setMessages([]);

        // Optionally, switch to another conversation if available
        const remainingConversations = conversations.filter(c => c.id !== conversationId);
        if (remainingConversations.length > 0) {
          console.log("Switching to first remaining conversation");
          setCurrentConversation(remainingConversations[0]!);
        }
      }

      console.log("Delete conversation process completed successfully");

    } catch (error) {
      console.error("Failed to delete conversation:", error);

      // Provide specific error messages based on the error type
      let errorMessage = "Failed to delete conversation";
      let shouldRetry = false;

      if (error instanceof Error) {
        if (error.message.includes("Unable to connect") ||
            error.message.includes("network") ||
            error.message.includes("fetch")) {
          errorMessage = "Connection error. Please check your internet connection and try again.";
          shouldRetry = true;
        } else if (error.message.includes("timed out") ||
                   error.message.includes("timeout")) {
          errorMessage = "Request timed out. The conversation may have been deleted. Please refresh the page.";
          shouldRetry = true;
        } else if (error.message.includes("sign in") ||
                   error.message.includes("authentication")) {
          errorMessage = "Please sign in again to delete conversations.";
          shouldRetry = false;
        } else if (error.message.includes("not found") ||
                   error.message.includes("already deleted")) {
          errorMessage = "Conversation not found or already deleted. Refreshing the page...";
          // If conversation not found, remove it from local state anyway
          setConversations(prev => prev.filter(c => c.id !== conversationId));
          if (currentConversation?.id === conversationId) {
            setCurrentConversation(null);
            setMessages([]);
          }
          shouldRetry = false;
        } else if (error.message.includes("permission")) {
          errorMessage = "You don't have permission to delete this conversation.";
          shouldRetry = false;
        } else if (error.message.includes("Service temporarily unavailable")) {
          errorMessage = "Service temporarily unavailable. Please try again in a moment.";
          shouldRetry = true;
        } else {
          errorMessage = error.message;
          shouldRetry = error.message.includes("Server error");
        }
      }

      // Set error message with retry information
      const finalErrorMessage = shouldRetry
        ? `${errorMessage} You can try again.`
        : errorMessage;

      setError(finalErrorMessage);

      // Don't re-throw the error to prevent app from breaking
      // The error is now handled gracefully with user feedback
      console.log("Error handled gracefully, not re-throwing");
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

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      console.log("Editing message:", messageId, "with new content:", newContent.substring(0, 50) + "...");

      // Update the message via API
      const result = await MessagesAPI.update(messageId, { content: newContent });
      console.log("Message updated successfully:", result);

      // Update local messages state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: newContent }
            : msg
        )
      );

      // Regenerate AI response by resubmitting the edited message
      // Find the message index to remove all subsequent messages
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        // Remove all messages after the edited one
        const messagesUpToEdit = messages.slice(0, messageIndex + 1);
        setMessages(messagesUpToEdit.map(msg =>
          msg.id === messageId
            ? { ...msg, content: newContent }
            : msg
        ));

        // Trigger a new AI response with the edited message
        const editedMessage = { ...messages[messageIndex], content: newContent };
        if (editedMessage) {
          // Simulate form submission with the edited message
          const formData = new FormData();
          formData.append('message', newContent);

          // Use the existing handleSubmit but with the edited content
          // We'll need to temporarily set the input to the new content
          handleInputChange({ target: { value: newContent } } as any);

          // Submit after a brief delay to ensure state is updated
          setTimeout(() => {
            const fakeEvent = {
              preventDefault: () => {},
              currentTarget: formData
            } as any;
            handleSubmit(fakeEvent);
          }, 100);
        }
      }

    } catch (error) {
      console.error("Failed to edit message:", error);
      setError(error instanceof Error ? error.message : "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      console.log("Deleting message:", messageId);

      // Delete the single message via API
      const result = await MessagesAPI.delete(messageId);
      console.log("Message deleted successfully:", result);

      // Update local messages state by removing only the deleted message
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== messageId)
      );

      // Update conversations list to reflect the change
      if (currentConversation) {
        const updatedConversations = conversations.map(conv =>
          conv.id === currentConversation.id
            ? { ...conv, updatedAt: new Date() }
            : conv
        );
        setConversations(updatedConversations);
      }

    } catch (error) {
      console.error("Failed to delete message:", error);
      setError(error instanceof Error ? error.message : "Failed to delete message");
    }
  };

  const handleCreateAdvisor = async (advisorData: AdvisorFormData) => {
    try {
      console.log("Creating advisor:", advisorData);

      // Handle image upload if present
      let imageUrl: string | undefined;
      if (advisorData.image && typeof advisorData.image !== "string") {
        // TODO: Implement image upload to storage service
        // For now, we'll skip image upload
        console.log("Image upload not yet implemented");
      } else if (typeof advisorData.image === "string") {
        imageUrl = advisorData.image;
      }

      const newAdvisor = await AdvisorsAPI.create({
        firstName: advisorData.firstName,
        lastName: advisorData.lastName,
        title: advisorData.title,
        jsonConfiguration: advisorData.jsonConfiguration,
        imageUrl,
      });

      // Update local advisors list
      setAdvisors(prev => [newAdvisor, ...prev]);

      console.log("Advisor created successfully:", newAdvisor);
    } catch (error) {
      console.error("Failed to create advisor:", error);
      throw error; // Let the modal handle the error
    }
  };

  const handleUpdateAdvisor = async (advisorId: string, advisorData: AdvisorFormData) => {
    try {
      console.log("Updating advisor:", advisorId, advisorData);

      // Handle image upload if present
      let imageUrl: string | undefined;
      if (advisorData.image && typeof advisorData.image !== "string") {
        // TODO: Implement image upload to storage service
        // For now, we'll skip image upload
        console.log("Image upload not yet implemented");
      } else if (typeof advisorData.image === "string") {
        imageUrl = advisorData.image;
      }

      const updatedAdvisor = await AdvisorsAPI.update(advisorId, {
        firstName: advisorData.firstName,
        lastName: advisorData.lastName,
        title: advisorData.title,
        jsonConfiguration: advisorData.jsonConfiguration,
        imageUrl,
      });

      // Update local advisors list
      setAdvisors(prev => prev.map(advisor =>
        advisor.id === advisorId ? updatedAdvisor : advisor
      ));

      console.log("Advisor updated successfully:", updatedAdvisor);
    } catch (error) {
      console.error("Failed to update advisor:", error);
      throw error; // Let the modal handle the error
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your advisors...</p>
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
            <Link
              href="/sign-in"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors inline-block"
            >
              Create Account
            </Link>
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
          onCreateAdvisor={handleCreateAdvisor}
          onUpdateAdvisor={handleUpdateAdvisor}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Conversation Header */}
        <ConversationHeader
          conversation={currentConversation ? { ...currentConversation, title: conversationData?.title || currentConversation.title } : null}
          activeAdvisor={advisors.find(a => a.id === activeAdvisorId)}
          advisorSwitched={advisorSwitched}
          onTitleUpdate={(conversationId, newTitle) => {
            // Update local state
            if (currentConversation && currentConversation.id === conversationId) {
              setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
            }
            setConversations(prev => prev.map(c =>
              c.id === conversationId ? { ...c, title: newTitle } : c
            ));
          }}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            advisors={advisors}
            isLoading={isChatLoading}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
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
