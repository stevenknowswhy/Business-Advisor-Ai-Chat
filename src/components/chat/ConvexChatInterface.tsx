"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  useAdvisors,
  useConversations,
  useConversation,
  useCreateConversation,
  useTypingUsers,
  useSetTypingStatus,
  useUpdateUserPresence,
  transformAdvisorForClient,
  transformConversationForClient,
  useCurrentUser,
  type ConvexAdvisor
} from "~/lib/convex-api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useErrorHandler } from "~/components/common/ErrorBoundary";
import { AdvisorRail } from "./AdvisorRail";
import { ConversationHeader } from "./ConversationHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useConvexChat } from "~/lib/convex-chat";

// Authenticated Chat Interface - only renders when user is authenticated
function AuthenticatedChatInterface() {
  // All hooks called consistently - no conditional hook calls
  const { user } = useUser(); // We know user is authenticated at this point
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | undefined>();
  const [activeAdvisorId, setActiveAdvisorId] = useState<Id<"advisors"> | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Error handling
  const { error: asyncError, handleError, clearError } = useErrorHandler();

  // Convex queries - all enabled since we're authenticated
  const advisorsData = useAdvisors(); // Public query, always safe to call
  const conversationsData = useConversations(true); // Always enabled since we're authenticated
  const currentConversationData = useConversation(currentConversationId, true); // Always enabled since we're authenticated

  // Real-time queries
  const typingUsers = useTypingUsers(currentConversationId, true); // Always enabled since we're authenticated

  // Convex mutations
  const createConversation = useCreateConversation();
  const setTypingStatus = useSetTypingStatus();
  const updateUserPresence = useUpdateUserPresence();

  // Chat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    error: chatError,
  } = useConvexChat({
    conversationId: currentConversationId,
    activeAdvisorId,
    isAuthenticated: true
  });

  // Transform data for compatibility with existing components
  const advisors = (advisorsData || []).map(transformAdvisorForClient);
  const conversations = (conversationsData || []).map((conv: any) => transformConversationForClient(conv));
  const currentConversation = currentConversationData ? transformConversationForClient(currentConversationData as any) : null;

  // Handlers
  const handleAdvisorSelect = (advisorId: string) => {
    setActiveAdvisorId(advisorId as unknown as Id<"advisors">);
  };
  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversationId(conversationId as unknown as Id<"conversations">);
  };
  const handleNewConversation = async () => {
    const active = advisors.find((a: any) => a.id === (activeAdvisorId as unknown as string));
    const defaultTitle = active?.name || "New Conversation";
    const newId = await createConversation({
      title: defaultTitle,
      activeAdvisorId,
    });
    setCurrentConversationId(newId);
  };
  const handleTypingStart = async () => {
    if (currentConversationId) await setTypingStatus({ conversationId: currentConversationId, isTyping: true });
  };
  const handleTypingStop = async () => {
    if (currentConversationId) await setTypingStatus({ conversationId: currentConversationId, isTyping: false });
  };

  const activeAdvisor = advisors.find((a: any) => a.id === (activeAdvisorId as unknown as string));

  return (
    <div className="h-screen flex bg-white">
      {/* Left rail */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <AdvisorRail
          advisors={advisors as any}
          conversations={conversations as any}
          activeAdvisorId={activeAdvisorId as unknown as string}
          currentConversationId={currentConversation?.id as unknown as string}
          onAdvisorSelect={handleAdvisorSelect}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <ConversationHeader
          conversation={currentConversation as any}
          activeAdvisor={activeAdvisor as any}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages as any}
            advisors={advisors as any}
            isLoading={isChatLoading}
            typingUsers={typingUsers as any}
          />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isChatLoading}
            advisors={advisors as any}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
          />
        </div>
      </div>

    </div>
  );
}

// Main wrapper component that handles authentication logic
export function ConvexChatInterface() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [hasBeenAuthenticated, setHasBeenAuthenticated] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  // Public query: returns user object when Convex recognizes identity
  const currentUser = useCurrentUser();

  // Debug logs to trace auth timing in development
  if (process.env.NODE_ENV !== "production") {
    console.debug("[ConvexChatInterface] state", { isLoaded, isSignedIn, tokenReady, hasBeenAuthenticated, currentUser: !!currentUser });
  }

  // Ensure Convex token is ready before considering UI mount
  useEffect(() => {
    let cancelled = false;
    async function checkToken() {
      if (isLoaded && isSignedIn) {
        try {
          const token = await getToken({ template: "convex" });
          if (!cancelled) {
            const ready = Boolean(token);
            setTokenReady(ready);
          }
        } catch {
          if (!cancelled) setTokenReady(false);
        }
      } else {
        setTokenReady(false);
      }
    }
    checkToken();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  // Flip to authenticated exactly once when backend recognizes identity AND token is ready
  useEffect(() => {
    if (isLoaded && isSignedIn && tokenReady && currentUser && !hasBeenAuthenticated) {
      setHasBeenAuthenticated(true);
    }
  }, [isLoaded, isSignedIn, tokenReady, currentUser, hasBeenAuthenticated]);

  // Once authenticated and synced with backend, render the authenticated component
  if (hasBeenAuthenticated) {
    return <AuthenticatedChatInterface />;
  }

  // Show loading state until Clerk is ready, token is ready, and backend recognizes user
  if (!isLoaded || (isSignedIn && (!tokenReady || !currentUser))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isSignedIn ? "Finalizing secure session..." : "Loading authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to AI Advisor Chat</h1>
          <p className="text-gray-600 mb-6">
            Sign in to start chatting with your personal board of AI advisors.
          </p>
          <a
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Fallback (should rarely hit)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Preparing your chat...</p>
      </div>
    </div>
  );
}
