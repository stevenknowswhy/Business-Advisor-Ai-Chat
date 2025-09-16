"use client";

import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { getAdvisorInitials, getAdvisorColor, type Advisor } from "~/lib/chat";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  advisors: Advisor[];
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  advisors,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  // Custom submit handler that stops typing
  const handleSubmitWithTyping = (e: React.FormEvent<HTMLFormElement>) => {
    if (onTypingStop) {
      onTypingStop();
    }
    handleSubmit(e);
  };

  // Handle blur to stop typing
  const handleBlur = () => {
    if (onTypingStop) {
      onTypingStop();
    }
  };

  // Filter advisors based on mention query
  const filteredAdvisors = advisors.filter(advisor =>
    advisor.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    advisor.name.split(' ')[0]?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle input changes and detect @mentions
  const handleInputChangeWithMentions = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Trigger typing start when user starts typing
    if (value.length > 0 && onTypingStart) {
      onTypingStart();
    } else if (value.length === 0 && onTypingStop) {
      onTypingStop();
    }

    // Check for @mention at cursor position
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1] || "");
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }

    handleInputChange(e);
  };

  // Handle mention selection
  const insertMention = (advisor: Advisor) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = input.substring(0, cursorPosition);
    const textAfterCursor = input.substring(cursorPosition);
    
    // Find the @ symbol position
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const beforeMention = input.substring(0, mentionStart);
    const firstName = advisor.name.split(' ')[0];
    const newValue = beforeMention + `@${firstName} ` + textAfterCursor;
    
    // Update input value
    const syntheticEvent = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(syntheticEvent);
    
    setShowMentions(false);
    setMentionQuery("");
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = mentionStart + (firstName?.length || 0) + 2;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredAdvisors.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredAdvisors.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredAdvisors.length - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredAdvisors[selectedMentionIndex]!);
      } else if (e.key === "Escape") {
        setShowMentions(false);
        setMentionQuery("");
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="relative">
      {/* Mentions Dropdown */}
      {showMentions && filteredAdvisors.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
        >
          <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
            Select an advisor to mention
          </div>
          {filteredAdvisors.map((advisor, index) => (
            <button
              type="button"
              key={advisor.id}
              onClick={() => insertMention(advisor)}
              className={`w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                index === selectedMentionIndex ? "bg-blue-50" : ""
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAdvisorColor(advisor.id)}`}>
                {getAdvisorInitials(advisor.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {advisor.name}
                </p>
                <p className="text-xs text-gray-600">
                  {advisor.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmitWithTyping} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            id="chat-message-input"
            name="message"
            ref={textareaRef}
            value={input}
            onChange={handleInputChangeWithMentions}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Type your message... Use @advisor to mention specific advisors"
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] max-h-32"
            rows={1}
            autoComplete="off"
            aria-label="Chat message input"
          />
          
          {/* Character count */}
          <div className="absolute top-1 right-2 text-xs text-gray-500">
            {input.length}/4000
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </form>

      {/* Helpful hints */}
      <div className="mt-2 text-xs text-gray-500">
        <span className="font-medium">Tips:</span> Use @advisor to mention specific advisors, or just type naturally to chat with the active advisor.
      </div>
    </div>
  );
}
