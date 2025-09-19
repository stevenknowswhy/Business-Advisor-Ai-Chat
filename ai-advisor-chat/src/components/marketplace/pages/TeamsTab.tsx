"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, UserGroupIcon, FunnelIcon } from '@heroicons/react/24/outline';
import {
  TeamGrid,
  TeamDeploymentModal,
  SearchAndFilters,
} from '../components';
import { Button, Badge } from '../../ui';
import { useMarketplaceState } from '../hooks/useMarketplace';
import { useTeamManagement } from '~/hooks/useTeamManagement';
import { useTeamFilterOptions } from '@/hooks/useTeamInfo';
import type { TeamTemplate } from '~/hooks/useTeamManagement';

export interface TeamsTabProps {
  className?: string;
  onTeamDeploy?: (team: TeamTemplate) => void;
  onNavigateToMyAdvisors?: () => void;
  userPlan?: 'free' | 'regular' | 'pro';
}

export const TeamsTab: React.FC<TeamsTabProps> = ({
  className,
  onTeamDeploy,
  onNavigateToMyAdvisors,
  userPlan = 'free',
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'all' | 'featured'>('all');
  const [selectedTeamForDeployment, setSelectedTeamForDeployment] = useState<TeamTemplate | null>(null);
  const [deployedTeamIds, setDeployedTeamIds] = useState<string[]>([]);

  // Use marketplace state for teams
  const {
    teamTemplates: teams,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
  } = useMarketplaceState();

  // Use team management for deployment
  const { deployedTeams } = useTeamManagement();

  // Get deployed team IDs
  React.useEffect(() => {
    if (deployedTeams) {
      setDeployedTeamIds(deployedTeams.map(team => team.teamId));
    }
  }, [deployedTeams]);

  // Get team filter options
  const teamOptions = useTeamFilterOptions();

  // Filter teams based on view mode
  const displayTeams = useMemo(() => {
    if (viewMode === 'featured') {
      return teams.filter(team => team.metadata?.featured);
    }
    return teams;
  }, [teams, viewMode]);

  // Calculate team counts for filters
  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {
      total: teams.length,
      featured: teams.filter(t => t.metadata?.featured).length,
    };

    // Count by category
    teams.forEach(team => {
      counts[team.category] = (counts[team.category] || 0) + 1;
    });

    return counts;
  }, [teams]);

  // Team deployment handler
  const handleDeployTeam = useCallback(async (team: TeamTemplate) => {
    try {
      setSelectedTeamForDeployment(team);
    } catch (error: any) {
      console.error('Failed to prepare team deployment:', error);
    }
  }, []);

  // Deployment complete handler
  const handleDeploymentComplete = useCallback((deploymentId: string) => {
    onTeamDeploy?.(selectedTeamForDeployment!);
    console.log('Team deployed successfully:', deploymentId);
    // Optionally navigate to the deployed team
    // router.push(`/chat?team=${deploymentId}`);
  }, [onTeamDeploy, selectedTeamForDeployment, router]);

  // Filter actions
  const filterActions = {
    onSearch: (query: string) => {
      updateFilters({ searchQuery: query });
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
    onExperienceLevelChange: (level: "entry" | "mid" | "senior" | "expert" | undefined) => {
      updateFilters({ experienceLevel: level });
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
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advisor Teams</h1>
          <p className="text-gray-600 mt-1">
            Discover and deploy pre-configured teams of expert advisors
          </p>
        </div>

        {deployedTeamIds.length > 0 && (
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>{deployedTeamIds.length} deployed</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToMyAdvisors}
            >
              View My Teams
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
            aria-label={`All Teams (${teamCounts.total})`}
            title={`All Teams (${teamCounts.total})`}
          >
            All Teams
          </button>
          <button
            type="button"
            onClick={() => setViewMode('featured')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1 ${
              viewMode === 'featured'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label={`Featured (${teamCounts.featured})`}
            title={`Featured (${teamCounts.featured})`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Featured</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        filters={filters}
        actions={filterActions}
        teamOptions={teamOptions}
        showAdvancedFilters={viewMode === 'all'}
      />

      {/* Results Summary */}
      {!loading.teamTemplates && displayTeams.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {displayTeams.length} team{displayTeams.length !== 1 ? 's' : ''} found
            {filters.category && ` in ${filters.category}`}
          </span>
          {deployedTeamIds.length > 0 && (
            <span>
              {deployedTeamIds.length} team{deployedTeamIds.length !== 1 ? 's' : ''} deployed
            </span>
          )}
        </div>
      )}

      {/* Team Grid */}
      {viewMode === 'featured' ? (
        <TeamGrid
          teams={displayTeams}
          deployedTeamIds={deployedTeamIds}
          loading={loading.teamTemplates}
          error={error.teamTemplates}
          columns={2}
          onDeploy={handleDeployTeam}
          userPlan={userPlan}
          emptyStateMessage="No featured teams are currently available."
          emptyStateAction={{
            label: "View All Teams",
            onClick: () => setViewMode('all')
          }}
        />
      ) : (
        <TeamGrid
          teams={displayTeams}
          deployedTeamIds={deployedTeamIds}
          loading={loading.teamTemplates}
          error={error.teamTemplates}
          columns={2}
          onDeploy={handleDeployTeam}
          userPlan={userPlan}
          emptyStateMessage={
            filters.category
              ? "No teams match your current filters."
              : "No teams are currently available in the marketplace."
          }
          emptyStateAction={{
            label: "Clear Filters",
            onClick: filterActions.onClearFilters
          }}
        />
      )}

      {/* Bottom CTA */}
      {deployedTeamIds.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to work with your deployed teams?
          </h3>
          <p className="text-gray-600 mb-4">
            You have {deployedTeamIds.length} team{deployedTeamIds.length !== 1 ? 's' : ''} deployed.
            Start conversations or manage your team settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onNavigateToMyAdvisors}
            >
              Manage My Teams
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Navigate to chat with teams
                console.log('Navigate to team chat');
              }}
            >
              Start Chatting
            </Button>
          </div>
        </div>
      )}

      {/* Team Deployment Modal */}
      {selectedTeamForDeployment && (
        <TeamDeploymentModal
          isOpen={!!selectedTeamForDeployment}
          onClose={() => setSelectedTeamForDeployment(null)}
          team={selectedTeamForDeployment}
          userPlan={userPlan}
          onDeploymentComplete={handleDeploymentComplete}
        />
      )}
    </div>
  );
};