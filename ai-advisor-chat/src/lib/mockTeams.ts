// Helper function to create a mock deployed team (for testing)
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

// Mock data store - in real implementation, this would be stored in Convex/database
export const mockDeployedTeams: Record<string, DeployedTeam[]> = {};

export function createMockDeployedTeam(
  userId: string,
  teamConfig: any,
  deploymentId: string
): DeployedTeam {
  const deployedTeam: DeployedTeam = {
    deploymentId,
    teamId: teamConfig.teamId,
    teamName: teamConfig.name,
    status: 'active',
    deployedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    advisors: teamConfig.advisorRoles.map((role: any) => ({
      advisorId: role.advisorId,
      name: `Advisor ${role.roleName}`,
      title: role.roleName,
      role: role.roleName,
      status: 'active' as const,
      model: 'anthropic/claude-3-sonnet', // Default model
      conversationCount: Math.floor(Math.random() * 50),
      averageResponseTime: 30 + Math.floor(Math.random() * 120),
      userRating: 4 + Math.random()
    })),
    settings: {
      crossAdvisorCommunication: teamConfig.interactionProtocol.crossAdvisorCommunication,
      autoCreateConversation: true,
      customOnboardingMessage: teamConfig.onboarding.welcomeMessage,
      notificationSettings: {
        newMessages: true,
        teamUpdates: true,
        performanceReports: false
      }
    },
    statistics: {
      totalConversations: Math.floor(Math.random() * 100),
      totalMessages: Math.floor(Math.random() * 500),
      averageSessionDuration: 15 + Math.random() * 45,
      teamEffectivenessScore: 7 + Math.random() * 3,
      lastWeekActivity: {
        conversations: Math.floor(Math.random() * 20),
        messages: Math.floor(Math.random() * 100),
        activeAdvisors: teamConfig.advisorRoles.length
      }
    }
  };

  // Initialize user's deployed teams if not exists
  if (!mockDeployedTeams[userId]) {
    mockDeployedTeams[userId] = [];
  }

  mockDeployedTeams[userId].push(deployedTeam);
  return deployedTeam;
}