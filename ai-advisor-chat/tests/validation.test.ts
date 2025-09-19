import {
  validateMessageInput,
  sanitizeHtml,
  sanitizeMessageContent,
  validateAdvisorConfig,
  validateImageUpload,
  validateAndSanitize,
  ValidationErrorType,
} from '~/lib/validation';

describe('Validation Utilities', () => {
  describe('validateMessageInput', () => {
    it('accepts valid messages', () => {
      expect(validateMessageInput('Hello world')).toBe(true);
      expect(validateMessageInput('A'.repeat(10000))).toBe(true);
      expect(validateMessageInput('123!@#$%^&*()')).toBe(true);
    });

    it('rejects messages with scripts', () => {
      expect(validateMessageInput('<script>alert("xss")</script>')).toBe(false);
      expect(validateMessageInput('javascript:alert("xss")')).toBe(false);
      expect(validateMessageInput('onclick=alert("xss")')).toBe(false);
      expect(validateMessageInput('<iframe src="evil.com"></iframe>')).toBe(false);
    });

    it('rejects messages that are too long or short', () => {
      expect(validateMessageInput('')).toBe(false);
      expect(validateMessageInput('A'.repeat(10001))).toBe(false);
    });

    it('rejects messages with dangerous Unicode characters', () => {
      expect(validateMessageInput('Hello\u0000World')).toBe(false);
      expect(validateMessageInput('Hello\u2028World')).toBe(false);
    });
  });

  describe('sanitizeHtml', () => {
    it('escapes HTML entities correctly', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(sanitizeHtml('Hello & world')).toBe('Hello &amp; world');
      expect(sanitizeHtml('Hello "world"')).toBe('Hello &quot;world&quot;');
    });
  });

  describe('sanitizeMessageContent', () => {
    it('sanitizes message content properly', () => {
      expect(sanitizeMessageContent('  Hello  world  ')).toBe('Hello world');
      expect(sanitizeMessageContent('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(sanitizeMessageContent('')).toBe('');
    });
  });

  describe('validateAdvisorConfig', () => {
    it('validates correct JSON configuration', () => {
      const validConfig = JSON.stringify({
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      });

      const result = validateAdvisorConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('rejects invalid JSON', () => {
      const result = validateAdvisorConfig('invalid json');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid JSON format');
    });

    it('rejects configurations with dangerous properties', () => {
      const dangerousConfig = JSON.stringify({
        __proto__: { evil: true },
        model: 'gpt-4',
      });

      const result = validateAdvisorConfig(dangerousConfig);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dangerous properties');
    });
  });

  describe('validateImageUpload', () => {
    it('accepts valid image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageUpload(validFile);
      expect(result.isValid).toBe(true);
    });

    it('rejects files that are too large', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImageUpload(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('rejects invalid file types', () => {
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/octet-stream' });
      const result = validateImageUpload(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Only JPEG, PNG, GIF');
    });
  });

  describe('validateAndSanitize', () => {
    it('validates and sanitizes message input', () => {
      const result = validateAndSanitize('Hello <script>alert("xss")</script>', 'message');
      expect(result.isValid).toBe(false);
      expect(result.type).toBe(ValidationErrorType.INVALID_INPUT);
      expect(result.field).toBe('message');
    });

    it('validates and sanitizes title input', () => {
      const result = validateAndSanitize('Valid Title', 'title');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Valid Title');
    });

    it('handles empty input', () => {
      const result = validateAndSanitize('', 'message');
      expect(result.isValid).toBe(false);
      expect(result.type).toBe(ValidationErrorType.INVALID_INPUT);
    });
  });
});