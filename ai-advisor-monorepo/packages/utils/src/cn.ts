import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to merge class names with clsx
 * This is commonly used in component libraries for conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
