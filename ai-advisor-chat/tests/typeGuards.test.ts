import {
  isMessage,
  isAdvisor,
  isConversation,
  isAdvisorFormData,
  isValidMessageRole,
  isUuid,
  isEmail,
  isUrl,
  isSafeHtml,
  assertType,
  safeCast,
} from '~/lib/typeGuards';
import type { Message, Advisor, Conversation, AdvisorFormData } from '~/types/chat';

describe('Type Guards', () => {
  describe('isMessage', () => {
    it('returns true for valid message objects', () => {
      const validMessage: Message = {
        id: '123',
        role: 'user',
        content: 'Hello world',
        createdAt: new Date(),
      };

      expect(isMessage(validMessage)).toBe(true);
    });

    it('returns false for invalid message objects', () => {
      expect(isMessage(null)).toBe(false);
      expect(isMessage(undefined)).toBe(false);
      expect(isMessage('string')).toBe(false);
      expect(isMessage(123)).toBe(false);
      expect(isMessage({})).toBe(false);
    });

    it('returns false for messages with missing required fields', () => {
      const invalidMessages = [
        { id: '123', role: 'user' }, // missing content
        { id: '123', content: 'hello' }, // missing role
        { role: 'user', content: 'hello' }, // missing id
        { id: 123, role: 'user', content: 'hello' }, // wrong id type
      ];

      invalidMessages.forEach(msg => {
        expect(isMessage(msg)).toBe(false);
      });
    });
  });

  describe('isAdvisor', () => {
    it('returns true for valid advisor objects', () => {
      const validAdvisor: Advisor = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        title: 'Financial Advisor',
        jsonConfiguration: '{}',
        createdAt: new Date(),
      };

      expect(isAdvisor(validAdvisor)).toBe(true);
    });

    it('returns false for invalid advisor objects', () => {
      expect(isAdvisor(null)).toBe(false);
      expect(isAdvisor({})).toBe(false);
      expect(isAdvisor({ id: '123' })).toBe(false);
    });
  });

  describe('isConversation', () => {
    it('returns true for valid conversation objects', () => {
      const validConversation: Conversation = {
        id: '123',
        title: 'Test Conversation',
        advisorId: '456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(isConversation(validConversation)).toBe(true);
    });

    it('returns false for invalid conversation objects', () => {
      expect(isConversation(null)).toBe(false);
      expect(isConversation({})).toBe(false);
    });
  });

  describe('isAdvisorFormData', () => {
    it('returns true for valid advisor form data', () => {
      const validData: AdvisorFormData = {
        firstName: 'John',
        lastName: 'Doe',
        title: 'Advisor',
        jsonConfiguration: '{}',
      };

      expect(isAdvisorFormData(validData)).toBe(true);
    });

    it('returns false for invalid advisor form data', () => {
      expect(isAdvisorFormData(null)).toBe(false);
      expect(isAdvisorFormData({})).toBe(false);
    });
  });

  describe('isValidMessageRole', () => {
    it('returns true for valid message roles', () => {
      expect(isValidMessageRole('user')).toBe(true);
      expect(isValidMessageRole('assistant')).toBe(true);
      expect(isValidMessageRole('system')).toBe(true);
    });

    it('returns false for invalid message roles', () => {
      expect(isValidMessageRole('admin')).toBe(false);
      expect(isValidMessageRole('bot')).toBe(false);
      expect(isValidMessageRole('')).toBe(false);
    });
  });

  describe('isUuid', () => {
    it('returns true for valid UUIDs', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('returns false for invalid UUIDs', () => {
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid('123-456-789')).toBe(false);
      expect(isUuid('')).toBe(false);
    });
  });

  describe('isEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('returns false for invalid email addresses', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('@domain.com')).toBe(false);
      expect(isEmail('test@')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('returns true for valid URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('http://localhost:3000')).toBe(true);
      expect(isUrl('ftp://example.com')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl('example')).toBe(false);
    });
  });

  describe('isSafeHtml', () => {
    it('returns true for safe HTML content', () => {
      expect(isSafeHtml('<p>Hello world</p>')).toBe(true);
      expect(isSafeHtml('<strong>Bold text</strong>')).toBe(true);
      expect(isSafeHtml('Plain text')).toBe(true);
    });

    it('returns false for dangerous HTML content', () => {
      expect(isSafeHtml('<script>alert("xss")</script>')).toBe(false);
      expect(isSafeHtml('javascript:alert("xss")')).toBe(false);
      expect(isSafeHtml('<img src="x" onerror="alert(\'xss\')">')).toBe(false);
    });
  });

  describe('assertType', () => {
    it('returns the object if type guard passes', () => {
      const validMessage: Message = {
        id: '123',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
      };

      expect(() => assertType(validMessage, isMessage)).not.toThrow();
      const result = assertType(validMessage, isMessage);
      expect(result).toBe(validMessage);
    });

    it('throws error if type guard fails', () => {
      expect(() => assertType('not a message', isMessage)).toThrow('Type assertion failed');
    });
  });

  describe('safeCast', () => {
    it('returns the object if type guard passes', () => {
      const validMessage: Message = {
        id: '123',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
      };

      const fallback: Message = {
        id: 'fallback',
        role: 'user',
        content: 'fallback',
        createdAt: new Date(),
      };

      const result = safeCast(validMessage, isMessage, fallback);
      expect(result).toBe(validMessage);
    });

    it('returns fallback if type guard fails', () => {
      const fallback: Message = {
        id: 'fallback',
        role: 'user',
        content: 'fallback',
        createdAt: new Date(),
      };

      const result = safeCast('not a message', isMessage, fallback);
      expect(result).toBe(fallback);
    });
  });
});