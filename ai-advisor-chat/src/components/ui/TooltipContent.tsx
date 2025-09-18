"use client";

import { formatMessageTime, type Advisor, type Conversation } from "~/lib/chat";

interface AdvisorTooltipContentProps {
  advisor: Advisor;
}

export function AdvisorTooltipContent({ advisor }: AdvisorTooltipContentProps) {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-white">{advisor.name}</div>
      <div className="text-gray-300 text-xs">{advisor.title}</div>
      <div className="text-gray-200 text-xs leading-relaxed">
        {advisor.oneLiner}
      </div>
    </div>
  );
}

interface ConversationTooltipContentProps {
  conversation: Conversation;
  advisors: Advisor[];
}

export function ConversationTooltipContent({
  conversation,
  advisors
}: ConversationTooltipContentProps) {
  // Use the activeAdvisor from conversation if available, otherwise find by ID
  const activeAdvisor = conversation.activeAdvisor ||
    (conversation.activeAdvisorId ? advisors.find(a => a.id === conversation.activeAdvisorId) : null);

  return (
    <div className="space-y-1">
      <div className="font-semibold text-white line-clamp-2">
        {conversation.title}
      </div>

      {conversation.updatedAt && (
        <div className="text-gray-300 text-xs">
          Last updated: {formatMessageTime(conversation.updatedAt)}
        </div>
      )}

      {activeAdvisor && (
        <div className="text-gray-200 text-xs">
          Active advisor: {activeAdvisor.name}
        </div>
      )}

      {conversation.lastMessage && (
        <div className="text-gray-300 text-xs">
          Last message: {formatMessageTime(conversation.lastMessage.createdAt)}
        </div>
      )}
    </div>
  );
}
