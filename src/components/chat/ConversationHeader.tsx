"use client";

import { useState } from "react";
import { PencilIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { getAdvisorInitials, getAdvisorColor, type Advisor, type Conversation } from "~/lib/chat";
import { AuthHeader } from "~/components/auth/AuthHeader";

interface ConversationHeaderProps {
  conversation: Conversation | null;
  activeAdvisor?: Advisor;
}

export function ConversationHeader({ conversation, activeAdvisor }: ConversationHeaderProps) {
  const [showAdvisorInfo, setShowAdvisorInfo] = useState(false);

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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAdvisorColor(activeAdvisor.id)}`}>
              {getAdvisorInitials(activeAdvisor.name)}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {conversation.title}
            </h2>
            {activeAdvisor && (
              <p className="text-sm text-gray-600">
                Currently chatting with <span className="font-medium">{activeAdvisor.name}</span>
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
