"use client";

import { useEffect, useRef } from "react";
import { useUser, type User } from "@clerk/nextjs";
// Use the correct type from useChat hook
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};
import { getAdvisorInitials, getAdvisorColor, formatMessageTime, type Advisor } from "~/lib/chat";
import { TypingIndicator } from "./TypingIndicator";
import { FeedbackControls, type FeedbackPayload } from "./Feedback";
import { MessageActions } from "./MessageActions";

interface MessageListProps {
  messages: any[];
  advisors: Advisor[];
  isLoading: boolean;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

export function MessageList({ messages, advisors, isLoading, onEditMessage, onDeleteMessage }: MessageListProps) {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.524A11.956 11.956 0 0012 20.25c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8c0 1.508.418 2.92 1.146 4.124L4 21l5.124-1.146A8.959 8.959 0 0012 21c4.418 0 8-3.582 8-8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
          <p className="text-gray-600 mb-4">
            Ask your AI advisors anything. Use @mentions to direct questions to specific advisors.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Try: "What should I focus on for my startup?"</p>
            <p>Or: "@Alex what do you think about this idea?"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {messages.map((message, index) => {
          // Check if advisor changed from previous message
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const currentAdvisorId = (message as { advisor?: string }).advisor;
          const prevAdvisorId = prevMessage ? (prevMessage as { advisor?: string }).advisor : null;
          const advisorChanged = prevMessage &&
                                message.role === "assistant" &&
                                prevMessage.role === "assistant" &&
                                currentAdvisorId !== prevAdvisorId;

          return (
            <div key={message.id || index}>
              {/* Show advisor transition indicator */}
              {advisorChanged && (
                <AdvisorTransition
                  fromAdvisor={advisors.find(a => a.id === prevAdvisorId)}
                  toAdvisor={advisors.find(a => a.id === currentAdvisorId)}
                />
              )}

              <MessageBubble
                message={message}
                advisors={advisors}
                user={user}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                isLoading={isLoading}
              />
            </div>
          );
        })}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  advisors,
  user,
  onEditMessage,
  onDeleteMessage,
  isLoading
}: {
  message: Message;
  advisors: Advisor[];
  user: User | null | undefined; // Clerk user object with proper typing
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  isLoading?: boolean;
}) {
  const isUser = message.role === "user";
  // Fix: Find advisor by message.advisor (advisorId) instead of message.id
  const advisor = advisors.find(a => a.id === (message as any).advisor) || advisors[0];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[70%] ${isUser ? "flex-row-reverse" : "flex-row"} space-x-3`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.firstName?.charAt(0)?.toUpperCase() ||
                 user?.username?.charAt(0)?.toUpperCase() ||
                 user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
                 "U"}
              </span>
            </div>
          ) : advisor?.image ? (
            <img
              src={advisor.image}
              alt={advisor.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAdvisorColor(advisor?.id || "default")}`}>
              {getAdvisorInitials(advisor?.name || "AI")}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          {/* Sender Name and Time */}
          <div className={`flex items-center space-x-2 mb-1 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
            <span className={isUser ? "text-sm font-medium text-white" : "text-sm font-medium text-gray-900"}>
              {isUser ? (
                user?.firstName ||
                user?.username ||
                user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                "You"
              ) : (
                advisor?.name || "AI Advisor"
              )}
            </span>
            <span className={isUser ? "text-xs text-blue-100" : "text-xs text-gray-500"}>
              {formatMessageTime(new Date())}
            </span>
          </div>

          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-900"
            }`}
          >
            {/* Ensure readable text on dark (user) bubble by inverting prose colors */}
            <MessageContent content={message.content} isUser={isUser} />
            {/* Feedback controls for AI responses only */}
            {!isUser && (
              <FeedbackControls
                messageId={(message as any).id}
                onSubmit={async (payload: FeedbackPayload) => {
                  // TODO: replace with API call or analytics event
                  console.debug("feedback", payload);
                }}
              />
            )}
          </div>

          {/* Message Actions for user messages - positioned below the bubble */}
          {isUser && onEditMessage && onDeleteMessage && (
            <MessageActions
              messageId={(message as any).id}
              content={message.content}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              isLoading={isLoading}
            />
          )}

          {/* Advisor Info (for non-user messages) */}
          {!isUser && advisor && (
            <div className="mt-1 text-xs text-gray-500">
              {advisor.title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isUser = false }: { content: string; isUser?: boolean }) {
  // Handle @mentions highlighting
  const highlightMentions = (text: string) => {
    const mentionColor = isUser ? 'text-blue-200' : 'text-blue-600';
    return text.replace(/@(\w+(?:\s+\w+)*)/g, `<span class="font-semibold ${mentionColor}">@$1</span>`);
  };

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    let formatted = text;

    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

    // Highlight mentions
    formatted = highlightMentions(formatted);

    return formatted;
  };

  return (
    <div
      className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}
      dangerouslySetInnerHTML={{
        __html: formatContent(content).replace(/\n/g, '<br />'),
      }}
    />
  );
}

function AdvisorTransition({ fromAdvisor, toAdvisor }: {
  fromAdvisor?: Advisor;
  toAdvisor?: Advisor;
}) {
  if (!fromAdvisor || !toAdvisor) return null;

  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm">
        <div className="flex items-center space-x-2">
          {/* From advisor */}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAdvisorColor(fromAdvisor.id)}`}>
            {getAdvisorInitials(fromAdvisor.name)}
          </div>
          <span className="text-gray-600">{fromAdvisor.name}</span>
        </div>

        {/* Arrow */}
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        <div className="flex items-center space-x-2">
          {/* To advisor */}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAdvisorColor(toAdvisor.id)}`}>
            {getAdvisorInitials(toAdvisor.name)}
          </div>
          <span className="text-gray-900 font-medium">{toAdvisor.name}</span>
        </div>
      </div>
    </div>
  );
}
