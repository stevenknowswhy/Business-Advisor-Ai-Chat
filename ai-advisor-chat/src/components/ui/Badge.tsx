"use client";

import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors';
    
    const variants = {
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      secondary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      success: 'bg-green-100 text-green-800 hover:bg-green-200',
      warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      danger: 'bg-red-100 text-red-800 hover:bg-red-200',
      info: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    return (
      <span
        className={clsx(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Category-specific badge variants for marketplace
export const CategoryBadge = React.forwardRef<HTMLSpanElement, Omit<BadgeProps, 'variant' | 'children'> & { category: string }>(
  ({ category, className, ...props }, ref) => {
    const getCategoryVariant = (cat: string): BadgeProps['variant'] => {
      switch (cat.toLowerCase()) {
        case 'business':
          return 'secondary';
        case 'marketing':
          return 'success';
        case 'technical':
          return 'info';
        case 'finance':
          return 'warning';
        case 'product':
          return 'default';
        case 'sales':
          return 'danger';
        default:
          return 'default';
      }
    };

    return (
      <Badge
        variant={getCategoryVariant(category)}
        className={className}
        ref={ref}
        {...props}
      >
        {category}
      </Badge>
    );
  }
);

CategoryBadge.displayName = 'CategoryBadge';

// Featured badge for highlighting special advisors
export const FeaturedBadge = React.forwardRef<HTMLSpanElement, Omit<BadgeProps, 'variant' | 'children'>>(
  ({ className, ...props }, ref) => (
    <Badge
      variant="warning"
      size="sm"
      className={clsx('bg-yellow-400 text-yellow-900 hover:bg-yellow-500', className)}
      ref={ref}
      {...props}
    >
      ⭐ Featured
    </Badge>
  )
);

FeaturedBadge.displayName = 'FeaturedBadge';
