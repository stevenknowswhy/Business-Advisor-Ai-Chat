"use client";

import { useState } from "react";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface MessageActionsProps {
  messageId: string;
  content: string;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  isLoading?: boolean;
}

export function MessageActions({ 
  messageId, 
  content, 
  onEdit, 
  onDelete, 
  isLoading = false 
}: MessageActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<'edit' | 'delete' | null>(null);

  const handleEditStart = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (editContent.trim() === content.trim()) {
      setIsEditing(false);
      return;
    }

    if (!editContent.trim()) {
      return; // Don't save empty messages
    }

    try {
      setActionLoading('edit');
      await onEdit(messageId, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
      // Keep editing mode open on error
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading('delete');
      await onDelete(messageId);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={Math.min(Math.max(editContent.split('\n').length, 2), 8)}
          placeholder="Edit your message..."
          disabled={actionLoading === 'edit'}
          autoFocus
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEditSave}
            disabled={actionLoading === 'edit' || !editContent.trim()}
            className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save changes"
          >
            <CheckIcon className="w-4 h-4 mr-1" />
            {actionLoading === 'edit' ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleEditCancel}
            disabled={actionLoading === 'edit'}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
            aria-label="Cancel editing"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800 mb-3">
          Are you sure you want to delete this message? Only this message will be removed from the conversation.
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDeleteConfirm}
            disabled={actionLoading === 'delete'}
            className="inline-flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Confirm delete"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={handleDeleteCancel}
            disabled={actionLoading === 'delete'}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
            aria-label="Cancel delete"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end space-x-2 mt-2">
      <button
        onClick={handleEditStart}
        disabled={isLoading || actionLoading !== null}
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Edit message"
        title="Edit message"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isLoading || actionLoading !== null}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Delete message"
        title="Delete this message"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
