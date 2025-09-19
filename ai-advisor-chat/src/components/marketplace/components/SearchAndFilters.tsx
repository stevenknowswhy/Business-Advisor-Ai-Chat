"use client";

import React, { useState, useCallback } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { 
  SearchInput, 
  FilterDropdown, 
  Button, 
  Badge,
  type FilterOption 
} from '../../ui';
import {
  ADVISOR_CATEGORIES,
  type MarketplaceFilters,
  type SearchFilterActions,
  type TeamAffiliation
} from '../types/marketplace';

export interface SearchAndFiltersProps {
  filters: MarketplaceFilters;
  actions: SearchFilterActions;
  advisorCounts?: Record<string, number>;
  teamOptions?: Array<{ id: string; name: string; count: number }>;
  className?: string;
  showAdvancedFilters?: boolean;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  filters,
  actions,
  advisorCounts = {},
  teamOptions = [],
  className,
  showAdvancedFilters = true,
  sortBy,
  onSortChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    onSearch,
    onFilterCategory,
    onToggleFeatured,
    onFilterTeam,
    onFilterTags,
    onClearFilters
  } = actions;

  // Create category options with counts
  const categoryOptions: FilterOption[] = Object.entries(ADVISOR_CATEGORIES).map(
    ([key, category]) => ({
      value: key,
      label: category.label,
      count: advisorCounts[key] || 0,
    })
  );

  // Featured filter options
  const featuredOptions: FilterOption[] = [
    { value: 'true', label: 'Featured Only', count: advisorCounts.featured || 0 },
    { value: 'false', label: 'All Advisors', count: advisorCounts.total || 0 },
  ];

  // Sort options
  const sortOptions: FilterOption[] = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'experience', label: 'Most Experienced' },
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name A-Z' },
  ];

  // Experience level options
  const experienceOptions: FilterOption[] = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior (6-10 years)' },
    { value: 'expert', label: 'Expert (11+ years)' },
  ];

  // Availability options
  const availabilityOptions: FilterOption[] = [
    { value: 'available', label: 'Available Now' },
    { value: 'busy', label: 'Busy' },
    { value: 'offline', label: 'Offline' },
  ];

  // Team options
  const teamFilterOptions: FilterOption[] = teamOptions.map(team => ({
    value: team.id,
    label: team.name,
    count: team.count
  }));

  // Popular tags options
  const popularTags = [
    'startup', 'entrepreneurship', 'strategy', 'finance', 'marketing',
    'technology', 'product', 'operations', 'investment', 'branding'
  ];
  const tagOptions: FilterOption[] = popularTags.map(tag => ({
    value: tag,
    label: tag.charAt(0).toUpperCase() + tag.slice(1)
  }));

  const handleSearchChange = useCallback((value: string) => {
    onSearch(value);
  }, [onSearch]);

  const handleCategoryChange = useCallback((value: string | undefined) => {
    onFilterCategory(value);
  }, [onFilterCategory]);

  const handleFeaturedChange = useCallback((value: string | undefined) => {
    const featured = value === 'true' ? true : value === 'false' ? false : undefined;
    onToggleFeatured(featured);
  }, [onToggleFeatured]);

  const handleSortChange = useCallback((value: string | undefined) => {
    onSortChange?.(value || 'relevance');
  }, [onSortChange]);

  const handleTeamChange = useCallback((value: string | undefined) => {
    onFilterTeam?.(value);
  }, [onFilterTeam]);

  const handleTagsChange = useCallback((values: string[] | undefined) => {
    onFilterTags?.(values);
  }, [onFilterTags]);

  const handleClearFilters = useCallback(() => {
    onClearFilters();
    setShowFilters(false);
  }, [onClearFilters]);

  // Count active filters
  const activeFilterCount = [
    filters.category,
    filters.featured !== undefined ? 'featured' : null,
    filters.searchQuery,
    filters.teamId,
    ...(filters.tags || []),
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <SearchInput
            value={filters.searchQuery || ''}
            onChange={handleSearchChange}
            placeholder="Search advisors by name, expertise, or specialty..."
            size="md"
            fullWidth
          />
        </div>
        
        {showAdvancedFilters && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative ${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
            aria-label="Toggle filters"
            title="Toggle filters"
          >
            <FunnelIcon className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.category && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Category: {ADVISOR_CATEGORIES[filters.category as keyof typeof ADVISOR_CATEGORIES]?.label}</span>
              <button
                onClick={() => handleCategoryChange(undefined)}
                className="ml-1 hover:text-red-600"
                aria-label="Remove category filter"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {filters.featured !== undefined && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>{filters.featured ? 'Featured Only' : 'All Advisors'}</span>
              <button
                onClick={() => handleFeaturedChange(undefined)}
                className="ml-1 hover:text-red-600"
                aria-label="Remove featured filter"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {filters.searchQuery && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Search: "{filters.searchQuery}"</span>
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:text-red-600"
                aria-label="Clear search"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.teamId && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Team: {teamOptions.find(t => t.id === filters.teamId)?.name || filters.teamId}</span>
              <button
                onClick={() => handleTeamChange(undefined)}
                className="ml-1 hover:text-red-600"
                aria-label="Remove team filter"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.tags && filters.tags.length > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Tags: {filters.tags.join(', ')}</span>
              <button
                onClick={() => handleTagsChange(undefined)}
                className="ml-1 hover:text-red-600"
                aria-label="Remove tags filter"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-red-600 hover:text-red-700"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filter Options</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              value={filters.category}
              onChange={handleCategoryChange}
              placeholder="All categories"
              clearable
            />

            {/* Featured Filter */}
            <FilterDropdown
              label="Featured Status"
              options={featuredOptions}
              value={filters.featured?.toString()}
              onChange={handleFeaturedChange}
              placeholder="All advisors"
              clearable
            />

            {/* Sort Options */}
            <FilterDropdown
              label="Sort By"
              options={sortOptions}
              value={filters.sortBy}
              onChange={handleSortChange}
              placeholder="Most Relevant"
              clearable
            />

            {/* Experience Level Filter */}
            <FilterDropdown
              label="Experience Level"
              options={experienceOptions}
              value={filters.experienceLevel}
              onChange={(value) => {
                // You'll need to add this to the SearchFilterActions interface
                // For now, we'll handle it locally
              }}
              placeholder="Any experience"
              clearable
            />

            {/* Availability Filter */}
            <FilterDropdown
              label="Availability"
              options={availabilityOptions}
              value={filters.availability}
              onChange={(value) => {
                // You'll need to add this to the SearchFilterActions interface
                // For now, we'll handle it locally
              }}
              placeholder="Any availability"
              clearable
            />

            {/* Team Filter */}
            <FilterDropdown
              label="Team"
              options={teamFilterOptions}
              value={filters.teamId}
              onChange={handleTeamChange}
              placeholder="All teams"
              clearable
            />

            {/* Tags Filter */}
            <FilterDropdown
              label="Tags"
              options={tagOptions}
              value={filters.tags?.[0]} // Simple implementation for now
              onChange={(value) => {
                if (value) {
                  handleTagsChange([value]);
                } else {
                  handleTagsChange(undefined);
                }
              }}
              placeholder="Any tags"
              clearable
            />
          </div>
          
          {/* Filter Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
              >
                Clear All
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick filter buttons for common categories
export const QuickFilters: React.FC<{
  onCategorySelect: (category: string) => void;
  selectedCategory?: string;
  advisorCounts?: Record<string, number>;
}> = ({ onCategorySelect, selectedCategory, advisorCounts = {} }) => {
  const popularCategories = ['business', 'marketing', 'technical', 'product'];
  
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-gray-600 self-center">Quick filters:</span>
      {popularCategories.map((category) => {
        const categoryInfo = ADVISOR_CATEGORIES[category as keyof typeof ADVISOR_CATEGORIES];
        const count = advisorCounts[category] || 0;
        const isSelected = selectedCategory === category;
        
        return (
          <Button
            key={category}
            variant={isSelected ? "primary" : "outline"}
            size="sm"
            onClick={() => onCategorySelect(isSelected ? '' : category)}
            disabled={count === 0}
            className="flex items-center space-x-1"
          >
            <span>{categoryInfo.label}</span>
            {count > 0 && (
              <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                ({count})
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

// Search suggestions component
export const SearchSuggestions: React.FC<{
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}> = ({ suggestions, onSuggestionClick, className }) => {
  if (suggestions.length === 0) return null;
  
  return (
    <div className={`bg-white border border-gray-200 rounded-md shadow-sm ${className}`}>
      <div className="p-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Suggestions</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
