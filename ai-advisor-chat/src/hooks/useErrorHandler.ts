import { useState, useCallback } from 'react';

/**
 * Error type definitions for better error handling
 */
export interface AppError {
  type: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
}

/**
 * Custom hook for centralized error handling
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback((error: unknown, context?: string): AppError => {
    console.error('Error occurred:', { error, context });

    const appError: AppError = {
      type: 'unknown',
      message: 'An unexpected error occurred',
      timestamp: new Date(),
    };

    if (error instanceof Error) {
      // Network errors
      if (
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Unable to connect')
      ) {
        appError.type = 'network';
        appError.message = 'Connection error. Please check your internet connection and try again.';
        appError.code = 'NETWORK_ERROR';
      }
      // Authentication errors
      else if (
        error.message.includes('authentication') ||
        error.message.includes('unauthorized') ||
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('sign in') ||
        error.message.includes('login')
      ) {
        appError.type = 'authentication';
        appError.message = 'Please sign in to continue.';
        appError.code = 'AUTH_ERROR';
      }
      // Validation errors
      else if (
        error.message.includes('validation') ||
        error.message.includes('invalid') ||
        error.message.includes('required') ||
        error.message.includes('format') ||
        error.message.includes('400')
      ) {
        appError.type = 'validation';
        appError.message = 'Invalid input. Please check your data and try again.';
        appError.code = 'VALIDATION_ERROR';
      }
      // Server errors
      else if (
        error.message.includes('server') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504') ||
        error.message.includes('Service unavailable')
      ) {
        appError.type = 'server';
        appError.message = 'Server error. Please try again later.';
        appError.code = 'SERVER_ERROR';
      }
      // Timeout errors
      else if (
        error.message.includes('timeout') ||
        error.message.includes('timed out') ||
        error.name === 'TimeoutError'
      ) {
        appError.type = 'network';
        appError.message = 'Request timed out. Please try again.';
        appError.code = 'TIMEOUT_ERROR';
      }
      // Generic error with original message
      else {
        appError.message = error.message;
        appError.code = 'UNKNOWN_ERROR';
      }

      appError.details = {
        stack: error.stack,
        name: error.name,
        context,
      };
    }

    // Handle non-Error objects
    else if (typeof error === 'string') {
      appError.message = error;
      appError.code = 'STRING_ERROR';
      appError.details = { context };
    }
    else if (error && typeof error === 'object') {
      appError.message = 'An error occurred';
      appError.code = 'OBJECT_ERROR';
      appError.details = { error, context };
    }

    setError(appError);
    return appError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createErrorHandler = useCallback((context: string) => {
    return (error: unknown) => handleError(error, context);
  }, [handleError]);

  // Auto-clear error after timeout
  const autoClearError = useCallback((timeout: number = 5000) => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return {
    error,
    handleError,
    clearError,
    createErrorHandler,
    autoClearError,
  };
};

export type UseErrorHandlerReturn = ReturnType<typeof useErrorHandler>;