"use client";

import { useEffect, useRef } from "react";
// Use the correct type from useChat hook
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};
import { getAdvisorInitials, getAdvisorColor, formatMessageTime, type Advisor } from "~/lib/chat";
import { TypingIndicator } from "./TypingIndicator";

interface MessageListProps {
  messages: any[];
  advisors: Advisor[];
  isLoading: boolean;
}

export function MessageList({ messages, advisors, isLoading }: MessageListProps) {
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
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            message={message}
            advisors={advisors}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message, advisors }: { message: Message; advisors: Advisor[] }) {
  const isUser = message.role === "user";
  const advisor = advisors.find(a => a.id === message.id) || advisors[0];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[70%] ${isUser ? "flex-row-reverse" : "flex-row"} space-x-3`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">You</span>
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
            <span className="text-sm font-medium text-gray-900">
              {isUser ? "You" : advisor?.name || "AI Advisor"}
            </span>
            <span className="text-xs text-gray-500">
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
            <MessageContent content={message.content} />
          </div>

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

function MessageContent({ content }: { content: string }) {
  // Handle @mentions highlighting
  const highlightMentions = (text: string) => {
    return text.replace(/@(\w+(?:\s+\w+)*)/g, '<span class="font-semibold text-blue-600">@$1</span>');
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
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{
        __html: formatContent(content).replace(/\n/g, '<br />'),
      }}
    />
  );
}
