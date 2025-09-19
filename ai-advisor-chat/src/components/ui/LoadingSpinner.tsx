"use client";

import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading...'
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <div className={clsx('inline-flex items-center', className)} role="status" aria-label={label}>
      <svg
        className={clsx('animate-spin', sizes[size], colors[color])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Centered loading spinner for full-page or container loading
export const CenteredLoadingSpinner: React.FC<LoadingSpinnerProps & { 
  message?: string;
  fullHeight?: boolean;
}> = ({ 
  message = 'Loading...',
  fullHeight = false,
  ...spinnerProps 
}) => {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center space-y-2',
      fullHeight ? 'h-screen' : 'h-64'
    )}>
      <LoadingSpinner {...spinnerProps} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

// Inline loading spinner for buttons and small spaces
export const InlineLoadingSpinner: React.FC<Omit<LoadingSpinnerProps, 'size'> & {
  text?: string;
}> = ({ 
  text = 'Loading...',
  className,
  ...spinnerProps 
}) => {
  return (
    <span className={clsx('inline-flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" {...spinnerProps} />
      {text && <span className="text-sm">{text}</span>}
    </span>
  );
};

// Loading overlay for covering content during loading
export const LoadingOverlay: React.FC<LoadingSpinnerProps & {
  message?: string;
  transparent?: boolean;
}> = ({ 
  message = 'Loading...',
  transparent = false,
  ...spinnerProps 
}) => {
  return (
    <div className={clsx(
      'absolute inset-0 flex flex-col items-center justify-center space-y-2 z-50',
      transparent ? 'bg-white/70' : 'bg-white'
    )}>
      <LoadingSpinner {...spinnerProps} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

// Skeleton loading component for content placeholders
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ 
  lines = 3,
  className 
}) => {
  return (
    <div className={clsx('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'h-4 bg-gray-200 rounded',
            index === lines - 1 && 'w-3/4' // Last line is shorter
          )}
        />
      ))}
    </div>
  );
};

// Card skeleton for advisor cards
export const AdvisorCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('animate-pulse p-4 border border-gray-200 rounded-lg', className)}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="mt-4 flex space-x-2">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  );
};
