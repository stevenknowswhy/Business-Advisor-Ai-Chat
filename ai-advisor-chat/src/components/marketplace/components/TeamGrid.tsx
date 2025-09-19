"use client";

import React from 'react';
import { ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { TeamCard, TeamCardSkeleton } from './TeamCard';
import { Button, CenteredLoadingSpinner } from '../../ui';
import { LazyComponent, usePerformanceMonitor } from '../../common/Performance';
import type { TeamTemplate } from '~/hooks/useTeamManagement';

export interface TeamGridProps {
  teams: TeamTemplate[];
  deployedTeamIds?: string[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  columns?: 1 | 2 | 3;
  showFeatured?: boolean;
  onDeploy?: (team: TeamTemplate) => void;
  onViewDetails?: (team: TeamTemplate) => void;
  emptyStateMessage?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
  userPlan?: 'free' | 'regular' | 'pro';
}

export const TeamGrid: React.FC<TeamGridProps> = ({
  teams,
  deployedTeamIds = [],
  loading = false,
  error = null,
  className,
  columns = 2,
  showFeatured = true,
  onDeploy,
  onViewDetails,
  emptyStateMessage,
  emptyStateAction,
  userPlan = 'free',
}) => {
  // Performance monitoring
  usePerformanceMonitor('TeamGrid');

  // Grid column classes based on columns prop
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  // Filter teams based on featured setting
  const displayTeams = React.useMemo(() => {
    if (showFeatured) {
      return teams;
    }
    return teams.filter(team => team.metadata.featured);
  }, [teams, showFeatured]);

  // Memoize grid items to prevent unnecessary re-renders
  const gridItems = React.useMemo(() => {
    return displayTeams.map((team) => {
      const isDeployed = deployedTeamIds.includes(team.teamId);

      return (
        <TeamCard
          key={team.teamId}
          team={team}
          isDeployed={isDeployed}
          onDeploy={onDeploy}
          onViewDetails={onViewDetails}
          userPlan={userPlan}
        />
      );
    });
  }, [displayTeams, deployedTeamIds, onDeploy, onViewDetails, userPlan]);

  // Loading state
  if (loading) {
    return (
      <div className={`grid gap-6 ${gridClasses[columns]} ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <TeamCardSkeleton key={index} />
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
          Unable to Load Teams
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
  if (displayTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <UserGroupIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No Teams Found
        </h2>
        <p className="text-gray-600 text-center mb-4 max-w-md">
          {emptyStateMessage ||
            "We couldn't find any teams matching your criteria. Try adjusting your filters."}
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

export const FeaturedTeamsGrid: React.FC<Omit<TeamGridProps, 'showFeatured'>> = (props) => (
  <TeamGrid
    {...props}
    showFeatured={false} // Only show featured teams
    emptyStateMessage="No featured teams are currently available."
    columns={2}
  />
);

export const CategoryTeamsGrid: React.FC<TeamGridProps & { category: string }> = ({
  category,
  ...props
}) => (
  <TeamGrid
    {...props}
    emptyStateMessage={`No teams found in the ${category} category.`}
    columns={2}
  />
);

export const DeployedTeamsGrid: React.FC<Omit<TeamGridProps, 'deployedTeamIds'>> = (props) => {
  // This would fetch deployed teams and pass them as deployedTeamIds
  return (
    <TeamGrid
      {...props}
      emptyStateMessage="You haven't deployed any teams yet. Browse the marketplace to find the perfect team for your needs."
      emptyStateAction={{
        label: "Browse Teams",
        onClick: () => {
          // Navigate to teams marketplace
          console.log("Navigate to teams marketplace");
        }
      }}
      columns={1}
    />
  );
};

// Grid with pagination support
export interface PaginatedTeamGridProps extends TeamGridProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export const PaginatedTeamGrid: React.FC<PaginatedTeamGridProps> = ({
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
            Showing {startItem}-{endItem} of {totalItems} teams
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Grid */}
      <TeamGrid {...gridProps} />

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
export const ResponsiveTeamGrid: React.FC<TeamGridProps> = (props) => {
  const getResponsiveColumns = (): TeamGridProps['columns'] => {
    return 2; // default
  };

  return (
    <TeamGrid
      {...props}
      columns={getResponsiveColumns()}
    />
  );
};