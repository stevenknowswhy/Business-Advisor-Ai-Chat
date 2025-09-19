import { renderHook, act } from '@testing-library/react';
import { useChatState } from '~/hooks/useChatState';
import { useErrorHandler } from '~/hooks/useErrorHandler';
import { useConversationManagement } from '~/hooks/useConversationManagement';
import type { Conversation, Advisor } from '~/types/chat';

// Mock the API module
jest.mock('~/lib/api', () => ({
  ConversationsAPI: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Custom Hooks', () => {
  describe('useChatState', () => {
    it('provides initial state', () => {
      const { result } = renderHook(() => useChatState());

      expect(result.current.state).toEqual({
        advisors: [],
        conversations: [],
        currentConversation: null,
        loading: true,
        error: null,
        advisorSwitched: false,
      });
    });

    it('allows updating advisors', () => {
      const { result } = renderHook(() => useChatState());
      const mockAdvisors: Advisor[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          title: 'Advisor',
          jsonConfiguration: '{}',
          createdAt: new Date(),
        },
      ];

      act(() => {
        result.current.setAdvisors(mockAdvisors);
      });

      expect(result.current.state.advisors).toEqual(mockAdvisors);
    });

    it('allows updating conversations', () => {
      const { result } = renderHook(() => useChatState());
      const mockConversations: Conversation[] = [
        {
          id: '1',
          title: 'Test Conversation',
          advisorId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      act(() => {
        result.current.setConversations(mockConversations);
      });

      expect(result.current.state.conversations).toEqual(mockConversations);
    });

    it('filters invalid advisors', () => {
      const { result } = renderHook(() => useChatState());

      const invalidAdvisors = [
        null,
        undefined,
        {},
        { id: '1', firstName: 'John' } as any, // Missing required fields
        {
          id: '2',
          firstName: 'Valid',
          lastName: 'Advisor',
          title: 'Title',
          jsonConfiguration: '{}',
          createdAt: new Date(),
        },
      ];

      act(() => {
        result.current.setAdvisors(invalidAdvisors as any);
      });

      expect(result.current.state.advisors).toHaveLength(1);
      expect(result.current.state.advisors[0]?.firstName).toBe('Valid');
    });

    it('provides derived state', () => {
      const { result } = renderHook(() => useChatState());

      expect(result.current.hasAdvisors).toBe(false);
      expect(result.current.hasConversations).toBe(false);
      expect(result.current.activeAdvisor).toBeUndefined();
      expect(result.current.recentConversations).toEqual([]);

      act(() => {
        result.current.setAdvisors([{
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          title: 'Advisor',
          jsonConfiguration: '{}',
          createdAt: new Date(),
          isActive: true,
        }]);
      });

      expect(result.current.hasAdvisors).toBe(true);
      expect(result.current.activeAdvisor).toBeDefined();
    });
  });

  describe('useErrorHandler', () => {
    it('initializes with no error', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBeNull();
    });

    it('handles network errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      const networkError = new Error('Failed to fetch');
      act(() => {
        result.current.handleError(networkError);
      });

      expect(result.current.error).toEqual(expect.objectContaining({
        type: 'network',
        message: 'Connection error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
      }));
    });

    it('handles authentication errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      const authError = new Error('401 Unauthorized');
      act(() => {
        result.current.handleError(authError);
      });

      expect(result.current.error).toEqual(expect.objectContaining({
        type: 'authentication',
        message: 'Please sign in to continue.',
        code: 'AUTH_ERROR',
      }));
    });

    it('handles validation errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      const validationError = new Error('Validation failed');
      act(() => {
        result.current.handleError(validationError);
      });

      expect(result.current.error).toEqual(expect.objectContaining({
        type: 'validation',
        message: 'Invalid input. Please check your data and try again.',
        code: 'VALIDATION_ERROR',
      }));
    });

    it('handles server errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      const serverError = new Error('500 Internal Server Error');
      act(() => {
        result.current.handleError(serverError);
      });

      expect(result.current.error).toEqual(expect.objectContaining({
        type: 'server',
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
      }));
    });

    it('clears errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('test error'));
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('creates context-aware error handlers', () => {
      const { result } = renderHook(() => useErrorHandler());

      const handleErrorWith = result.current.createErrorHandler('test-context');
      act(() => {
        handleErrorWith(new Error('contextual error'));
      });

      expect(result.current.error?.details).toEqual(
        expect.objectContaining({
          context: 'test-context',
        })
      );
    });
  });

  describe('useConversationManagement', () => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        title: 'First Conversation',
        advisorId: '1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        title: 'Second Conversation',
        advisorId: '1',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    it('initializes with provided conversations', () => {
      const { result } = renderHook(() =>
        useConversationManagement(mockConversations)
      );

      expect(result.current.conversations).toEqual(mockConversations);
      expect(result.current.loading).toBe(false);
    });

    it('provides conversation statistics', () => {
      const { result } = renderHook(() =>
        useConversationManagement(mockConversations)
      );

      const stats = result.current.getConversationStats();

      expect(stats.totalConversations).toBe(2);
      expect(stats.totalMessages).toBe(0);
      expect(stats.mostRecentConversation).toBeDefined();
    });

    it('searches conversations correctly', () => {
      const { result } = renderHook(() =>
        useConversationManagement(mockConversations)
      );

      const searchResults = result.current.searchConversations('first');

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0]?.title).toBe('First Conversation');
    });

    it('filters conversations by advisor', () => {
      const { result } = renderHook(() =>
        useConversationManagement(mockConversations)
      );

      const filtered = result.current.searchConversations('', { advisorId: '1' });

      expect(filtered).toHaveLength(2);
    });

    it('sorts conversations by recency', () => {
      const { result } = renderHook(() =>
        useConversationManagement(mockConversations)
      );

      const searchResults = result.current.searchConversations('');

      expect(searchResults[0]?.id).toBe('2'); // Most recent
      expect(searchResults[1]?.id).toBe('1'); // Older
    });
  });
});