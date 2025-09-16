"use client";

import { useEffect, useState } from "react";

interface TypingUser {
  _id: string;
  name: string | null | undefined;
  image: string | null | undefined;
  lastTypingAt: number;
}

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
  isAIThinking?: boolean;
  className?: string;
}

export function TypingIndicator({ typingUsers = [], isAIThinking = false, className = "" }: TypingIndicatorProps) {
  const [dots, setDots] = useState(".");

  // Animate the dots
  useEffect(() => {
    if (typingUsers.length === 0 && !isAIThinking) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ".";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length, isAIThinking]);

  // Show AI thinking indicator
  if (isAIThinking) {
    return (
      <div className={`flex justify-start ${className}`}>
        <div className="flex max-w-[70%] space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">AI</span>
            </div>
          </div>

          {/* Typing Animation */}
          <div className="flex flex-col items-start">
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Advisor is thinking{dots}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show user typing indicators
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const user = typingUsers[0];
      const name = user?.name || "Someone";
      return `${name} is typing${dots}`;
    } else if (typingUsers.length === 2) {
      const names = typingUsers.map(u => u?.name || "Someone").join(" and ");
      return `${names} are typing${dots}`;
    } else {
      const firstName = typingUsers[0]?.name || "Someone";
      const others = typingUsers.length - 1;
      return `${firstName} and ${others} other${others > 1 ? 's' : ''} are typing${dots}`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-500 px-4 py-2 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
