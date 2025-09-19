import {
  transformMessages,
  getConversationTitle,
  formatMessageTime,
  getAdvisorName,
  sortMessagesByTimestamp,
  filterMessagesByRole,
  getLatestMessage,
  isMessageFromToday,
  getConversationStats,
  clearMessageUtilsCache,
} from '~/lib/messageUtils';
import type { Message, Advisor } from '~/types/chat';

describe('Message Utilities', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello world',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hello! How can I help you?',
      createdAt: new Date('2024-01-01T10:01:00Z'),
    },
    {
      id: '3',
      role: 'user',
      content: 'Can you help me with my finances?',
      createdAt: new Date('2024-01-01T10:02:00Z'),
    },
  ];

  const mockAdvisors: Advisor[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      title: 'Financial Advisor',
      jsonConfiguration: '{}',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Clear cache before each test
    clearMessageUtilsCache();
  });

  describe('transformMessages', () => {
    it('transforms valid message data', () => {
      const rawMessages = [
        {
          id: '1',
          sender: 'user',
          content: 'Hello world',
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          sender: 'advisor',
          content: 'Hello!',
          createdAt: '2024-01-01T10:01:00Z',
        },
      ];

      const result = transformMessages(rawMessages);

      expect(result).toHaveLength(2);
      expect(result[0]?.role).toBe('user');
      expect(result[1]?.role).toBe('assistant');
      expect(result[0]?.content).toBe('Hello world');
      expect(result[1]?.content).toBe('Hello!');
    });

    it('filters out invalid messages', () => {
      const rawMessages = [
        {
          id: '1',
          sender: 'user',
          content: 'Valid message',
          createdAt: '2024-01-01T10:00:00Z',
        },
        null,
        undefined,
        {},
        'not an object',
      ];

      const result = transformMessages(rawMessages as any);

      expect(result).toHaveLength(1);
      expect(result[0]?.content).toBe('Valid message');
    });

    it('handles empty array', () => {
      const result = transformMessages([]);
      expect(result).toEqual([]);
    });

    it('handles non-array input', () => {
      const result = transformMessages(null as any);
      expect(result).toEqual([]);
    });
  });

  describe('getConversationTitle', () => {
    it('generates title from first user message', () => {
      const title = getConversationTitle(mockMessages);
      expect(title).toBe('Hello world');
    });

    it('returns default title for empty messages', () => {
      const title = getConversationTitle([]);
      expect(title).toBe('New Conversation');
    });

    it('truncates long titles', () => {
      const longMessage = 'A'.repeat(100);
      const messagesWithLongContent: Message[] = [
        {
          id: '1',
          role: 'user',
          content: longMessage,
          createdAt: new Date(),
        },
      ];

      const title = getConversationTitle(messagesWithLongContent);
      expect(title.length).toBeLessThanOrEqual(53); // 50 chars + '...'
      expect(title.endsWith('...')).toBe(true);
    });

    it('cleans markdown from titles', () => {
      const messagesWithMarkdown: Message[] = [
        {
          id: '1',
          role: 'user',
          content: '## Hello **world**',
          createdAt: new Date(),
        },
      ];

      const title = getConversationTitle(messagesWithMarkdown);
      expect(title).toBe('Hello world');
    });
  });

  describe('formatMessageTime', () => {
    const now = new Date();

    it('formats recent times as relative', () => {
      const recentMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Recent',
        createdAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      };

      const time = formatMessageTime(recentMessage.createdAt);
      expect(time).toBe('5m ago');
    });

    it('formats older times as dates', () => {
      const oldMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Old',
        createdAt: new Date('2023-01-01T10:00:00Z'),
      };

      const time = formatMessageTime(oldMessage.createdAt);
      expect(time).toContain('2023');
    });

    it('handles invalid dates', () => {
      const time = formatMessageTime('invalid-date' as any);
      expect(time).toBeDefined();
    });
  });

  describe('getAdvisorName', () => {
    it('returns full name when available', () => {
      const name = getAdvisorName(mockAdvisors[0]);
      expect(name).toBe('John Doe');
    });

    it('falls back to first name only', () => {
      const advisorWithoutLastName = { ...mockAdvisors[0], lastName: undefined };
      const name = getAdvisorName(advisorWithoutLastName);
      expect(name).toBe('John');
    });

    it('returns fallback for missing advisor', () => {
      const name = getAdvisorName(null);
      expect(name).toBe('Unknown Advisor');
    });
  });

  describe('sortMessagesByTimestamp', () => {
    it('sorts messages chronologically', () => {
      const unsortedMessages = [...mockMessages].reverse();
      const sorted = sortMessagesByTimestamp(unsortedMessages);

      expect(sorted[0]?.id).toBe('1');
      expect(sorted[1]?.id).toBe('2');
      expect(sorted[2]?.id).toBe('3');
    });

    it('handles empty array', () => {
      const result = sortMessagesByTimestamp([]);
      expect(result).toEqual([]);
    });
  });

  describe('filterMessagesByRole', () => {
    it('filters messages by role correctly', () => {
      const userMessages = filterMessagesByRole(mockMessages, 'user');
      expect(userMessages).toHaveLength(2);
      expect(userMessages.every(msg => msg.role === 'user')).toBe(true);

      const assistantMessages = filterMessagesByRole(mockMessages, 'assistant');
      expect(assistantMessages).toHaveLength(1);
      expect(assistantMessages.every(msg => msg.role === 'assistant')).toBe(true);
    });

    it('returns empty array for no matches', () => {
      const systemMessages = filterMessagesByRole(mockMessages, 'system');
      expect(systemMessages).toEqual([]);
    });
  });

  describe('getLatestMessage', () => {
    it('returns the most recent message', () => {
      const latest = getLatestMessage(mockMessages);
      expect(latest?.id).toBe('3');
    });

    it('returns null for empty array', () => {
      const latest = getLatestMessage([]);
      expect(latest).toBeNull();
    });
  });

  describe('isMessageFromToday', () => {
    it('returns true for today\'s messages', () => {
      const todayMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Today',
        createdAt: new Date(),
      };

      expect(isMessageFromToday(todayMessage)).toBe(true);
    });

    it('returns false for old messages', () => {
      const oldMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Old',
        createdAt: new Date('2023-01-01'),
      };

      expect(isMessageFromToday(oldMessage)).toBe(false);
    });
  });

  describe('getConversationStats', () => {
    it('calculates conversation statistics correctly', () => {
      const stats = getConversationStats(mockMessages);

      expect(stats.totalMessages).toBe(3);
      expect(stats.userMessages).toBe(2);
      expect(stats.assistantMessages).toBe(1);
      expect(stats.systemMessages).toBe(0);
      expect(stats.createdAt).toBeDefined();
      expect(stats.lastActivity).toBeDefined();
    });

    it('handles empty messages array', () => {
      const stats = getConversationStats([]);

      expect(stats.totalMessages).toBe(0);
      expect(stats.userMessages).toBe(0);
      expect(stats.assistantMessages).toBe(0);
      expect(stats.systemMessages).toBe(0);
    });

    it('handles non-array input', () => {
      const stats = getConversationStats(null as any);

      expect(stats.totalMessages).toBe(0);
      expect(stats.userMessages).toBe(0);
      expect(stats.assistantMessages).toBe(0);
      expect(stats.systemMessages).toBe(0);
    });
  });

  describe('clearMessageUtilsCache', () => {
    it('clears all caches without error', () => {
      expect(() => {
        clearMessageUtilsCache();
      }).not.toThrow();
    });
  });
});