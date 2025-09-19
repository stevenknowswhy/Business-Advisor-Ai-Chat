"use client";

import React, { useState, useEffect, useCallback, useReducer } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AdvisorRail } from "./AdvisorRail";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationHeader } from "./ConversationHeader";
import { useAdvisorChat } from "~/lib/chat";
import { AdvisorsAPI, ConversationsAPI, MessagesAPI } from "~/lib/api";
import { type AdvisorFormData } from "./AdvisorModal";
import { useSidebar } from "~/contexts/SidebarContext";
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import { AccessibleLoadingSpinner } from "~/components/common/AccessibleLoadingSpinner";
import { validateAndSanitize, ValidationError } from "~/lib/validation";
import { transformMessages, getConversationTitle } from "~/lib/messageUtils";
import { isMessage, isAdvisor, isConversation } from "~/lib/typeGuards";
import type { Advisor, Conversation, Message } from "~/types/chat";

// Type adapters to convert between different type systems
const adaptAdvisor = (advisor: any): Advisor => ({
  id: advisor.id,
  firstName: advisor.name || advisor.firstName || 'Unknown',
  lastName: '', // lib/chat doesn't have lastName
  title: advisor.title,
  jsonConfiguration: JSON.stringify({
    archetype: advisor.archetype,
    bio: advisor.bio,
    specialties: advisor.specialties,
    location: advisor.location,
    adviceDelivery: advisor.adviceDelivery,
    mission: advisor.mission,
    tags: advisor.tags,
    modelHint: advisor.modelHint
  }),
  imageUrl: advisor.image,
  createdAt: advisor.createdAt instanceof Date ? advisor.createdAt : new Date(advisor.createdAt),
  isActive: true
});

const adaptConversation = (conversation: any): Conversation => ({
  id: conversation.id,
  title: conversation.title,
  advisorId: conversation.activeAdvisorId || '',
  createdAt: conversation.createdAt instanceof Date ? conversation.createdAt : new Date(conversation.createdAt),
  updatedAt: conversation.updatedAt instanceof Date ? conversation.updatedAt : new Date(conversation.updatedAt),
  messages: conversation.messages || [],
  isArchived: false,
  metadata: {}
});

// Reverse adapters for child components expecting lib/chat types
const adaptAdvisorToLibChat = (advisor: Advisor): any => ({
  id: advisor.id,
  name: `${advisor.firstName} ${advisor.lastName}`.trim(),
  title: advisor.title,
  image: advisor.imageUrl,
  oneLiner: "AI Advisor",
  archetype: "advisor",
  bio: "Professional AI advisor",
  location: {
    city: "Virtual",
    region: "Online"
  },
  adviceDelivery: {
    mode: "chat",
    formality: "professional",
    signOff: "Best regards"
  },
  mission: "To provide helpful advice",
  tags: ["advisor"],
  createdAt: advisor.createdAt instanceof Date ? advisor.createdAt : new Date(advisor.createdAt)
});

const adaptConversationToLibChat = (conversation: Conversation): any => ({
  id: conversation.id,
  title: conversation.title,
  createdAt: conversation.createdAt instanceof Date ? conversation.createdAt : new Date(conversation.createdAt),
  updatedAt: conversation.updatedAt instanceof Date ? conversation.updatedAt : new Date(conversation.updatedAt),
  activeAdvisorId: conversation.advisorId,
  messages: conversation.messages || [],
  messageCount: conversation.messages?.length || 0
});

// Chat state reducer for better state management
interface ChatState {
  advisors: Advisor[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  advisorSwitched: boolean;
}

type ChatAction =
  | { type: 'SET_ADVISORS'; payload: Advisor[] }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ADVISOR_SWITCHED'; payload: boolean };

const initialState: ChatState = {
  advisors: [],
  conversations: [],
  currentConversation: null,
  loading: true,
  error: null,
  advisorSwitched: false
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_ADVISORS':
      return { ...state, advisors: action.payload };
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ADVISOR_SWITCHED':
      return { ...state, advisorSwitched: action.payload };
    default:
      return state;
  }
}

interface ChatInterfaceProps {
  // Add props for better composition
  className?: string;
  initialData?: {
    advisors?: Advisor[];
    conversations?: Conversation[];
  };
}

const ChatInterface = React.memo<ChatInterfaceProps>(({ className = '', initialData }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    advisors: initialData?.advisors || [],
    conversations: initialData?.conversations || [],
  });

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
  } = useAdvisorChat(state.currentConversation?.id);

  // Memoized transformed messages
  const transformedMessages = useCallback(() => {
    return transformMessages(messages);
  }, [messages]);

  // Load initial data with error handling
  useEffect(() => {
    async function loadData() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const [advisorsData, conversationsData] = await Promise.all([
          AdvisorsAPI.getAll(),
          ConversationsAPI.getAll(),
        ]);

        // Validate and adapt incoming data
        const validAdvisors = advisorsData.map(adaptAdvisor).filter(isAdvisor);
        const validConversations = conversationsData.map(adaptConversation).filter(isConversation);

        dispatch({ type: 'SET_ADVISORS', payload: validAdvisors });
        dispatch({ type: 'SET_CONVERSATIONS', payload: validConversations });

        // If no conversations exist, create a new one
        if (validConversations.length === 0 && validAdvisors.length > 0) {
          const newConversation = await ConversationsAPI.create({
            title: "New Conversation",
            advisorId: validAdvisors[0]?.id,
          });
          if (isConversation(newConversation)) {
            const adaptedConversation = adaptConversation(newConversation);
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: adaptedConversation });
            dispatch({ type: 'SET_CONVERSATIONS', payload: [adaptedConversation] });
            setMessages([]);
          }
        } else if (validConversations.length > 0) {
          // Load the most recent conversation fully (with messages)
          const latestConversation = await ConversationsAPI.getById(validConversations[0]!.id);
          if (isConversation(latestConversation)) {
            const adaptedConversation = adaptConversation(latestConversation);
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: adaptedConversation });
            const loaded = transformMessages(latestConversation.messages || []);
            setMessages(loaded);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    loadData();
  }, [setMessages]);

  // Reflect dynamic conversation updates
  useEffect(() => {
    if (!state.currentConversation || !conversationData?.title) return;
    if (conversationData.title !== state.currentConversation.title) {
      const updated = { ...state.currentConversation, title: conversationData.title };
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: updated });
      dispatch({ type: 'SET_CONVERSATIONS', payload: state.conversations.map(c =>
        c.id === updated.id ? { ...c, title: updated.title } : c
      )});
    }
  }, [conversationData?.title, state.currentConversation, state.conversations]);

  const handleNewConversation = useCallback(async () => {
    try {
      if (state.advisors.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No advisors available' });
        return;
      }

      const newConversation = await ConversationsAPI.create({
        title: "New Conversation",
        advisorId: state.advisors[0]?.id,
      });

      if (isConversation(newConversation)) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: newConversation });
        dispatch({ type: 'SET_CONVERSATIONS', payload: [newConversation, ...state.conversations] });
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create conversation";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.advisors, state.conversations, setMessages]);

  const handleConversationSelect = useCallback(async (conversationId: string) => {
    try {
      const conversation = await ConversationsAPI.getById(conversationId);

      if (!isConversation(conversation)) {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid conversation data' });
        return;
      }

      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });

      // Replace current message list with loaded messages
      const loaded = transformMessages(conversation.messages || []);
      setMessages(loaded);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load conversation";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [setMessages]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    console.log("handleDeleteConversation called with ID:", conversationId);

    // Prevent multiple simultaneous delete operations
    if (state.loading) {
      console.log("Delete operation already in progress, ignoring");
      return;
    }

    try {
      console.log("Starting delete conversation process...");
      dispatch({ type: 'SET_ERROR', payload: null });

      await ConversationsAPI.delete(conversationId);

      console.log("Conversation deleted successfully:", conversationId);

      // Remove from local state immediately for responsive UI
      const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
      dispatch({ type: 'SET_CONVERSATIONS', payload: updatedConversations });
      console.log("Updated conversations list:", updatedConversations.length, "conversations remaining");

      // If the deleted conversation was the current one, handle gracefully
      if (state.currentConversation?.id === conversationId) {
        console.log("Deleted conversation was current, clearing current conversation");
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
        setMessages([]);

        // Optionally, switch to another conversation if available
        if (updatedConversations.length > 0) {
          console.log("Switching to first remaining conversation");
          const nextConversation = adaptConversation(updatedConversations[0]);
          dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: nextConversation });
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
          const filteredConversations = state.conversations.filter(c => c.id !== conversationId);
          dispatch({ type: 'SET_CONVERSATIONS', payload: filteredConversations });
          if (state.currentConversation?.id === conversationId) {
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
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

      dispatch({ type: 'SET_ERROR', payload: finalErrorMessage });
      console.log("Error handled gracefully, not re-throwing");
    }
  }, [state.loading, state.conversations, state.currentConversation, setMessages]);

  const handleAdvisorSwitch = useCallback((advisorId: string) => {
    // Check if this is actually a switch (different from current advisor)
    if (advisorId !== activeAdvisorId) {
      console.log("Manual advisor switch from", activeAdvisorId, "to", advisorId);
      dispatch({ type: 'SET_ADVISOR_SWITCHED', payload: true });

      // Clear the switched indicator after 3 seconds
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_ADVISOR_SWITCHED', payload: false });
      }, 3000);

      // Cleanup timeout on unmount
      return () => clearTimeout(timer);
    }

    switchAdvisor(advisorId);
  }, [activeAdvisorId, switchAdvisor]);

  const handleMessageSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const messageContent = formData.get('message') as string;

      // Validate and sanitize input
      const validation = validateAndSanitize(messageContent, 'message');

      if (!validation.isValid) {
        dispatch({ type: 'SET_ERROR', payload: validation.error || 'Invalid message content' });
        return;
      }

      // Create a synthetic form element
      const tempForm = document.createElement('form');
      const tempInput = document.createElement('input');
      tempInput.name = 'message';
      tempInput.value = validation.sanitized || '';
      tempForm.appendChild(tempInput);

      // Create a synthetic event with proper structure
      const sanitizedEvent = {
        ...e,
        currentTarget: tempForm,
        target: tempInput
      } as unknown as React.FormEvent<HTMLFormElement>;

      // Let the original handleSubmit process the sanitized data
      handleSubmit(sanitizedEvent);
    } catch (error) {
      console.error('Error in message submission:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
    }
  }, [handleSubmit]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      // Validate and sanitize the new content
      const validation = validateAndSanitize(newContent, 'message');

      if (!validation.isValid) {
        dispatch({ type: 'SET_ERROR', payload: validation.error || 'Invalid message content' });
        return;
      }

      const sanitizedContent = validation.sanitized || newContent;

      // Update the message via API
      const result = await MessagesAPI.update(messageId, { content: sanitizedContent });
      console.log("Message updated successfully:", result);

      // Update local messages state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: sanitizedContent, isEdited: true }
            : msg
        )
      );

      // Regenerate AI response by resubmitting the edited message
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        // Remove all messages after the edited one
        const messagesUpToEdit = messages.slice(0, messageIndex + 1);
        const updatedMessages = messagesUpToEdit.map(msg =>
          msg.id === messageId
            ? { ...msg, content: sanitizedContent, isEdited: true }
            : msg
        );
        setMessages(updatedMessages);

        // Trigger a new AI response with the edited message
        const editedMessage = { ...messages[messageIndex], content: sanitizedContent };
        if (editedMessage) {
          // Simulate form submission with the sanitized content
          handleInputChange({ target: { value: sanitizedContent } } as any);

          // Submit after a brief delay to ensure state is updated
          setTimeout(() => {
            // Create proper synthetic form event
            const tempForm = document.createElement('form');
            const tempInput = document.createElement('input');
            tempInput.name = 'message';
            tempInput.value = sanitizedContent;
            tempForm.appendChild(tempInput);

            const syntheticEvent = {
              preventDefault: () => {},
              currentTarget: tempForm,
              target: tempInput
            } as unknown as React.FormEvent<HTMLFormElement>;

            handleSubmit(syntheticEvent);
          }, 100);
        }
      }

    } catch (error) {
      console.error("Failed to edit message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to edit message";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [messages, handleInputChange, handleSubmit, setMessages]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
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
      if (state.currentConversation) {
        const updatedConversations = state.conversations.map(conv =>
          conv.id === state.currentConversation!.id
            ? { ...conv, updatedAt: new Date() }
            : conv
        );
        dispatch({ type: 'SET_CONVERSATIONS', payload: updatedConversations });
      }

    } catch (error) {
      console.error("Failed to delete message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete message";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentConversation, state.conversations, setMessages]);

  const handleCreateAdvisor = useCallback(async (advisorData: AdvisorFormData) => {
    try {
      console.log("Creating advisor:", advisorData);

      // Use the uploaded image URL directly (already uploaded via ImageUpload component)
      const imageUrl = advisorData.imageUrl;

      const newAdvisor = await AdvisorsAPI.create({
        firstName: advisorData.firstName,
        lastName: advisorData.lastName,
        title: advisorData.title,
        jsonConfiguration: advisorData.jsonConfiguration,
        imageUrl,
      });

      // Validate and update local advisors list
      if (isAdvisor(newAdvisor)) {
        const adaptedAdvisor = adaptAdvisor(newAdvisor);
        dispatch({ type: 'SET_ADVISORS', payload: [adaptedAdvisor, ...state.advisors] });
      }

      console.log("Advisor created successfully:", newAdvisor);
    } catch (error) {
      console.error("Failed to create advisor:", error);
      throw error; // Let the modal handle the error
    }
  }, [state.advisors]);

  const handleUpdateAdvisor = useCallback(async (advisorId: string, advisorData: AdvisorFormData) => {
    try {
      console.log("Updating advisor:", advisorId, advisorData);

      // Use the uploaded image URL directly (already uploaded via ImageUpload component)
      const imageUrl = advisorData.imageUrl;

      const updatedAdvisor = await AdvisorsAPI.update(advisorId, {
        firstName: advisorData.firstName,
        lastName: advisorData.lastName,
        title: advisorData.title,
        jsonConfiguration: advisorData.jsonConfiguration,
        imageUrl,
      });

      // Validate and update local advisors list
      if (isAdvisor(updatedAdvisor)) {
        dispatch({ type: 'SET_ADVISORS', payload: state.advisors.map(advisor =>
          advisor.id === advisorId ? updatedAdvisor : advisor
        ) });
      }

      console.log("Advisor updated successfully:", updatedAdvisor);
    } catch (error) {
      console.error("Failed to update advisor:", error);
      throw error; // Let the modal handle the error
    }
  }, [state.advisors]);

  if (state.loading) {
    return (
      <AccessibleLoadingSpinner
        message="Loading your advisors..."
        size="large"
        region="chat interface"
      />
    );
  }

  if (state.error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50" role="alert">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{state.error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Retry loading"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <AccessibleLoadingSpinner
        message="Loading..."
        size="large"
        region="authentication"
      />
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!isSignedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50" role="main">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Advisor Chat</h1>
            <p className="text-gray-600">Your personal board of AI advisors</p>
          </div>

          <div className="mb-6" role="alert">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">Authentication Required</p>
              <p className="text-blue-700 text-sm mt-1">
                Please sign in to access the chat functionality and start conversations with your AI advisors.
              </p>
            </div>
          </div>

          <div className="space-y-3" role="group" aria-label="Authentication options">
            <Link
              href="/sign-in"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-block"
              aria-label="Sign in to your account"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors inline-block"
              aria-label="Create a new account"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href="/test-auth"
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
              aria-label="Test authentication status"
            >
              Test Authentication Status
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`h-screen flex bg-white relative ${className}`} role="main" aria-label="AI Advisor Chat Interface">
        {/* Mobile Overlay - Memoized to prevent re-renders */}
        <MemoizedMobileOverlay
          isVisible={isMobileOpen}
          onClose={closeMobileSidebar}
        />

        {/* Advisor Rail */}
        <div
          className={`
            border-r border-gray-200 flex flex-col bg-white z-50 transition-all duration-300 ease-in-out
            ${
              // Mobile: overlay sidebar (hidden by default, shown when isMobileOpen)
              "md:relative md:translate-x-0"
            }
            ${
              // Mobile overlay positioning
              isMobileOpen
                ? "fixed inset-y-0 left-0 w-80 transform translate-x-0"
                : "fixed inset-y-0 left-0 w-80 transform -translate-x-full md:translate-x-0"
            }
            ${
              // Desktop/Tablet width based on collapsed state
              isCollapsed ? "md:w-16" : "md:w-80"
            }
          `}
          role="complementary"
          aria-label="Advisors and conversations"
        >
          <AdvisorRail
            advisors={state.advisors.map(adaptAdvisorToLibChat)}
            conversations={state.conversations.map(adaptConversationToLibChat)}
            activeAdvisorId={activeAdvisorId}
            currentConversationId={state.currentConversation?.id}
            onAdvisorSelect={handleAdvisorSwitch}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onCreateAdvisor={handleCreateAdvisor}
            onUpdateAdvisor={handleUpdateAdvisor}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0" role="main">
          {/* Conversation Header */}
          <ConversationHeader
            conversation={state.currentConversation ? adaptConversationToLibChat({
              ...state.currentConversation,
              title: conversationData?.title || state.currentConversation.title
            }) : null}
            activeAdvisor={state.advisors.find(a => a.id === activeAdvisorId) ? adaptAdvisorToLibChat(state.advisors.find(a => a.id === activeAdvisorId)!) : null}
            advisorSwitched={state.advisorSwitched}
            onTitleUpdate={(conversationId, newTitle) => {
              // Update local state
              if (state.currentConversation && state.currentConversation.id === conversationId) {
                dispatch({
                  type: 'SET_CURRENT_CONVERSATION',
                  payload: { ...state.currentConversation, title: newTitle }
                });
              }
              dispatch({
                type: 'SET_CONVERSATIONS',
                payload: state.conversations.map(c =>
                  c.id === conversationId ? { ...c, title: newTitle } : c
                )
              });
            }}
          />

          {/* Messages */}
          <div className="flex-1 overflow-hidden" role="log" aria-live="polite" aria-label="Conversation messages">
            <MessageList
              messages={transformedMessages()}
              advisors={state.advisors.map(adaptAdvisorToLibChat)}
              isLoading={isChatLoading}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
            />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4" role="form" aria-label="Message input">
            <MessageInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleMessageSubmit}
              isLoading={isChatLoading}
              advisors={state.advisors.map(adaptAdvisorToLibChat)}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

ChatInterface.displayName = 'ChatInterface';

// Memoized mobile overlay component
const MemoizedMobileOverlay = React.memo<{
  isVisible: boolean;
  onClose: () => void;
}>(({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Close sidebar"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    />
  );
});

MemoizedMobileOverlay.displayName = 'MemoizedMobileOverlay';

export default ChatInterface;
