// Type guard utilities for runtime type safety

import type {
  Message,
  Advisor,
  Conversation,
  MessageRole,
  AdvisorFormData,
  ApiResponse,
  PaginatedResponse
} from '~/types/chat';

/**
 * Type guard for Message objects
 */
export const isMessage = (obj: unknown): obj is Message => {
  if (!obj || typeof obj !== 'object') return false;

  const message = obj as Message;

  return (
    typeof message.id === 'string' &&
    typeof message.content === 'string' &&
    isValidMessageRole(message.role) &&
    (message.advisor === undefined || typeof message.advisor === 'string') &&
    (message.createdAt instanceof Date || typeof message.createdAt === 'string') &&
    (message.updatedAt === undefined || message.updatedAt instanceof Date || typeof message.updatedAt === 'string') &&
    (message.isEdited === undefined || typeof message.isEdited === 'boolean') &&
    (message.isDeleted === undefined || typeof message.isDeleted === 'boolean')
  );
};

/**
 * Type guard for MessageRole enum values
 */
export const isValidMessageRole = (role: string): role is MessageRole => {
  return ['user', 'assistant', 'system'].includes(role);
};

/**
 * Type guard for Advisor objects
 */
export const isAdvisor = (obj: unknown): obj is Advisor => {
  if (!obj || typeof obj !== 'object') return false;

  const advisor = obj as Advisor;

  return (
    typeof advisor.id === 'string' &&
    typeof advisor.firstName === 'string' &&
    typeof advisor.lastName === 'string' &&
    typeof advisor.title === 'string' &&
    typeof advisor.jsonConfiguration === 'string' &&
    (advisor.imageUrl === undefined || typeof advisor.imageUrl === 'string') &&
    (advisor.createdAt instanceof Date || typeof advisor.createdAt === 'string') &&
    (advisor.updatedAt === undefined || advisor.updatedAt instanceof Date || typeof advisor.updatedAt === 'string') &&
    (advisor.isActive === undefined || typeof advisor.isActive === 'boolean') &&
    (advisor.isSystem === undefined || typeof advisor.isSystem === 'boolean')
  );
};

/**
 * Type guard for Conversation objects
 */
export const isConversation = (obj: unknown): obj is Conversation => {
  if (!obj || typeof obj !== 'object') return false;

  const conversation = obj as Conversation;

  return (
    typeof conversation.id === 'string' &&
    typeof conversation.title === 'string' &&
    typeof conversation.advisorId === 'string' &&
    (conversation.messages === undefined || Array.isArray(conversation.messages)) &&
    (conversation.createdAt instanceof Date || typeof conversation.createdAt === 'string') &&
    (conversation.updatedAt instanceof Date || typeof conversation.updatedAt === 'string') &&
    (conversation.isArchived === undefined || typeof conversation.isArchived === 'boolean') &&
    (conversation.metadata === undefined || typeof conversation.metadata === 'object')
  );
};

/**
 * Type guard for AdvisorFormData objects
 */
export const isAdvisorFormData = (obj: unknown): obj is AdvisorFormData => {
  if (!obj || typeof obj !== 'object') return false;

  const data = obj as AdvisorFormData;

  return (
    typeof data.firstName === 'string' &&
    typeof data.lastName === 'string' &&
    typeof data.title === 'string' &&
    typeof data.jsonConfiguration === 'string' &&
    (data.imageUrl === undefined || typeof data.imageUrl === 'string')
  );
};

/**
 * Type guard for arrays with specific type
 */
export const isArrayOfType = <T>(
  array: unknown,
  typeGuard: (item: unknown) => item is T
): array is T[] => {
  return Array.isArray(array) && array.every(typeGuard);
};

/**
 * Type guard for string arrays
 */
export const isStringArray = (obj: unknown): obj is string[] => {
  return Array.isArray(obj) && obj.every(item => typeof item === 'string');
};

/**
 * Type guard for date-like objects
 */
export const isDateLike = (obj: unknown): obj is Date | string => {
  return obj instanceof Date || (typeof obj === 'string' && !isNaN(Date.parse(obj)));
};

/**
 * Type guard for numeric strings
 */
export const isNumericString = (obj: unknown): obj is string => {
  return typeof obj === 'string' && !isNaN(Number(obj)) && obj.trim() !== '';
};

/**
 * Type guard for valid JSON strings
 */
export const isValidJsonString = (obj: unknown): obj is string => {
  if (typeof obj !== 'string') return false;

  try {
    JSON.parse(obj);
    return true;
  } catch {
    return false;
  }
};

/**
 * Type guard for API response objects
 */
export const isApiResponse = <T>(
  obj: unknown,
  dataGuard: (data: unknown) => data is T
): obj is ApiResponse<T> => {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as ApiResponse<T>;

  return (
    typeof response.success === 'boolean' &&
    dataGuard(response.data) &&
    (response.message === undefined || typeof response.message === 'string') &&
    (response.error === undefined || typeof response.error === 'string')
  );
};

/**
 * Type guard for error objects
 */
export const isErrorLike = (obj: unknown): obj is Error => {
  return (
    obj instanceof Error ||
    !!(obj &&
      typeof obj === 'object' &&
      'message' in obj &&
      typeof obj.message === 'string' &&
      ('name' in obj || 'stack' in obj))
  );
};

/**
 * Type guard for paginated response objects
 */
export const isPaginatedResponse = <T>(
  obj: unknown,
  dataGuard: (data: unknown) => data is T
): obj is PaginatedResponse<T> => {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as PaginatedResponse<T>;

  return (
    Array.isArray(response.data) &&
    response.data.every(dataGuard) &&
    typeof response.pagination === 'object' &&
    typeof response.pagination.page === 'number' &&
    typeof response.pagination.limit === 'number' &&
    typeof response.pagination.total === 'number' &&
    typeof response.pagination.totalPages === 'number'
  );
};

/**
 * Type guard for UUID strings
 */
export const isUuid = (obj: unknown): obj is string => {
  if (typeof obj !== 'string') return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(obj);
};

/**
 * Type guard for email addresses
 */
export const isEmail = (obj: unknown): obj is string => {
  if (typeof obj !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(obj);
};

/**
 * Type guard for URL strings
 */
export const isUrl = (obj: unknown): obj is string => {
  if (typeof obj !== 'string') return false;

  try {
    new URL(obj);
    return true;
  } catch {
    return false;
  }
};

/**
 * Type guard for safe HTML content (no dangerous tags)
 */
export const isSafeHtml = (obj: unknown): obj is string => {
  if (typeof obj !== 'string') return false;

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(obj));
};

/**
 * Type guard with custom error message
 */
export const assertType = <T>(
  obj: unknown,
  typeGuard: (obj: unknown) => obj is T,
  errorMessage: string = 'Type assertion failed'
): T => {
  if (!typeGuard(obj)) {
    throw new Error(errorMessage);
  }
  return obj;
};

/**
 * Safe type casting with fallback
 */
export const safeCast = <T>(
  obj: unknown,
  typeGuard: (obj: unknown) => obj is T,
  fallback: T
): T => {
  return typeGuard(obj) ? obj : fallback;
};

/**
 * Type guard for non-empty strings
 */
export const isNonEmptyString = (obj: unknown): obj is string => {
  return typeof obj === 'string' && obj.trim().length > 0;
};

/**
 * Type guard for positive numbers
 */
export const isPositiveNumber = (obj: unknown): obj is number => {
  return typeof obj === 'number' && obj > 0 && !isNaN(obj);
};

/**
 * Type guard for arrays within length bounds
 */
export const isArrayOfLength = <T>(
  obj: unknown,
  typeGuard: (item: unknown) => item is T,
  minLength: number,
  maxLength: number
): obj is T[] => {
  if (!Array.isArray(obj)) return false;
  if (obj.length < minLength || obj.length > maxLength) return false;
  return obj.every(typeGuard);
};

/**
 * Type guard for objects with specific properties
 */
export const hasProperties = <T extends Record<string, unknown>>(
  obj: unknown,
  properties: (keyof T)[]
): obj is T => {
  if (!obj || typeof obj !== 'object') return false;

  return properties.every(prop => prop in obj);
};

/**
 * Type guard for function objects
 */
export const isFunction = (obj: unknown): obj is Function => {
  return typeof obj === 'function';
};

/**
 * Type guard for Promise objects
 */
export const isPromise = <T>(obj: unknown): obj is Promise<T> => {
  return obj instanceof Promise || !!(obj &&
    typeof obj === 'object' &&
    'then' in obj &&
    typeof obj.then === 'function' &&
    'catch' in obj &&
    typeof obj.catch === 'function'
  );
};