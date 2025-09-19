import React from 'react';

interface AccessibleLoadingSpinnerProps {
  /**
   * Loading message to display and announce to screen readers
   */
  message?: string;
  /**
   * Size of the spinner (small, medium, large)
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Color of the spinner
   */
  color?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the loading text
   */
  showText?: boolean;
  /**
   * Whether the loading state is for a specific region
   */
  region?: string;
}

/**
 * Accessible loading spinner component that properly announces loading states to screen readers
 * and provides visual feedback while content is loading.
 */
export const AccessibleLoadingSpinner: React.FC<AccessibleLoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
  color = 'blue',
  className = '',
  showText = true,
  region = 'content'
}) => {
  // Size classes
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  // Color classes
  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600',
    purple: 'border-purple-600'
  };

  const spinnerSize = sizeClasses[size];
  const spinnerColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  // Generate a unique ID for aria-labelledby
  const loadingId = `loading-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-labelledby={loadingId}
    >
      {/* Visually hidden announcement for screen readers */}
      <span id={loadingId} className="sr-only">
        {message} {region && `for ${region}`}
      </span>

      {/* Visual spinner */}
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 ${spinnerColor} ${spinnerSize}`}
        style={{
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent'
        }}
        aria-hidden="true"
      />

      {/* Optional loading text */}
      {showText && (
        <p className="mt-3 text-sm text-gray-600" aria-hidden="true">
          {message}
        </p>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  isVisible: boolean;
  /**
   * Loading message
   */
  message?: string;
  /**
   * Background color
   */
  backgroundColor?: 'white' | 'gray' | 'transparent';
  /**
   * Click handler for overlay (e.g., to close)
   */
  onClick?: () => void;
  /**
   * Whether the overlay can be dismissed
   */
  isDismissible?: boolean;
}

/**
 * Loading overlay that covers the entire screen or a container
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  backgroundColor = 'white',
  onClick,
  isDismissible = false
}) => {
  if (!isVisible) return null;

  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent'
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${bgClasses[backgroundColor]} ${
        isDismissible ? 'cursor-pointer' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
      onClick={isDismissible ? onClick : undefined}
      onKeyDown={(e) => {
        if (isDismissible && (e.key === 'Escape' || e.key === 'Enter')) {
          onClick?.();
        }
      }}
    >
      <div className="text-center">
        <AccessibleLoadingSpinner message={message} size="large" />
        {isDismissible && (
          <p className="mt-4 text-sm text-gray-500">
            Press Escape or click to dismiss
          </p>
        )}
      </div>
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the button is in loading state
   */
  isLoading: boolean;
  /**
   * Loading text to show when loading
   */
  loadingText?: string;
  /**
   * Children to show when not loading
   */
  children: React.ReactNode;
  /**
   * Spinner size
   */
  spinnerSize?: 'small' | 'medium';
}

/**
 * Accessible loading button that shows a spinner and disabled state during loading
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText = 'Loading...',
  children,
  spinnerSize = 'small',
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <AccessibleLoadingSpinner
          message=""
          size={spinnerSize}
          showText={false}
          className="mr-2"
        />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
};

interface LoadingSkeletonProps {
  /**
   * Number of skeleton lines to show
   */
  lines?: number;
  /**
   * Height of each line
   */
  height?: string;
  /**
   * Whether to animate the skeleton
   */
  animate?: boolean;
  /**
   * Width of the last line (shorter for variety)
   */
  lastLineWidth?: string;
}

/**
 * Accessible skeleton loading component for content placeholders
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  height = '1rem',
  animate = true,
  lastLineWidth = '60%'
}) => {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={`rounded ${animate ? 'animate-pulse' : ''} bg-gray-200`}
          style={{
            height,
            width: index === lines - 1 ? lastLineWidth : '100%'
          }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

export default AccessibleLoadingSpinner;