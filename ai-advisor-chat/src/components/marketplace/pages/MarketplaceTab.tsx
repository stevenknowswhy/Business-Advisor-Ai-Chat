"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import {
  SearchAndFilters,
  AdvisorGrid,
  FeaturedAdvisorsGrid,
  QuickFilters,
  SelectionManager
} from '../components';
import { TeamCreatorWithDesignSystem } from '~/components/advisors';
import { Button, Badge } from '../../ui';
import { useMarketplaceState } from '../hooks';
import { useTeamFilterOptions } from '@/hooks/useTeamInfo';
import { AdvisorProfileModal } from '../components/AdvisorProfileModal';
import { CreateAdvisorCTA } from '../wizard';
import type {
  MarketplaceAdvisor,
  MarketplaceFilters,
  AdvisorCardActions
} from '../types/marketplace';
import { type Id } from '../../../../convex/_generated/dataModel';

export interface MarketplaceTabProps {
  className?: string;
  onAdvisorSelect?: (advisor: MarketplaceAdvisor) => void;
  onAdvisorUnselect?: (advisor: MarketplaceAdvisor) => void;
  onAdvisorViewProfile?: (advisor: MarketplaceAdvisor) => void;
  onNavigateToMyAdvisors?: () => void;
  onStartChat?: (advisors: MarketplaceAdvisor[]) => void;
}

export const MarketplaceTab: React.FC<MarketplaceTabProps> = ({
  className,
  onAdvisorSelect,
  onAdvisorUnselect,
  onAdvisorViewProfile,
  onNavigateToMyAdvisors,
  onStartChat,
}) => {
  const handleAdvisorCreated = useCallback((advisor: any) => {
    // Refresh advisors list to include the newly created advisor
    // This will trigger a re-fetch of the marketplace data
    console.log('New advisor created:', advisor);
    // Could add a toast notification here
  }, []);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'all' | 'featured'>('all');
  const [selectedAdvisorForProfile, setSelectedAdvisorForProfile] = useState<Id<"advisors"> | null>(null);
  
  // Use the marketplace state hook
  const {
    advisors,
    selectedAdvisors,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    selectAdvisor,
    unselectAdvisor,
    search,
    clearSearch,
  } = useMarketplaceState();

  // Get team filter options
  const teamOptions = useTeamFilterOptions();

  // Create advisor card actions
  const advisorActions: AdvisorCardActions = {
    onSelect: async (advisor) => {
      try {
        await selectAdvisor(advisor._id);
        onAdvisorSelect?.(advisor);
      } catch (error: any) {
        console.error('Failed to select advisor:', error);

        // Check if it's an authentication error
        if (error?.message?.includes('sign in')) {
          // Redirect to sign-in page
          router.push('/sign-in');
        } else {
          // Handle other errors (could show a toast notification)
          console.error('Selection failed:', error?.message || 'Unknown error');
        }
      }
    },
    onUnselect: async (advisor) => {
      try {
        await unselectAdvisor(advisor._id);
        onAdvisorUnselect?.(advisor);
      } catch (error: any) {
        console.error('Failed to unselect advisor:', error);

        // Check if it's an authentication error
        if (error?.message?.includes('sign in')) {
          // Redirect to sign-in page
          router.push('/sign-in');
        } else {
          // Handle other errors (could show a toast notification)
          console.error('Unselection failed:', error?.message || 'Unknown error');
        }
      }
    },
    onViewProfile: (advisor) => {
      setSelectedAdvisorForProfile(advisor._id);
      onAdvisorViewProfile?.(advisor);
    },
  };

  // Filter advisors based on view mode
  const displayAdvisors = useMemo(() => {
    if (viewMode === 'featured') {
      return advisors.filter(advisor => advisor.featured);
    }
    return advisors;
  }, [advisors, viewMode]);

  // Get selected advisor IDs for highlighting
  const selectedAdvisorIds = selectedAdvisors.map(advisor => advisor._id);

  // Selection management
  const maxSelections = 10;
  const selectionLimitReached = selectedAdvisors.length >= maxSelections;

  const handleSelectionChange = useCallback((newSelection: MarketplaceAdvisor[]) => {
    // Update local selection state through the marketplace hook
    // This will be handled by the individual advisor selection callbacks
  }, []);

  const handleStartChat = useCallback((advisors: MarketplaceAdvisor[]) => {
    onStartChat?.(advisors);
  }, [onStartChat]);

  const handleClearSelection = useCallback(() => {
    // Clear all selections by unselecting each advisor
    selectedAdvisors.forEach(advisor => {
      unselectAdvisor(advisor._id);
    });
  }, [selectedAdvisors, unselectAdvisor]);

  // Calculate advisor counts for filters
  const advisorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      total: advisors.length,
      featured: advisors.filter(a => a.featured).length,
    };
    
    // Count by category
    advisors.forEach(advisor => {
      if (advisor.category) {
        counts[advisor.category] = (counts[advisor.category] || 0) + 1;
      }
    });
    
    return counts;
  }, [advisors]);

  // Search and filter actions
  const searchFilterActions = {
    onSearch: (query: string) => {
      if (query) {
        search(query, filters);
      } else {
        clearSearch();
      }
    },
    onFilterCategory: (category: string | undefined) => {
      updateFilters({ category });
    },
    onToggleFeatured: (featured: boolean | undefined) => {
      updateFilters({ featured });
    },
    onSortChange: (sortBy: "relevance" | "rating" | "experience" | "newest" | "name" | undefined) => {
      updateFilters({ sortBy });
    },
    onExperienceLevelChange: (experienceLevel: "entry" | "mid" | "senior" | "expert" | undefined) => {
      updateFilters({ experienceLevel });
    },
    onAvailabilityChange: (availability: "available" | "busy" | "offline" | undefined) => {
      updateFilters({ availability });
    },
    onFilterTeam: (teamId: string | undefined) => {
      updateFilters({ teamId });
    },
    onFilterTags: (tags: string[] | undefined) => {
      updateFilters({ tags });
    },
    onClearFilters: () => {
      clearFilters();
      clearSearch();
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advisor Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Discover and select expert advisors to join your advisory board
          </p>
        </div>
        
        {selectedAdvisors.length > 0 && (
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>{selectedAdvisors.length} selected</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToMyAdvisors}
            >
              View My Advisors
            </Button>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label={`All Advisors (${advisorCounts.total})`}
            title={`All Advisors (${advisorCounts.total})`}
          >
            All Advisors
          </button>
          <button
            type="button"
            onClick={() => setViewMode('featured')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1 ${
              viewMode === 'featured'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label={`Featured (${advisorCounts.featured})`}
            title={`Featured (${advisorCounts.featured})`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Featured</span>
          </button>
        </div>
      </div>

      {/* Create Advisor + Create Team CTAs + Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <SearchAndFilters
            filters={filters}
            actions={searchFilterActions}
            advisorCounts={advisorCounts}
            teamOptions={teamOptions}
            showAdvancedFilters={viewMode === 'all'}
          />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <CreateAdvisorCTA onAdvisorCreated={handleAdvisorCreated} />
          <TeamCreatorWithDesignSystem
            onAdvisorsCreated={() => router.push('/marketplace?tab=my-advisors')}
          />
        </div>
      </div>

      {/* Quick Filters (only for all advisors view) */}
      {viewMode === 'all' && (
        <QuickFilters
          onCategorySelect={(category) => updateFilters({ category: category || undefined })}
          selectedCategory={filters.category}
          advisorCounts={advisorCounts}
        />
      )}

      {/* Results Summary */}
      {!loading.advisors && displayAdvisors.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {displayAdvisors.length} advisor{displayAdvisors.length !== 1 ? 's' : ''} found
            {filters.category && ` in ${filters.category}`}
            {filters.searchQuery && ` matching "${filters.searchQuery}"`}
          </span>
          {selectedAdvisors.length > 0 && (
            <span>
              {selectedAdvisors.length} advisor{selectedAdvisors.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      )}

      {/* Advisor Grid */}
      {viewMode === 'featured' ? (
        <FeaturedAdvisorsGrid
          advisors={displayAdvisors}
          selectedAdvisorIds={selectedAdvisorIds}
          actions={advisorActions}
          loading={loading.advisors}
          error={error.advisors}
          variant="default"
          columns={3}
          selectionLimitReached={selectionLimitReached}
          emptyStateMessage="No featured advisors are currently available."
          emptyStateAction={{
            label: "View All Advisors",
            onClick: () => setViewMode('all')
          }}
        />
      ) : (
        <AdvisorGrid
          advisors={displayAdvisors}
          selectedAdvisorIds={selectedAdvisorIds}
          actions={advisorActions}
          loading={loading.advisors}
          error={error.advisors}
          variant="default"
          columns={3}
          selectionLimitReached={selectionLimitReached}
          emptyStateMessage={
            filters.searchQuery || filters.category
              ? "No advisors match your current search and filters."
              : "No advisors are currently available in the marketplace."
          }
          emptyStateAction={{
            label: "Clear Filters",
            onClick: searchFilterActions.onClearFilters
          }}
        />
      )}

      {/* Bottom CTA */}
      {selectedAdvisors.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to start chatting with your advisors?
          </h3>
          <p className="text-gray-600 mb-4">
            You've selected {selectedAdvisors.length} advisor{selectedAdvisors.length !== 1 ? 's' : ''}. 
            View and manage your selections or start a conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onNavigateToMyAdvisors}
            >
              Manage My Advisors
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // This would navigate to chat with selected advisors
                console.log('Navigate to chat');
              }}
            >
              Start Chatting
            </Button>
          </div>
        </div>
      )}

      {/* Advisor Profile Modal */}
      {selectedAdvisorForProfile && (
        <AdvisorProfileModal
          isOpen={!!selectedAdvisorForProfile}
          onClose={() => setSelectedAdvisorForProfile(null)}
          advisorId={selectedAdvisorForProfile}
          onSelect={async (advisor) => {
            try {
              await selectAdvisor(advisor._id);
              onAdvisorSelect?.(advisor);
            } catch (error: any) {
              console.error('Failed to select advisor:', error);
              if (error?.message?.includes('sign in')) {
                router.push('/sign-in');
              }
            }
          }}
          onUnselect={async (advisor) => {
            try {
              await unselectAdvisor(advisor._id);
              onAdvisorUnselect?.(advisor);
            } catch (error: any) {
              console.error('Failed to unselect advisor:', error);
              if (error?.message?.includes('sign in')) {
                router.push('/sign-in');
              }
            }
          }}
          isSelected={selectedAdvisorIds.includes(selectedAdvisorForProfile)}
        />
      )}
    </div>
  );
};
