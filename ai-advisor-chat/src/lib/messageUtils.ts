import type { Message, MessageRole } from '~/types/chat';
import { isMessage, isValidMessageRole, isDateLike } from '~/lib/typeGuards';

/**
 * Memoization cache for message transformations
 */
const messageTransformCache = new Map<string, Message[]>();

/**
 * Transforms raw message data into properly typed Message objects
 */
export const transformMessages = (rawMessages: unknown[]): Message[] => {
  // Check cache first using string representation
  const cacheKey = JSON.stringify(rawMessages);
  if (Array.isArray(rawMessages) && messageTransformCache.has(cacheKey)) {
    return messageTransformCache.get(cacheKey)!;
  }

  if (!Array.isArray(rawMessages)) {
    console.warn('transformMessages: Expected array, got:', typeof rawMessages);
    return [];
  }

  const transformed = rawMessages
    .map((rawMessage): Message | null => {
      if (!rawMessage || typeof rawMessage !== 'object') {
        console.warn('transformMessages: Invalid message object:', rawMessage);
        return null;
      }

      // Handle both database format and existing format
      const message = rawMessage as any;

      // Validate required fields
      if (!message.id || typeof message.id !== 'string') {
        console.warn('transformMessages: Missing or invalid message ID:', message);
        return null;
      }

      if (!message.content || typeof message.content !== 'string') {
        console.warn('transformMessages: Missing or invalid message content:', message);
        return null;
      }

      // Validate and transform role
      let role: MessageRole = 'system';
      if (message.sender) {
        if (message.sender === 'user') role = 'user';
        else if (message.sender === 'advisor') role = 'assistant';
      } else if (message.role && isValidMessageRole(message.role)) {
        role = message.role;
      }

      // Validate and transform date
      let createdAt: Date | string = message.createdAt || new Date();
      if (typeof createdAt === 'string') {
        // Try to parse date string, fallback to current date
        try {
          const parsed = new Date(createdAt);
          if (isNaN(parsed.getTime())) {
            createdAt = new Date();
          } else {
            createdAt = parsed;
          }
        } catch {
          createdAt = new Date();
        }
      } else if (!(createdAt instanceof Date)) {
        createdAt = new Date();
      }

      // Transform advisor reference
      let advisor: string | undefined;
      if (message.advisor?.id) {
        advisor = message.advisor.id;
      } else if (typeof message.advisorId === 'string') {
        advisor = message.advisorId;
      }

      // Create transformed message
      const transformedMessage: Message = {
        id: message.id,
        role,
        content: message.content,
        advisor,
        createdAt,
        updatedAt: message.updatedAt || createdAt,
        isEdited: message.isEdited || false,
        isDeleted: message.isDeleted || false
      };

      // Validate with type guard
      if (!isMessage(transformedMessage)) {
        console.warn('transformMessages: Failed type validation for:', transformedMessage);
        return null;
      }

      return transformedMessage;
    })
    .filter((message): message is Message => message !== null);

  // Cache the result
  messageTransformCache.set(cacheKey, transformed);

  return transformed;
};

/**
 * Memoization cache for conversation titles
 */
const titleCache = new Map<string, string>();

/**
 * Generates a conversation title from messages
 */
export const getConversationTitle = (messages: Message[]): string => {
  // Check cache first using string representation
  const titleCacheKey = JSON.stringify(messages);
  if (titleCache.has(titleCacheKey)) {
    return titleCache.get(titleCacheKey)!;
  }

  if (!messages || messages.length === 0) {
    const defaultTitle = 'New Conversation';
    titleCache.set(titleCacheKey, defaultTitle);
    return defaultTitle;
  }

  // Find the first user message
  const firstUserMessage = messages.find(msg => msg.role === 'user');

  if (!firstUserMessage || !firstUserMessage.content.trim()) {
    const defaultTitle = 'New Conversation';
    titleCache.set(titleCacheKey, defaultTitle);
    return defaultTitle;
  }

  // Clean and truncate the message content
  let title = firstUserMessage.content
    .trim()
    .replace(/^#+\s*/, '') // Remove markdown headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/`([^`]+)`/g, '$1') // Remove code markdown
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  // Truncate if too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }

  // Ensure title is not empty
  if (!title) {
    title = 'New Conversation';
  }

  // Cache the result
  titleCache.set(titleCacheKey, title);

  return title;
};

/**
 * Memoization cache for message timestamps
 */
const timestampCache = new WeakMap<object, string>();
const stringTimestampCache = new Map<string, string>();

/**
 * Formats a message timestamp for display
 */
export const formatMessageTime = (timestamp: Message['createdAt']): string => {
  let date: Date;

  // Handle different timestamp formats
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    try {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    } catch {
      date = new Date();
    }
  } else {
    date = new Date();
  }

  // Check cache - use appropriate cache based on type
  if (typeof timestamp === 'string') {
    if (stringTimestampCache.has(timestamp)) {
      return stringTimestampCache.get(timestamp)!;
    }
  } else if (timestampCache.has(timestamp)) {
    return timestampCache.get(timestamp)!;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let formattedTime: string;

  if (diffMinutes < 1) {
    formattedTime = 'just now';
  } else if (diffMinutes < 60) {
    formattedTime = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    formattedTime = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    formattedTime = `${diffDays}d ago`;
  } else {
    // For older messages, show the date
    formattedTime = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  // Cache the result - use appropriate cache based on type
  if (typeof timestamp === 'string') {
    stringTimestampCache.set(timestamp, formattedTime);
  } else {
    timestampCache.set(timestamp, formattedTime);
  }

  return formattedTime;
};

/**
 * Memoization cache for advisor names
 */
const advisorNameCache = new Map<string, string>();

/**
 * Gets a formatted advisor name
 */
export const getAdvisorName = (advisor: any): string => {
  if (!advisor) return 'Unknown Advisor';

  // Check cache using string representation
  const advisorCacheKey = JSON.stringify(advisor);
  if (advisorNameCache.has(advisorCacheKey)) {
    return advisorNameCache.get(advisorCacheKey)!;
  }

  let name: string;

  if (advisor.firstName && advisor.lastName) {
    name = `${advisor.firstName} ${advisor.lastName}`;
  } else if (advisor.firstName) {
    name = advisor.firstName;
  } else if (advisor.name) {
    name = advisor.name;
  } else if (advisor.title) {
    name = advisor.title;
  } else {
    name = 'Unknown Advisor';
  }

  // Cache the result
  advisorNameCache.set(advisorCacheKey, name);

  return name;
};

/**
 * Validates and sorts messages by timestamp
 */
export const sortMessagesByTimestamp = (messages: Message[]): Message[] => {
  if (!Array.isArray(messages)) return [];

  return [...messages].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return dateA - dateB;
  });
};

/**
 * Filters messages by role
 */
export const filterMessagesByRole = (messages: Message[], role: MessageRole): Message[] => {
  if (!Array.isArray(messages)) return [];

  return messages.filter(message => message.role === role);
};

/**
 * Gets the latest message from a conversation
 */
export const getLatestMessage = (messages: Message[]): Message | null => {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const sorted = sortMessagesByTimestamp(messages);
  return sorted[sorted.length - 1] || null;
};

/**
 * Checks if a message is from today
 */
export const isMessageFromToday = (message: Message): boolean => {
  if (!message.createdAt) return false;

  const messageDate = message.createdAt instanceof Date
    ? message.createdAt
    : new Date(message.createdAt);

  const today = new Date();

  return (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Gets conversation statistics
 */
export const getConversationStats = (messages: Message[]) => {
  if (!Array.isArray(messages)) {
    return {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      systemMessages: 0,
      lastActivity: null,
      createdAt: null
    };
  }

  const stats = {
    totalMessages: messages.length,
    userMessages: 0,
    assistantMessages: 0,
    systemMessages: 0,
    lastActivity: null as Date | null,
    createdAt: null as Date | null
  };

  messages.forEach(message => {
    switch (message.role) {
      case 'user':
        stats.userMessages++;
        break;
      case 'assistant':
        stats.assistantMessages++;
        break;
      case 'system':
        stats.systemMessages++;
        break;
    }

    // Track timestamps
    const messageDate = message.createdAt instanceof Date
      ? message.createdAt
      : new Date(message.createdAt);

    if (!stats.createdAt || messageDate < stats.createdAt) {
      stats.createdAt = messageDate;
    }

    if (!stats.lastActivity || messageDate > stats.lastActivity) {
      stats.lastActivity = messageDate;
    }
  });

  return stats;
};

/**
 * Clears all memoization caches (useful for testing or memory management)
 */
export const clearMessageUtilsCache = () => {
  messageTransformCache.clear();
  titleCache.clear();
  // WeakMaps don't have clear method, they're automatically garbage collected
  stringTimestampCache.clear();
  advisorNameCache.clear();
};

/**
 * Debounced version of title generation for performance
 */
export const debouncedGetConversationTitle = (() => {
  const timeouts = new WeakMap<Message[], NodeJS.Timeout>();

  return (messages: Message[], callback: (title: string) => void, delay = 300) => {
    // Clear existing timeout for these messages
    if (timeouts.has(messages)) {
      clearTimeout(timeouts.get(messages)!);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      const title = getConversationTitle(messages);
      callback(title);
      timeouts.delete(messages);
    }, delay);

    timeouts.set(messages, timeout);
  };
})();