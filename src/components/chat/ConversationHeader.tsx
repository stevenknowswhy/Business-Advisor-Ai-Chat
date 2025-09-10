"use client";

import { useState } from "react";
import { PencilIcon, InformationCircleIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getAdvisorInitials, getAdvisorColor, type Advisor, type Conversation } from "~/lib/chat";
import { AuthHeader } from "~/components/auth/AuthHeader";
import { ConversationsAPI } from "~/lib/api";

interface ConversationHeaderProps {
  conversation: Conversation | null;
  activeAdvisor?: Advisor;
  advisorSwitched?: boolean; // New prop to indicate recent advisor switch
  onTitleUpdate?: (conversationId: string, newTitle: string) => void;
}

export function ConversationHeader({ conversation, activeAdvisor, advisorSwitched, onTitleUpdate }: ConversationHeaderProps) {
  const [showAdvisorInfo, setShowAdvisorInfo] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const handleStartEditTitle = () => {
    setEditTitle(conversation?.title || "");
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!conversation || !editTitle.trim()) return;

    setIsSavingTitle(true);
    try {
      await ConversationsAPI.update(conversation.id, { title: editTitle.trim() });
      onTitleUpdate?.(conversation.id, editTitle.trim());
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to update title:", error);
      // Could add toast notification here
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditTitle("");
  };

  if (!conversation) {
    return (
      <div className="h-16 border-b border-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left side - Conversation info */}
        <div className="flex items-center space-x-4">
          {activeAdvisor && (
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAdvisorColor(activeAdvisor.id)} ${advisorSwitched ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                {getAdvisorInitials(activeAdvisor.name)}
              </div>
              {advisorSwitched && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          )}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEditTitle();
                  }}
                  autoFocus
                  disabled={isSavingTitle}
                  aria-label="Edit conversation title"
                  title="Edit the conversation title"
                  placeholder="Enter conversation title"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle || !editTitle.trim()}
                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save title"
                  aria-label="Save conversation title"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditTitle}
                  disabled={isSavingTitle}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel editing"
                  aria-label="Cancel editing conversation title"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">
                {conversation.title}
              </h2>
            )}
            {activeAdvisor && (
              <p className="text-sm text-gray-600">
                Currently chatting with <span className="font-medium">{activeAdvisor.name}</span>
                {advisorSwitched && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Switched
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAdvisorInfo(!showAdvisorInfo)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Advisor information"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleStartEditTitle}
            disabled={isEditingTitle}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit conversation title"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <AuthHeader />
        </div>
      </div>

      {/* Advisor Info Panel */}
      {showAdvisorInfo && activeAdvisor && (
        <div className="border-t border-gray-100 bg-blue-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              {activeAdvisor.image ? (
                <img
                  src={activeAdvisor.image}
                  alt={activeAdvisor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAdvisorColor(activeAdvisor.id)}`}>
                  {getAdvisorInitials(activeAdvisor.name)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeAdvisor.name}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {activeAdvisor.title}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {activeAdvisor.oneLiner}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Background</p>
                    <p className="text-gray-700 line-clamp-3">
                      {activeAdvisor.bio}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {activeAdvisor.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  <p>
                    <span className="font-medium">Location:</span> {activeAdvisor.location.city}, {activeAdvisor.location.region}
                  </p>
                  <p>
                    <span className="font-medium">Communication Style:</span> {activeAdvisor.adviceDelivery.mode} • {activeAdvisor.adviceDelivery.formality}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
