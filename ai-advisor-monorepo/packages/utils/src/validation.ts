import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * URL validation schema
 */
export const urlSchema = z.string().url('Invalid URL');

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    urlSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}
