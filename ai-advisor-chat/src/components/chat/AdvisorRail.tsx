"use client";

import { useState } from "react";
import { PlusIcon, ChatBubbleLeftIcon, FolderIcon, InformationCircleIcon, TrashIcon, PencilIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { getAdvisorInitials, getAdvisorColor, formatMessageTime, type Advisor, type Conversation } from "~/lib/chat";
import { AdvisorProfileModal } from "./AdvisorProfileModal";
import { DeleteConversationDialog } from "./DeleteConversationDialog";
import { AdvisorModal, type AdvisorFormData } from "./AdvisorModal";
import { Tooltip } from "~/components/ui/Tooltip";
import { AdvisorTooltipContent, ConversationTooltipContent } from "~/components/ui/TooltipContent";
import { useRouter } from "next/navigation";
import { ProjectCard } from "~/components/projects/ProjectCard";
import { ProjectCreateModal } from "~/components/projects/ProjectCreateModal";
import { useProjects } from "~/features/projects/hooks/useProjects";

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
  isCollapsed?: boolean;
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
  isCollapsed = false,
}: AdvisorRailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "conversations">("projects");
  const [selectedAdvisorForProfile, setSelectedAdvisorForProfile] = useState<Advisor | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Advisor modal state
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [advisorToEdit, setAdvisorToEdit] = useState<Advisor | null>(null);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  // Project management state
  const { projects, loading: projectsLoading, createProject, deleteProject, refetch: refetchProjects } = useProjects();
  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);

  const handleMarketplaceClick = () => {
    router.push('/marketplace');
  };

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

  // Project management handlers
  const handleCreateProject = () => {
    setIsProjectCreateModalOpen(true);
  };

  const handleProjectCreated = async () => {
    await refetchProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This will archive the project but keep your conversations.")) {
      try {
        await deleteProject(projectId);
        await refetchProjects();
      } catch (error) {
        console.error("Failed to delete project:", error);
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  // If collapsed on desktop/tablet, show icon-only version
  if (isCollapsed) {
    return (
      <>
        <div className="h-full flex flex-col bg-gray-50">
          {/* Collapsed Header */}
          <div className="p-2 border-b border-gray-200 flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FolderIcon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Collapsed Tab Navigation */}
          <div className="flex flex-col border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`p-3 transition-colors ${
                activeTab === "projects"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Projects"
            >
              <FolderIcon className="w-5 h-5 mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("conversations")}
              className={`p-3 transition-colors ${
                activeTab === "conversations"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Conversations"
            >
              <ChatBubbleLeftIcon className="w-5 h-5 mx-auto" />
            </button>
          </div>

          {/* Collapsed Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === "projects" ? (
              <div className="space-y-2">
                {/* Marketplace Icon */}
                <Tooltip
                  content="Browse and connect with advisors in the Marketplace"
                  delay={500}
                >
                  <button
                    type="button"
                    onClick={handleMarketplaceClick}
                    className="w-full p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                    aria-label="Open Marketplace"
                  >
                    <ShoppingBagIcon className="w-6 h-6 mx-auto" />
                  </button>
                </Tooltip>

                {/* Projects will be shown here in future implementation */}
                <div className="text-center text-gray-400 text-xs mt-4">
                  Projects coming soon
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onNewConversation}
                  className="w-full p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  title="New Conversation"
                >
                  <PlusIcon className="w-5 h-5 mx-auto" />
                </button>
                {conversations.slice(0, 5).map((conversation) => (
                  <Tooltip
                    key={conversation.id}
                    content={<ConversationTooltipContent conversation={conversation} advisors={advisors} />}
                    delay={500}
                  >
                    <button
                      type="button"
                      onClick={() => onConversationSelect(conversation.id)}
                      className={`w-full p-2 rounded-lg transition-colors ${
                        currentConversationId === conversation.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      aria-label={`Select conversation: ${conversation.title}`}
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5 mx-auto" />
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

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
          onClick={() => setActiveTab("projects")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "projects"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FolderIcon className="w-4 h-4 inline mr-2" />
          Projects
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
        {activeTab === "projects" ? (
          <ProjectsList
            onMarketplaceClick={handleMarketplaceClick}
            projects={projects}
            projectsLoading={projectsLoading}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
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

// Legacy AdvisorsList - keeping for reference but not used in new Projects tab
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
      {advisors.map((advisor) => (
        <div key={advisor.id} className="relative mb-2">
          <button
            type="button"
            onClick={() => onAdvisorSelect(advisor.id)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              activeAdvisorId === advisor.id
                ? "bg-blue-100 border-2 border-blue-300"
                : "bg-white border border-gray-200 hover:bg-gray-50"
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
              className={`w-full p-3 rounded-lg text-left transition-colors ${
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

function ProjectsList({
  onMarketplaceClick,
  projects,
  projectsLoading,
  onCreateProject,
  onDeleteProject,
}: {
  onMarketplaceClick: () => void;
  projects: any[];
  projectsLoading: boolean;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}) {
  return (
    <div className="p-2">
      {/* Marketplace Button */}
      <Tooltip
        content="Browse and connect with advisors in the Marketplace"
        delay={500}
      >
        <button
          type="button"
          onClick={onMarketplaceClick}
          className="w-full p-3 rounded-lg mb-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <ShoppingBagIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Marketplace</span>
        </button>
      </Tooltip>

      {/* New Project Button */}
      <button
        type="button"
        onClick={onCreateProject}
        className="w-full p-3 rounded-lg mb-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="text-sm font-medium">New Project</span>
      </button>

      {/* Projects List */}
      {projectsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center text-gray-400 text-sm mt-8">
          <FolderIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No projects yet</p>
          <p className="text-xs mt-1">Create your first project to organize your advisor conversations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onDelete={() => onDeleteProject(project._id)}
              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
            />
          ))}
        </div>
      )}
    </div>
  );
}
