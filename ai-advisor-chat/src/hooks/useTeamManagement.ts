import { useState, useCallback, useEffect } from 'react';

export interface TeamTemplate {
  teamId: string;
  teamSchemaVersion: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  targetAudience: string[];
  useCases: string[];
  advisorRoles: Array<{
    roleId: string;
    roleName: string;
    roleDescription: string;
    advisorId: string;
    primaryFocus: string[];
    interactionStyle: string;
    sessionPriority: number;
    optional?: boolean;
  }>;
  interactionProtocol: {
    sessionFlow: string;
    crossAdvisorCommunication: boolean;
    contextSharing: string;
    decisionMaking: string;
    feedbackLoop: string;
  };
  onboarding: {
    estimatedTime: string;
    prerequisites: string[];
    welcomeMessage: string;
    firstSession: {
      type: string;
      duration: string;
      objectives: string[];
    };
  };
  customizationOptions: {
    removableAdvisors: string[];
    renameableRoles: boolean;
    adjustablePersonalities: boolean;
    configurableFocusAreas: boolean;
    teamSize: string;
  };
  pricing: {
    deploymentFee: {
      free: number;
      regular: number;
      pro: number;
    };
    monthlyFee: {
      free: number;
      regular: number;
      pro: number;
    };
    sessionPricing: {
      free: string;
      regular: string;
      pro: string;
    };
  };
  successMetrics: Array<{
    metric: string;
    description: string;
    unit: string;
  }>;
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      org: string;
      contactEmail: string;
    };
    tags: string[];
    featured: boolean;
    popularityScore: number;
  };
  deploymentEligibility?: {
    free: boolean;
    regular: boolean;
    pro: boolean;
  };
}

export interface DeployedTeam {
  deploymentId: string;
  teamId: string;
  teamName: string;
  status: 'active' | 'inactive' | 'deploying' | 'failed';
  deployedAt: string;
  lastActivity: string;
  advisors: DeployedTeamAdvisor[];
  settings: TeamSettings;
  statistics: TeamStatistics;
}

export interface DeployedTeamAdvisor {
  advisorId: string;
  name: string;
  title: string;
  role: string;
  status: 'active' | 'inactive';
  model: string;
  conversationCount: number;
  averageResponseTime: number;
  userRating?: number;
}

export interface TeamSettings {
  crossAdvisorCommunication: boolean;
  autoCreateConversation: boolean;
  customOnboardingMessage?: string;
  notificationSettings: {
    newMessages: boolean;
    teamUpdates: boolean;
    performanceReports: boolean;
  };
}

export interface TeamStatistics {
  totalConversations: number;
  totalMessages: number;
  averageSessionDuration: number;
  teamEffectivenessScore: number;
  lastWeekActivity: {
    conversations: number;
    messages: number;
    activeAdvisors: number;
  };
}

export interface DeploymentRequest {
  teamId: string;
  customizations?: {
    removedAdvisors?: string[];
    renamedRoles?: Record<string, string>;
    adjustedPersonalities?: Record<string, any>;
    customFocusAreas?: Record<string, string[]>;
  };
  settings?: {
    autoCreateConversation?: boolean;
    enableCrossAdvisorCommunication?: boolean;
    customOnboardingMessage?: string;
  };
}

export interface DeploymentResponse {
  deploymentId: string;
  teamId: string;
  teamName: string;
  status: 'deploying' | 'completed' | 'failed';
  deployedAdvisors: DeployedAdvisor[];
  estimatedCompletionTime: string;
  nextSteps: string[];
  cost?: {
    deploymentFee: number;
    monthlyFee: number;
    currency: string;
  };
}

export interface DeployedAdvisor {
  advisorId: string;
  name: string;
  title: string;
  role: string;
  status: 'deploying' | 'ready' | 'failed';
  modelConfiguration: {
    defaultModel: string;
    availableModels: string[];
    category: string;
  };
  deploymentMessage: string;
}

interface UseTeamManagementReturn {
  // Teams data
  teams: TeamTemplate[];
  deployedTeams: DeployedTeam[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTeams: (filters?: { category?: string; featured?: boolean }) => Promise<void>;
  fetchDeployedTeams: () => Promise<void>;
  deployTeam: (request: DeploymentRequest) => Promise<DeploymentResponse>;
  getTeamPreview: (teamId: string) => Promise<any>;
  validateTeamDeployment: (teamId: string, customizations?: any) => Promise<any>;
  updateDeployedTeam: (deploymentId: string, action: string, params?: any) => Promise<boolean>;
  checkDeploymentStatus: (deploymentId: string) => Promise<any>;

  // Derived state
  featuredTeams: TeamTemplate[];
  teamsByCategory: Record<string, TeamTemplate[]>;
  deploymentSummary: {
    totalTeams: number;
    activeTeams: number;
    totalAdvisors: number;
    totalConversations: number;
  };
}

export function useTeamManagement(): UseTeamManagementReturn {
  const [teams, setTeams] = useState<TeamTemplate[]>([]);
  const [deployedTeams, setDeployedTeams] = useState<DeployedTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available teams
  const fetchTeams = useCallback(async (filters?: { category?: string; featured?: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.featured) params.append('featured', 'true');

      const response = await fetch(`/api/teams?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTeams(data.data.teams);
      } else {
        setError(data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's deployed teams
  const fetchDeployedTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teams/deployments');
      const data = await response.json();

      if (data.success) {
        setDeployedTeams(data.data.deployments);
      } else {
        setError(data.error || 'Failed to fetch deployed teams');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployed teams');
    } finally {
      setLoading(false);
    }
  }, []);

  // Deploy a new team
  const deployTeam = useCallback(async (request: DeploymentRequest): Promise<DeploymentResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${request.teamId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh deployed teams list
        await fetchDeployedTeams();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to deploy team');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy team';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDeployedTeams]);

  // Get team preview
  const getTeamPreview = useCallback(async (teamId: string) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'preview', teamId }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get team preview');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get team preview');
    }
  }, []);

  // Validate team deployment
  const validateTeamDeployment = useCallback(async (teamId: string, customizations?: any) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          teamId,
          customizations,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to validate team deployment');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to validate team deployment');
    }
  }, []);

  // Update deployed team
  const updateDeployedTeam = useCallback(async (
    deploymentId: string,
    action: string,
    params?: any
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teams/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, deploymentId, ...params }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh deployed teams list
        await fetchDeployedTeams();
        return true;
      } else {
        setError(data.error || 'Failed to update deployed team');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deployed team');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDeployedTeams]);

  // Check deployment status
  const checkDeploymentStatus = useCallback(async (deploymentId: string) => {
    try {
      // Find the team ID for this deployment
      const deployment = deployedTeams.find(d => d.deploymentId === deploymentId);
      if (!deployment) {
        throw new Error('Deployment not found');
      }

      const response = await fetch(`/api/teams/${deployment.teamId}/deploy?deploymentId=${deploymentId}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to check deployment status');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to check deployment status');
    }
  }, [deployedTeams]);

  // Load teams on component mount
  useEffect(() => {
    fetchTeams();
    fetchDeployedTeams();
  }, [fetchTeams, fetchDeployedTeams]);

  // Derived state
  const featuredTeams = teams.filter(team => team.metadata.featured);
  const teamsByCategory = teams.reduce((acc, team) => {
    const category = team.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category]?.push(team);
    return acc;
  }, {} as Record<string, TeamTemplate[]>);

  const deploymentSummary = {
    totalTeams: (deployedTeams?.length ?? 0),
    activeTeams: (deployedTeams?.filter(team => team.status === 'active').length ?? 0),
    totalAdvisors: (deployedTeams?.reduce((sum, team) => sum + team.advisors.length, 0) ?? 0),
    totalConversations: (deployedTeams?.reduce((sum, team) => sum + team.statistics.totalConversations, 0) ?? 0),
  };

  return {
    // Data
    teams,
    deployedTeams,
    loading,
    error,

    // Actions
    fetchTeams,
    fetchDeployedTeams,
    deployTeam,
    getTeamPreview,
    validateTeamDeployment,
    updateDeployedTeam,
    checkDeploymentStatus,

    // Derived state
    featuredTeams,
    teamsByCategory,
    deploymentSummary,
  };
}