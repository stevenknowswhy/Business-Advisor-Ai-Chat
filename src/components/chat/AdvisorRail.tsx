"use client";

import { useState, useRef } from "react";
import { PlusIcon, ChatBubbleLeftIcon, UserGroupIcon, InformationCircleIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { getAdvisorInitials, getAdvisorColor, formatMessageTime, type Advisor, type Conversation } from "~/lib/chat";
import { AdvisorProfileModal } from "./AdvisorProfileModal";
import { DeleteConversationDialog } from "./DeleteConversationDialog";
import { AdvisorModal, type AdvisorFormData } from "./AdvisorModal";
import { useUploadAdvisorJSON } from "~/lib/convex-api";

interface AdvisorRailProps {
  advisors: Advisor[];
  conversations: Conversation[];
  activeAdvisorId?: string;
  currentConversationId?: string;
  onAdvisorSelect: (advisorId: string) => void;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onCreateAdvisor?: (advisorData: AdvisorFormData) => Promise<void>;
  onUpdateAdvisor?: (advisorId: string, advisorData: AdvisorFormData) => Promise<void>;
}

export function AdvisorRail({
  advisors,
  conversations,
  activeAdvisorId,
  currentConversationId,
  onAdvisorSelect,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onCreateAdvisor,
  onUpdateAdvisor,
}: AdvisorRailProps) {
  const [activeTab, setActiveTab] = useState<"advisors" | "conversations">("advisors");
  const [selectedAdvisorForProfile, setSelectedAdvisorForProfile] = useState<Advisor | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Advisor modal state
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [advisorToEdit, setAdvisorToEdit] = useState<Advisor | null>(null);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  const handleShowProfile = (advisor: Advisor) => {
    setSelectedAdvisorForProfile(advisor);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
    setSelectedAdvisorForProfile(null);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete || !onDeleteConversation) return;

    setIsDeleting(true);
    try {
      onDeleteConversation(conversationToDelete.id);
      setIsDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      // You could add a toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleCreateAdvisor = () => {
    setAdvisorToEdit(null);
    setIsAdvisorModalOpen(true);
  };

  const handleEditAdvisor = (advisor: Advisor) => {
    setAdvisorToEdit(advisor);
    setIsAdvisorModalOpen(true);
  };

  const handleSaveAdvisor = async (advisorData: AdvisorFormData) => {
    setIsAdvisorLoading(true);
    try {
      if (advisorToEdit) {
        // Editing existing advisor
        await onUpdateAdvisor?.(advisorToEdit.id, advisorData);
      } else {
        // Creating new advisor
        await onCreateAdvisor?.(advisorData);
      }
      setIsAdvisorModalOpen(false);
      setAdvisorToEdit(null);
    } catch (error) {
      console.error("Failed to save advisor:", error);
      throw error; // Let the modal handle the error
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const handleCloseAdvisorModal = () => {
    setIsAdvisorModalOpen(false);
    setAdvisorToEdit(null);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">AI Advisor Chat</h1>
          <p className="text-sm text-gray-600">Your personal board of advisors</p>
        </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("advisors")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "advisors"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <UserGroupIcon className="w-4 h-4 inline mr-2" />
          Advisors
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("conversations")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "conversations"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChatBubbleLeftIcon className="w-4 h-4 inline mr-2" />
          Chats
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "advisors" ? (
          <AdvisorsList
            advisors={advisors}
            activeAdvisorId={activeAdvisorId}
            onAdvisorSelect={onAdvisorSelect}
            onShowProfile={handleShowProfile}
            onCreateAdvisor={handleCreateAdvisor}
            onEditAdvisor={handleEditAdvisor}
          />
        ) : (
          <ConversationsList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onConversationSelect={onConversationSelect}
            onNewConversation={onNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </div>
      </div>

      {/* Profile Modal */}
      <AdvisorProfileModal
        advisor={selectedAdvisorForProfile}
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
      />

      {/* Delete Conversation Dialog */}
      <DeleteConversationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        conversationTitle={conversationToDelete?.title}
        isDeleting={isDeleting}
      />

      {/* Advisor Modal */}
      <AdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={handleCloseAdvisorModal}
        onSave={handleSaveAdvisor}
        advisor={advisorToEdit}
        isLoading={isAdvisorLoading}
      />
    </>
  );
}

function AdvisorsList({
  advisors,
  activeAdvisorId,
  onAdvisorSelect,
  onShowProfile,
  onCreateAdvisor,
  onEditAdvisor,
}: {
  advisors: Advisor[];
  activeAdvisorId?: string;
  onAdvisorSelect: (advisorId: string) => void;
  onShowProfile: (advisor: Advisor) => void;
  onCreateAdvisor: () => void;
  onEditAdvisor: (advisor: Advisor) => void;



}) {
  const uploadAdvisorJSON = useUploadAdvisorJSON();
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsBusy(true);
      const text = await file.text();
      const res = await uploadAdvisorJSON({ jsonString: text });
      if ((res as any)?.ok) {
        window.alert("Advisor uploaded successfully.");
      } else {
        window.alert(`Upload failed: ${(res as any)?.error ?? "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      window.alert(`Upload error: ${err?.message ?? String(err)}`);
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEnrichClick = async () => {
    const json = window.prompt("Paste advisor JSON to upsert/enrich by persona.name:");
    if (!json) return;
    try {
      setIsBusy(true);
      const res = await uploadAdvisorJSON({ jsonString: json });
      if ((res as any)?.ok) {
        window.alert("Advisor enriched successfully.");
      } else {
        window.alert(`Enrich failed: ${(res as any)?.error ?? "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      window.alert(`Enrich error: ${err?.message ?? String(err)}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="p-2">
      {/* Add New Advisor Button */}
      <button
        type="button"
        onClick={onCreateAdvisor}
        className="w-full p-3 rounded-lg mb-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Add New Advisor</span>
      </button>

      {/* JSON Utilities */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload advisor JSON file"
        title="Upload advisor JSON file"
      />
      <div className="grid grid-cols-2 gap-2 mb-3" role="group" aria-label="Advisor JSON utilities">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isBusy}
          className="w-full p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-60"
          title="Upload a JSON file describing an advisor to create or update by name"
        >
          <span className="text-xs font-medium">Upload Advisor JSON</span>
        </button>
        <button
          type="button"
          onClick={handleEnrichClick}
          disabled={isBusy}
          className="w-full p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-60"
          title="Paste advisor JSON to enrich existing advisor by persona.name"
        >
          <span className="text-xs font-medium">Enrich from JSON</span>
        </button>
      </div>

      {advisors.map((advisor) => (
        <div key={advisor.id} className="relative mb-2">
          <button
            type="button"

            aria-label={`Select advisor ${advisor.name}`}
            onClick={() => onAdvisorSelect(advisor.id)}
            className={`w-full p-3 rounded-lg text-left transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
              activeAdvisorId === advisor.id
                ? "bg-blue-50 border-2 border-blue-300"
                : "bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start space-x-3">
              {advisor.image ? (
                <img
                  src={advisor.image}
                  alt={advisor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAdvisorColor(advisor.id)}`}>
                  {getAdvisorInitials(advisor.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {advisor.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {advisor.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {advisor.oneLiner}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {advisor.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditAdvisor(advisor);
              }}
              className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-green-600 transition-colors"
              title={`Edit ${advisor.name}`}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowProfile(advisor);
              }}
              className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-blue-600 transition-colors"
              title={`View ${advisor.name}'s profile`}
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationsList({
  conversations,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
}: {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversation: Conversation) => void;
}) {
  return (
    <div className="p-2">
      {/* New Conversation Button */}
      <button
        type="button"
        onClick={onNewConversation}
        className="w-full p-3 rounded-lg mb-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="text-sm font-medium">New Conversation</span>
      </button>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No conversations yet</p>
          <p className="text-xs text-gray-400">Start a new chat to begin</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div key={conversation.id} className="relative mb-2 group">
            <button
              type="button"
              onClick={() => onConversationSelect(conversation.id)}
              className={`w-full p-3 rounded-lg text-left transition-colors relative ${
                currentConversationId === conversation.id
                  ? "bg-blue-100 border-2 border-blue-300"
                  : "bg-white border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                {conversation.activeAdvisor && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAdvisorColor(conversation.activeAdvisor.id)}`}>
                    {getAdvisorInitials(conversation.activeAdvisor.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conversation.title}
                  </p>
                  {conversation.lastMessage && (
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {formatMessageTime(new Date(conversation.updatedAt))}
                    </p>
                    {conversation.messageCount && (
                      <span className="text-xs text-gray-500">
                        {conversation.messageCount} messages
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Unread indicator */}
            {currentConversationId !== conversation.id && (((conversation as any).unreadCount ?? 0) > 0 || ((conversation as any).unreadCount === undefined && (conversation.messageCount ?? 0) > 0)) && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500" aria-label="Unread messages" />
            )}

            {/* Delete Button */}
            {onDeleteConversation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title={`Delete conversation: ${conversation.title}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
