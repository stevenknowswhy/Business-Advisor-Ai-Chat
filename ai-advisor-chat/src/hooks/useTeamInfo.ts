'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TeamInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  advisorCount: number;
  featured: boolean;
  tags: string[];
}

export interface TeamInfoSummary {
  totalTeams: number;
  featuredTeams: number;
  totalAdvisors: number;
  categories: string[];
}

export interface UseTeamInfoReturn {
  teams: TeamInfo[];
  loading: boolean;
  error: string | null;
  summary: TeamInfoSummary | null;
  refetch: () => void;
  getTeamById: (teamId: string) => TeamInfo | undefined;
  getTeamsByCategory: (category: string) => TeamInfo[];
  getFeaturedTeams: () => TeamInfo[];
}

export function useTeamInfo(): UseTeamInfoReturn {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TeamInfoSummary | null>(null);

  const fetchTeamInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teams/info?includeAdvisors=true');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTeams(data.data.teams);
        setSummary(data.data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch team information');
      }
    } catch (error) {
      console.error('Error fetching team information:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch team information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamInfo();
  }, [fetchTeamInfo]);

  const getTeamById = useCallback((teamId: string): TeamInfo | undefined => {
    return teams.find(team => team.id === teamId);
  }, [teams]);

  const getTeamsByCategory = useCallback((category: string): TeamInfo[] => {
    return teams.filter(team => team.category.toLowerCase() === category.toLowerCase());
  }, [teams]);

  const getFeaturedTeams = useCallback((): TeamInfo[] => {
    return teams.filter(team => team.featured);
  }, [teams]);

  return {
    teams,
    loading,
    error,
    summary,
    refetch: fetchTeamInfo,
    getTeamById,
    getTeamsByCategory,
    getFeaturedTeams,
  };
}

// Hook for getting team options for filtering
export interface TeamFilterOption {
  id: string;
  name: string;
  count: number;
}

export function useTeamFilterOptions(): TeamFilterOption[] {
  const { teams } = useTeamInfo();

  return teams.map(team => ({
    id: team.id,
    name: team.name,
    count: team.advisorCount,
  }));
}

// Hook for getting advisor counts by team
export function useAdvisorCountsByTeam(): Record<string, number> {
  const { teams } = useTeamInfo();

  return teams.reduce((acc, team) => {
    acc[team.id] = team.advisorCount;
    return acc;
  }, {} as Record<string, number>);
}