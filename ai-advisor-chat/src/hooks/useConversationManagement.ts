import { useState, useCallback, useEffect } from 'react';
import type { Conversation, Advisor } from '~/types/chat';
import { ConversationsAPI } from '~/lib/api';
import { isConversation } from '~/lib/typeGuards';
import { useErrorHandler } from './useErrorHandler';

// Type adapter to convert between different type systems
const adaptConversation = (conversation: any): Conversation => ({
  id: conversation.id,
  title: conversation.title,
  advisorId: conversation.activeAdvisorId || '',
  createdAt: conversation.createdAt instanceof Date ? conversation.createdAt : new Date(conversation.createdAt),
  updatedAt: conversation.updatedAt instanceof Date ? conversation.updatedAt : new Date(conversation.updatedAt),
  messages: conversation.messages || [],
  isArchived: false,
  metadata: {}
});

/**
 * Custom hook for managing conversation operations
 */
export const useConversationManagement = (initialConversations: Conversation[] = []) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const { handleError, clearError } = useErrorHandler();

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const conversationsData = await ConversationsAPI.getAll();
      const validConversations = conversationsData.filter(isConversation);
      setConversations(validConversations.map(adaptConversation));
      return validConversations;
    } catch (error) {
      handleError(error, 'Failed to load conversations');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      clearError();
      const conversation = await ConversationsAPI.getById(conversationId);

      if (!isConversation(conversation)) {
        throw new Error('Invalid conversation data received');
      }

      setCurrentConversation(conversation);
      return conversation;
    } catch (error) {
      handleError(error, 'Failed to load conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  // Create a new conversation
  const createConversation = useCallback(async (
    title: string,
    advisorId: string,
    options?: { metadata?: Record<string, unknown> }
  ) => {
    try {
      setLoading(true);
      clearError();

      const newConversation = await ConversationsAPI.create({
        title,
        advisorId,
        ...options,
      });

      if (!isConversation(newConversation)) {
        throw new Error('Invalid conversation data received');
      }

      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);

      return newConversation;
    } catch (error) {
      handleError(error, 'Failed to create conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  // Update a conversation
  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    try {
      setLoading(true);
      clearError();

      const updatedConversation = await ConversationsAPI.update(conversationId, updates);

      if (!isConversation(updatedConversation)) {
        throw new Error('Invalid conversation data received');
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? updatedConversation : conv
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updatedConversation);
      }

      return updatedConversation;
    } catch (error) {
      handleError(error, 'Failed to update conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, currentConversation]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      clearError();

      await ConversationsAPI.delete(conversationId);

      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);

      // If we deleted the current conversation, switch to another one or clear
      if (currentConversation?.id === conversationId) {
        const nextConversation = updatedConversations[0] || null;
        setCurrentConversation(nextConversation);
      }

      return true;
    } catch (error) {
      handleError(error, 'Failed to delete conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, conversations, currentConversation]);

  // Select a conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      const conversation = await loadConversation(conversationId);
      return conversation;
    } catch (error) {
      // Fallback: try to find in existing conversations
      const existingConversation = conversations.find(c => c.id === conversationId);
      if (existingConversation && isConversation(existingConversation)) {
        setCurrentConversation(existingConversation);
        return existingConversation;
      }
      throw error;
    }
  }, [loadConversation, conversations]);

  // Get conversation statistics
  const getConversationStats = useCallback(() => {
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
    const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

    const mostRecentConversation = conversations.length > 0
      ? [...conversations].sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]
      : null;

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation,
      mostRecentConversation,
    };
  }, [conversations]);

  // Search conversations
  const searchConversations = useCallback((
    query: string,
    options?: {
      advisorId?: string;
      dateRange?: { start: Date; end: Date };
      limit?: number;
    }
  ) => {
    const filtered = conversations.filter(conv => {
      // Title search
      if (query && !conv.title.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }

      // Advisor filter
      if (options?.advisorId && conv.advisorId !== options.advisorId) {
        return false;
      }

      // Date range filter
      if (options?.dateRange) {
        const convDate = new Date(conv.updatedAt);
        if (convDate < options.dateRange.start || convDate > options.dateRange.end) {
          return false;
        }
      }

      return true;
    });

    // Sort by most recent
    const sorted = filtered.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Limit results
    const limited = options?.limit ? sorted.slice(0, options.limit) : sorted;

    return limited;
  }, [conversations]);

  // Archive conversations
  const archiveConversations = useCallback(async (conversationIds: string[]) => {
    try {
      setLoading(true);
      clearError();

      const updatePromises = conversationIds.map(id =>
        ConversationsAPI.update(id, { title: `Archived ${new Date().toLocaleDateString()}` })
      );

      const updatedConversations = await Promise.all(updatePromises);

      setConversations(prev =>
        prev.map(conv =>
          conversationIds.includes(conv.id)
            ? { ...conv, isArchived: true }
            : conv
        )
      );

      return updatedConversations.filter(isConversation);
    } catch (error) {
      handleError(error, 'Failed to archive conversations');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  return {
    // State
    conversations,
    currentConversation,
    loading,

    // Actions
    loadConversations,
    loadConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    selectConversation,
    archiveConversations,

    // Utilities
    getConversationStats,
    searchConversations,

    // Setters
    setConversations,
    setCurrentConversation,
  };
};

export type UseConversationManagementReturn = ReturnType<typeof useConversationManagement>;