// Input validation and sanitization utilities
import { z } from 'zod';

// Zod schemas for type-safe validation
export const validateMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long (max 10,000 characters)')
    .transform(val => sanitizeMessageContent(val)),
  conversationId: z.string().min(1, 'Conversation ID is required'),
});

export const validateConversationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title is too long (max 100 characters)')
    .transform(val => sanitizeConversationTitle(val)),
  advisorId: z.string().min(1, 'Advisor ID is required'),
});

export const validateAdvisorSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long (max 50 characters)')
    .transform(val => sanitizeUserInput(val)),
  title: z.string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title is too long (max 100 characters)')
    .transform(val => sanitizeUserInput(val)),
  oneLiner: z.string()
    .min(10, 'One-liner must be at least 10 characters')
    .max(200, 'One-liner is too long (max 200 characters)')
    .transform(val => sanitizeUserInput(val)),
  expertise: z.array(z.string().transform(val => sanitizeUserInput(val)))
    .min(1, 'At least one expertise is required')
    .max(10, 'Too many expertise areas (max 10)'),
  description: z.string()
    .max(1000, 'Description is too long (max 1,000 characters)')
    .optional()
    .transform(val => val ? sanitizeUserInput(val) : val),
});

export const validateTeamSchema = z.object({
  templateId: z.string()
    .min(1, 'Template ID is required')
    .max(50, 'Template ID is too long'),
  selectedAdvisors: z.array(z.object({
    id: z.string(),
    selected: z.boolean(),
    customName: z.string().optional(),
    customTitle: z.string().optional(),
  })).optional(),
});

export const validateChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (max 4,000 characters)')
    .transform(val => sanitizeMessageContent(val)),
  conversationId: z.string().min(1, 'Conversation ID is required'),
  advisorId: z.string().min(1, 'Advisor ID is required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/**
 * Validates message input content for security and length constraints
 */
export const validateMessageInput = (input: string): boolean => {
  const maxLength = 10000;
  const minLength = 1;

  // Forbidden patterns to prevent XSS and injection attacks
  const forbiddenPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];

  // Check length constraints
  if (input.length < minLength || input.length > maxLength) {
    return false;
  }

  // Check for forbidden patterns
  if (forbiddenPatterns.some(pattern => pattern.test(input))) {
    return false;
  }

  // Check for potentially dangerous Unicode characters
  const dangerousUnicode = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\uFFFE\uFFFF]/g;
  if (dangerousUnicode.test(input)) {
    return false;
  }

  return true;
};

/**
 * Sanitizes HTML content by escaping dangerous characters
 */
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes message content for safe display and storage
 */
export const sanitizeMessageContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Trim whitespace
  const trimmed = content.trim();

  // Apply HTML sanitization
  const sanitized = sanitizeHtml(trimmed);

  // Remove excessive whitespace
  const collapsedWhitespace = sanitized.replace(/\s+/g, ' ');

  return collapsedWhitespace;
};

/**
 * Validates and sanitizes advisor configuration JSON
 */
export const validateAdvisorConfig = (config: string): { isValid: boolean; sanitized?: string; error?: string } => {
  try {
    // Parse JSON to validate structure
    const parsed = JSON.parse(config);

    // Basic validation - ensure it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      return { isValid: false, error: 'Configuration must be a valid JSON object' };
    }

    // Check for potentially dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const hasDangerousKeys = Object.keys(parsed).some(key => dangerousKeys.includes(key));

    if (hasDangerousKeys) {
      return { isValid: false, error: 'Configuration contains dangerous properties' };
    }

    // Sanitize by re-stringifying to remove any malicious content
    const sanitized = JSON.stringify(parsed);

    return { isValid: true, sanitized };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    };
  }
};

/**
 * Validates file uploads for advisor images
 */
export const validateImageUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, GIF, and WebP images are allowed'
    };
  }

  return { isValid: true };
};

/**
 * Sanitizes user input for display in UI elements
 */
export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

/**
 * Validates conversation title
 */
export const validateConversationTitle = (title: string): { isValid: boolean; error?: string } => {
  const maxLength = 100;
  const minLength = 1;

  if (title.length < minLength || title.length > maxLength) {
    return {
      isValid: false,
      error: `Title must be between ${minLength} and ${maxLength} characters`
    };
  }

  // Check for dangerous content
  if (!validateMessageInput(title)) {
    return { isValid: false, error: 'Title contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Sanitizes conversation title for safe display
 */
export const sanitizeConversationTitle = (title: string): string => {
  const sanitized = sanitizeUserInput(title);

  // Truncate if too long after sanitization
  if (sanitized.length > 50) {
    return sanitized.substring(0, 47) + '...';
  }

  return sanitized || 'Untitled Conversation';
};

/**
 * Error types for validation errors
 */
export enum ValidationErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  TOO_LONG = 'TOO_LONG',
  TOO_SHORT = 'TOO_SHORT',
  FORBIDDEN_CONTENT = 'FORBIDDEN_CONTENT',
  INVALID_FORMAT = 'INVALID_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public readonly type: ValidationErrorType;
  public readonly field?: string;

  constructor(
    type: ValidationErrorType,
    message: string,
    field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    this.type = type;
    this.field = field;
  }
}

/**
 * Comprehensive validation result
 */
export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
  type?: ValidationErrorType;
  field?: string;
}

/**
 * Validates and sanitizes with comprehensive error reporting
 */
export const validateAndSanitize = (
  input: string,
  type: 'message' | 'title' | 'config' | 'general' = 'general'
): ValidationResult => {
  try {
    switch (type) {
      case 'message':
        if (!validateMessageInput(input)) {
          return {
            isValid: false,
            error: 'Message contains invalid content or exceeds length limits',
            type: ValidationErrorType.INVALID_INPUT,
            field: 'message'
          };
        }
        return {
          isValid: true,
          sanitized: sanitizeMessageContent(input)
        };

      case 'title':
        const titleValidation = validateConversationTitle(input);
        if (!titleValidation.isValid) {
          return {
            isValid: false,
            error: titleValidation.error,
            type: ValidationErrorType.INVALID_INPUT,
            field: 'title'
          };
        }
        return {
          isValid: true,
          sanitized: sanitizeConversationTitle(input)
        };

      case 'config':
        const configValidation = validateAdvisorConfig(input);
        return {
          isValid: configValidation.isValid,
          sanitized: configValidation.sanitized,
          error: configValidation.error,
          type: ValidationErrorType.INVALID_FORMAT,
          field: 'config'
        };

      case 'general':
      default:
        if (!validateMessageInput(input)) {
          return {
            isValid: false,
            error: 'Input contains invalid content',
            type: ValidationErrorType.INVALID_INPUT
          };
        }
        return {
          isValid: true,
          sanitized: sanitizeUserInput(input)
        };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Validation failed due to an unexpected error',
      type: ValidationErrorType.INVALID_FORMAT
    };
  }
};

// Middleware functions for API routes
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.errors.map(err => err.message).join(', ');
      return {
        success: false,
        error: `Validation failed: ${errorMessages}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON format'
    };
  }
}

export function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Additional security validation helpers
export const containsSuspiciousContent = (input: string): boolean => {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<\s*iframe/i,
    /<\s*object/i,
    /<\s*embed/i,
    /data:\s*text\/html/i,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// File validation helpers
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];