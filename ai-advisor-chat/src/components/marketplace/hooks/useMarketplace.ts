"use client";

import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  type MarketplaceAdvisor,
  type TeamTemplate,
  type MarketplaceFilters,
  type SelectionResult,
  type TeamSelectionResult,
  type UseMarketplaceAdvisorsReturn,
  type UseSelectedAdvisorsReturn,
  type UseAdvisorSelectionReturn,
  type UseTeamTemplatesReturn,
  type UseMarketplaceSearchReturn,
  type SelectionSource,
} from "../types/marketplace";

/**
 * Hook to fetch marketplace advisors with filtering
 */
export function useMarketplaceAdvisors(filters?: MarketplaceFilters): UseMarketplaceAdvisorsReturn {
  // Transform filters for Convex query
  const convexFilters = {
    category: filters?.category,
    featured: filters?.featured,
    limit: filters?.limit,
    teamId: filters?.teamId,
    tags: filters?.tags,
    searchQuery: filters?.searchQuery,
  };
  const advisors = useQuery(api.marketplace.getMarketplaceAdvisors, convexFilters);

  // Transform Convex data to MarketplaceAdvisor format
  const transformedAdvisors: MarketplaceAdvisor[] = (advisors || []).map((advisor: any) => {
    // If tests/mocks already provide persona-shaped advisors, return as-is for backward compatibility
    if (advisor && 'persona' in advisor) return advisor as MarketplaceAdvisor;
    // Otherwise, transform to MarketplaceAdvisor
    return {
      _id: advisor._id,
      id: advisor._id,
      name: advisor.persona?.name ?? advisor.name,
      title: advisor.persona?.title ?? advisor.title ?? 'Advisor',
      image: advisor.imageUrl,
      oneLiner: advisor.persona?.oneLiner || 'Expert advisor ready to help',
      archetype: Array.isArray(advisor.persona?.expertise)
        ? advisor.persona.expertise[0] || 'General'
        : advisor.persona?.expertise || 'General',
      bio: advisor.persona?.description || '',
      specialties: advisor.persona?.specialties || [],
      mission: advisor.persona?.description || 'To provide expert guidance and support',
      location: { city: 'Unknown', region: 'Unknown' },
      adviceDelivery: { mode: 'conversational', formality: 'professional', signOff: 'Best regards' },
      isPublic: advisor.isPublic ?? true,
      featured: advisor.featured || false,
      category: advisor.category || 'General',
      tags: advisor.tags || [],
      teamAffiliations: advisor.metadata?.teamAffiliations || [],
      createdAt: advisor.createdAt,
      updatedAt: advisor.createdAt,
    } as MarketplaceAdvisor;
  });

  return {
    advisors: transformedAdvisors,
    loading: advisors === undefined,
    error: null, // Convex handles errors internally
    refetch: () => {
      // Convex automatically refetches on dependency changes
      // This is a no-op for compatibility with the interface
    },
  };
}

/**
 * Hook to fetch user's selected advisors
 */
export function useSelectedAdvisors(): UseSelectedAdvisorsReturn {
  // Query user's selected advisors - authentication is handled by Convex
  const selectedAdvisors = useQuery(api.marketplace.getUserSelectedAdvisors, {});

  // Transform Convex data to MarketplaceAdvisor format
  const transformedAdvisors: MarketplaceAdvisor[] = (selectedAdvisors || []).map((advisor: any) => {
    if (advisor && 'persona' in advisor) return advisor as MarketplaceAdvisor;
    return {
      _id: advisor._id,
      id: advisor._id,
      name: advisor.persona?.name || `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim(),
      title: advisor.persona?.title || 'Advisor',
      image: advisor.imageUrl,
      oneLiner: advisor.persona?.oneLiner || advisor.persona?.description || 'Expert advisor ready to help',
      archetype: Array.isArray(advisor.persona?.expertise)
        ? advisor.persona.expertise[0] || 'General'
        : advisor.persona?.expertise || 'General',
      bio: advisor.persona?.description || '',
      specialties: advisor.persona?.specialties || [],
      mission: advisor.persona?.description || 'To provide expert guidance and support',
      location: { city: 'Unknown', region: 'Unknown' },
      adviceDelivery: { mode: 'conversational', formality: 'professional', signOff: 'Best regards' },
      isPublic: advisor.isPublic || false,
      featured: advisor.featured || false,
      category: advisor.category || 'General',
      tags: advisor.tags || [],
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt || advisor.createdAt,
    } as MarketplaceAdvisor;
  });

  return {
    selectedAdvisors: transformedAdvisors,
    loading: selectedAdvisors === undefined,
    error: null,
    refetch: () => {
      // Convex automatically refetches
    },
  };
}

/**
 * Hook for advisor selection operations
 */
export function useAdvisorSelection(): UseAdvisorSelectionReturn {
  const selectAdvisorMutation = useMutation(api.marketplace.selectAdvisor);
  const unselectAdvisorMutation = useMutation(api.marketplace.unselectAdvisor);
  const selectTeamMutation = useMutation(api.marketplace.selectTeam);

  const selectAdvisor = async (
    advisorId: Id<"advisors">,
    source: SelectionSource = 'marketplace',
    teamId?: string
  ): Promise<SelectionResult> => {
    try {
      const result = await selectAdvisorMutation({
        advisorId,
        source,
        teamId,
      });
      
      return {
        success: true,
        advisorId,
        selectionId: result,
        alreadySelected: false,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to select advisor';
      const alreadySelected = errorMessage.toLowerCase().includes('already selected');
      
      return {
        success: false,
        advisorId,
        error: errorMessage,
        alreadySelected,
      };
    }
  };

  const unselectAdvisor = async (advisorId: Id<"advisors">): Promise<boolean> => {
    try {
      await unselectAdvisorMutation({
        advisorId
      });
      return true;
    } catch (error) {
      console.error('Failed to unselect advisor:', error);
      return false;
    }
  };

  const selectTeam = async (teamId: string): Promise<TeamSelectionResult> => {
    try {
      const teamResult = await selectTeamMutation({ teamId });

      // Accept either an array of results or an object with {results}
      const resultsArray: any[] = Array.isArray(teamResult) ? teamResult : (teamResult?.results ?? []);

      const totalSelected = resultsArray.filter((r: any) => !!r.success).length;
      const totalFailed = resultsArray.filter((r: any) => !r.success).length;

      return {
        success: totalSelected > 0,
        teamId,
        results: resultsArray as SelectionResult[],
        totalSelected,
        totalFailed,
      };
    } catch (error: any) {
      return {
        success: false,
        teamId,
        results: [],
        totalSelected: 0,
        totalFailed: 1,
      };
    }
  };

  return {
    selectAdvisor,
    unselectAdvisor,
    selectTeam,
    loading: false, // Convex mutations handle their own loading state
    error: null,
  };
}

/**
 * Adapter function to convert Convex team template to TeamTemplate format
 */
function adaptConvexTeamToTeamTemplate(convexTeam: any): TeamTemplate {
  return {
    teamId: convexTeam.id,
    teamSchemaVersion: "1.0.0",
    name: convexTeam.name,
    tagline: convexTeam.description || "",
    description: convexTeam.description || "",
    category: convexTeam.category || "general",
    targetAudience: ["Startups", "Businesses"],
    useCases: ["General consulting", "Strategy planning"],
    advisorRoles: [], // Will be populated when the team is deployed
    interactionProtocol: {
      sessionFlow: "sequential",
      crossAdvisorCommunication: true,
      contextSharing: "automatic",
      decisionMaking: "collaborative",
      feedbackLoop: "continuous"
    },
    onboarding: {
      estimatedTime: "5 minutes",
      prerequisites: [],
      welcomeMessage: `Welcome to ${convexTeam.name}!`,
      firstSession: {
        type: "consultation",
        duration: "30 minutes",
        objectives: ["Introduction", "Goal setting", "Next steps"]
      }
    },
    customizationOptions: {
      removableAdvisors: [],
      renameableRoles: true,
      adjustablePersonalities: true,
      configurableFocusAreas: true,
      teamSize: "small"
    },
    pricing: {
      deploymentFee: {
        free: 0,
        regular: 99,
        pro: 0
      },
      monthlyFee: {
        free: 0,
        regular: 49,
        pro: 0
      },
      sessionPricing: {
        free: "Unlimited",
        regular: "Unlimited",
        pro: "Unlimited"
      }
    },
    successMetrics: [
      {
        metric: "Team Effectiveness",
        description: "Overall team performance score",
        unit: "percentage"
      }
    ],
    metadata: {
      version: "1.0.0",
      createdAt: new Date(convexTeam.createdAt).toISOString(),
      updatedAt: new Date(convexTeam.updatedAt).toISOString(),
      owner: {
        org: "AI Advisor",
        contactEmail: "support@aiadvisor.com"
      },
      tags: [convexTeam.category],
      featured: convexTeam.featured || false,
      popularityScore: convexTeam.sortOrder || 0
    },
    deploymentEligibility: {
      free: true,
      regular: true,
      pro: true
    }
  };
}

/**
 * Hook to fetch team templates
 */
export function useTeamTemplates(filters?: { category?: string; featured?: boolean }): UseTeamTemplatesReturn {
  const teamTemplates = useQuery(api.marketplace.getTeamTemplates, filters || {});

  return {
    teamTemplates: (teamTemplates || []).map(adaptConvexTeamToTeamTemplate),
    loading: teamTemplates === undefined,
    error: null,
    refetch: () => {
      // Convex automatically refetches
    },
  };
}

/**
 * Hook for marketplace search functionality
 */
export function useMarketplaceSearch(): UseMarketplaceSearchReturn {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<MarketplaceFilters>({});

  // Use the search function from marketplace API
  const searchResults = useQuery(
    api.marketplace.searchMarketplaceAdvisors,
    searchQuery ? { searchQuery, ...searchFilters } : "skip"
  );

  const search = (query: string, filters?: MarketplaceFilters) => {
    setSearchQuery(query);
    if (filters) {
      setSearchFilters(filters);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilters({});
  };

  // Transform search results to MarketplaceAdvisor interface
  const transformedSearchResults: MarketplaceAdvisor[] = (searchResults || []).map(advisor => ({
    _id: advisor._id,
    id: advisor._id,
    name: advisor.persona?.name || `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim() || 'Unknown Advisor',
    title: advisor.persona?.title || 'Business Advisor',
    image: advisor.imageUrl || '',
    oneLiner: advisor.persona?.oneLiner || 'Experienced business advisor ready to help.',
    archetype: 'General',
    bio: advisor.persona?.description || 'Experienced business advisor ready to help with your challenges.',
    experience: `${advisor.experience || 0}+ years`,
    location: {
      city: 'Remote',
      region: 'Global'
    },
    adviceDelivery: {
      mode: 'conversational',
      formality: 'professional',
      signOff: 'Best regards'
    },
    mission: 'To provide valuable business guidance and support.',
    tags: advisor.tags || [],
    isPublic: true,
    featured: advisor.featured || false,
    category: advisor.category || 'General',
    rating: advisor.rating || 0,
    reviewCount: advisor.reviewCount || 0,
    availability: advisor.availability || 'available',
    createdAt: advisor.createdAt,
    updatedAt: advisor.createdAt,
  }));

  return {
    searchResults: transformedSearchResults,
    loading: searchQuery ? searchResults === undefined : false,
    error: null,
    search,
    clearSearch,
  };
}

/**
 * Combined marketplace state hook for complex components
 */
export function useMarketplaceState(initialFilters?: MarketplaceFilters) {
  const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters || {});
  
  const marketplaceAdvisors = useMarketplaceAdvisors(filters);
  const selectedAdvisors = useSelectedAdvisors();
  const teamTemplates = useTeamTemplates({ featured: filters.featured });
  const advisorSelection = useAdvisorSelection();
  const search = useMarketplaceSearch();

  const updateFilters = (newFilters: Partial<MarketplaceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    // Data
    advisors: marketplaceAdvisors.advisors,
    selectedAdvisors: selectedAdvisors.selectedAdvisors,
    teamTemplates: teamTemplates.teamTemplates,
    searchResults: search.searchResults,
    
    // Loading states
    loading: {
      advisors: marketplaceAdvisors.loading,
      selectedAdvisors: selectedAdvisors.loading,
      teamTemplates: teamTemplates.loading,
      search: search.loading,
      selection: advisorSelection.loading,
    },
    
    // Error states
    error: {
      advisors: marketplaceAdvisors.error,
      selectedAdvisors: selectedAdvisors.error,
      teamTemplates: teamTemplates.error,
      search: search.error,
      selection: advisorSelection.error,
    },
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Actions
    selectAdvisor: advisorSelection.selectAdvisor,
    unselectAdvisor: advisorSelection.unselectAdvisor,
    selectTeam: advisorSelection.selectTeam,
    search: search.search,
    clearSearch: search.clearSearch,
    
    // Refetch functions
    refetch: {
      advisors: marketplaceAdvisors.refetch,
      selectedAdvisors: selectedAdvisors.refetch,
      teamTemplates: teamTemplates.refetch,
    },
  };
}

/**
 * Hook for marketplace statistics
 */
export function useMarketplaceStats() {
  const stats = useQuery(api.marketplace.getMarketplaceStats, {});

  return {
    stats: stats || null,
    loading: stats === undefined,
    error: null,
  };
}

/**
 * Hook for advisor suggestions
 */
export function useAdvisorSuggestions(options?: { limit?: number; excludeSelected?: boolean }) {
  const suggestions = useQuery(api.marketplace.getAdvisorSuggestions, options || {});

  return {
    suggestions: suggestions || [],
    loading: suggestions === undefined,
    error: null,
  };
}

/**
 * Hook for popular advisors
 */
export function usePopularAdvisors(options?: { limit?: number; timeFrame?: 'week' | 'month' | 'all' }) {
  const popularAdvisors = useQuery(api.marketplace.getPopularAdvisors, options || {});

  return {
    popularAdvisors: popularAdvisors || [],
    loading: popularAdvisors === undefined,
    error: null,
  };
}

