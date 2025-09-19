"use client";

import React from 'react';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AdvisorCard, AdvisorCardSkeleton } from './AdvisorCard';
import { Button, CenteredLoadingSpinner } from '../../ui';
import { LazyComponent, usePerformanceMonitor } from '../../common/Performance';
import type {
  MarketplaceAdvisor,
  AdvisorCardActions,
  MarketplaceComponentProps
} from '../types/marketplace';

export interface AdvisorGridProps extends MarketplaceComponentProps {
  advisors: MarketplaceAdvisor[];
  selectedAdvisorIds?: string[];
  actions: AdvisorCardActions;
  variant?: 'default' | 'compact' | 'detailed';
  columns?: 1 | 2 | 3 | 4;
  showCategory?: boolean;
  showFeatured?: boolean;
  selectionLimitReached?: boolean;
  emptyStateMessage?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
}

export const AdvisorGrid: React.FC<AdvisorGridProps> = ({
  advisors,
  selectedAdvisorIds = [],
  actions,
  variant = 'default',
  columns = 3,
  showCategory = true,
  showFeatured = true,
  selectionLimitReached = false,
  loading = false,
  error = null,
  className,
  emptyStateMessage,
  emptyStateAction,
}) => {
  // Performance monitoring
  usePerformanceMonitor('AdvisorGrid');

  // Grid column classes based on columns prop
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Memoize grid items to prevent unnecessary re-renders
  const gridItems = React.useMemo(() => {
    return advisors.map((advisor) => {
      const isSelected = selectedAdvisorIds.includes(advisor._id);

      return (
        <AdvisorCard
          key={advisor._id}
          advisor={advisor}
          isSelected={isSelected}
          actions={actions}
          variant={variant}
          showCategory={showCategory}
          showFeatured={showFeatured}
          selectionLimitReached={selectionLimitReached}
        />
      );
    });
  }, [advisors, selectedAdvisorIds, actions, variant, showCategory, showFeatured, selectionLimitReached]);

  // Loading state
  if (loading) {
    return (
      <div className={`grid gap-6 ${gridClasses[columns]} ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <AdvisorCardSkeleton key={index} variant={variant} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Advisors
        </h2>
        <p className="text-gray-600 text-center mb-4 max-w-md">
          {error}
        </p>
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (advisors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No Advisors Found
        </h2>
        <p className="text-gray-600 text-center mb-4 max-w-md">
          {emptyStateMessage || 
            "We couldn't find any advisors matching your criteria. Try adjusting your search or filters."}
        </p>
        {emptyStateAction && (
          <Button
            variant="primary"
            onClick={emptyStateAction.onClick}
          >
            {emptyStateAction.label}
          </Button>
        )}
      </div>
    );
  }

  // Main grid
  return (
    <LazyComponent>
      <div className={`grid gap-6 ${gridClasses[columns]} ${className}`}>
        {gridItems}
      </div>
    </LazyComponent>
  );
};

// Specialized grid components for different use cases

export const FeaturedAdvisorsGrid: React.FC<Omit<AdvisorGridProps, 'showFeatured'>> = (props) => (
  <AdvisorGrid
    {...props}
    showFeatured={false} // Don't show featured badge since all are featured
    emptyStateMessage="No featured advisors available at the moment."
  />
);

export const CategoryAdvisorsGrid: React.FC<AdvisorGridProps & { category: string }> = ({ 
  category, 
  ...props 
}) => (
  <AdvisorGrid
    {...props}
    showCategory={false} // Don't show category badge since all are same category
    emptyStateMessage={`No advisors found in the ${category} category.`}
  />
);

export const SelectedAdvisorsGrid: React.FC<Omit<AdvisorGridProps, 'selectedAdvisorIds'>> = (props) => (
  <AdvisorGrid
    {...props}
    selectedAdvisorIds={props.advisors.map(a => a._id)} // All are selected
    emptyStateMessage="You haven't selected any advisors yet. Browse the marketplace to add advisors to your team."
    emptyStateAction={{
      label: "Browse Marketplace",
      onClick: () => {
        // This would be handled by the parent component
        console.log("Navigate to marketplace");
      }
    }}
  />
);

// Grid with pagination support
export interface PaginatedAdvisorGridProps extends AdvisorGridProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export const PaginatedAdvisorGrid: React.FC<PaginatedAdvisorGridProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 12,
  totalItems = 0,
  ...gridProps
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-6">
      {/* Results summary */}
      {totalItems > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {startItem}-{endItem} of {totalItems} advisors
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Grid */}
      <AdvisorGrid {...gridProps} />

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          
          {/* Page numbers */}
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "primary" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Responsive grid that adjusts columns based on screen size and content
export const ResponsiveAdvisorGrid: React.FC<AdvisorGridProps> = (props) => {
  const getResponsiveColumns = (): AdvisorGridProps['columns'] => {
    if (props.variant === 'detailed') return 2;
    if (props.variant === 'compact') return 4;
    return 3; // default
  };

  return (
    <AdvisorGrid
      {...props}
      columns={getResponsiveColumns()}
    />
  );
};
