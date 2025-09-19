import fs from 'fs/promises';
import path from 'path';

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
}

export interface AdvisorConfig {
  advisorId: string;
  advisorSchemaVersion: string;
  status: string;
  persona: {
    name: string;
    title: string;
    image: string;
    oneLiner: string;
    archetype: string;
    temperament: string;
    bio: string;
    detailedBackground?: string;
    experience: string;
    specialties: string[];
    personalInterests: string[];
    communicationStyle: string;
    education?: {
      degreeLevel: string;
      degreeName: string;
      major: string;
      institution: string;
      graduationYear: number;
    };
    location?: {
      city: string;
      region: string;
      country: string;
      countryCode: string;
      timezone: string;
    };
    adviceDelivery: {
      mode: string;
      formality: string;
      useEmojis: boolean;
      voiceGuidelines: string[];
      signOff: string;
    };
  };
  modelConfiguration: {
    category: string;
    defaultModel: string;
    tierAvailability: {
      free: string[];
      regular: string[];
      pro: string[];
    };
  };
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      org: string;
      contactEmail: string;
    };
    tags: string[];
  };
}

const TEAMS_DIR = path.join(process.cwd(), 'prisma', 'teams');
const ADVISORS_DIR = path.join(process.cwd(), 'prisma', 'advisors');

/**
 * Load a team configuration file
 */
export async function loadTeamConfig(teamId: string): Promise<TeamTemplate | null> {
  try {
    const filePath = path.join(TEAMS_DIR, `${teamId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(content);

    // Validate required fields
    if (!config.teamId || !config.name || !config.advisorRoles) {
      console.error(`Invalid team configuration for ${teamId}: missing required fields`);
      return null;
    }

    return config;
  } catch (error) {
    console.error(`Error loading team config ${teamId}:`, error);
    return null;
  }
}

/**
 * Load an advisor configuration file
 */
export async function loadAdvisorConfig(advisorId: string): Promise<AdvisorConfig | null> {
  try {
    const filePath = path.join(ADVISORS_DIR, `${advisorId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(content);

    // Validate required fields
    if (!config.advisorId || !config.persona || !config.modelConfiguration) {
      console.error(`Invalid advisor configuration for ${advisorId}: missing required fields`);
      return null;
    }

    return config;
  } catch (error) {
    console.error(`Error loading advisor config ${advisorId}:`, error);
    return null;
  }
}

/**
 * Get all available team templates
 */
export async function getAllTeams(): Promise<TeamTemplate[]> {
  try {
    const files = await fs.readdir(TEAMS_DIR);
    const teamFiles = files.filter(file => file.endsWith('.json'));

    const teams: TeamTemplate[] = [];
    for (const file of teamFiles) {
      const teamId = file.replace('.json', '');
      const team = await loadTeamConfig(teamId);
      if (team) {
        teams.push(team);
      }
    }

    // Sort by featured status and popularity
    return teams.sort((a, b) => {
      if (a.metadata.featured && !b.metadata.featured) return -1;
      if (!a.metadata.featured && b.metadata.featured) return 1;
      return b.metadata.popularityScore - a.metadata.popularityScore;
    });
  } catch (error) {
    console.error('Error getting all teams:', error);
    return [];
  }
}

/**
 * Get all available teams (alias for getAllTeams for API compatibility)
 */
export async function getAllAvailableTeams(): Promise<TeamTemplate[]> {
  return getAllTeams();
}

/**
 * Get teams by category
 */
export async function getTeamsByCategory(category: string): Promise<TeamTemplate[]> {
  const allTeams = await getAllTeams();
  return allTeams.filter(team => team.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get featured teams
 */
export async function getFeaturedTeams(): Promise<TeamTemplate[]> {
  const allTeams = await getAllTeams();
  return allTeams.filter(team => team.metadata.featured);
}

/**
 * Validate team customizations
 */
export function validateTeamCustomizations(
  team: TeamTemplate,
  customizations: {
    removedAdvisors?: string[];
    renamedRoles?: Record<string, string>;
  }
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate removed advisors
  if (customizations.removedAdvisors) {
    const requiredAdvisors = team.advisorRoles
      .filter(role => !role.optional)
      .map(role => role.roleId);

    const removedRequired = customizations.removedAdvisors.filter(id => requiredAdvisors.includes(id));
    if (removedRequired.length > 0) {
      errors.push(`Cannot remove required advisors: ${removedRequired.join(', ')}`);
    }
  }

  // Validate role renaming
  if (customizations.renamedRoles && !team.customizationOptions.renameableRoles) {
    warnings.push('Role renaming is not supported for this team');
  }

  // Validate renamed role IDs
  if (customizations.renamedRoles) {
    const validRoleIds = team.advisorRoles.map(role => role.roleId);
    const invalidRoleIds = Object.keys(customizations.renamedRoles).filter(id => !validRoleIds.includes(id));
    if (invalidRoleIds.length > 0) {
      errors.push(`Invalid role IDs for renaming: ${invalidRoleIds.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate team deployment cost
 */
export function calculateDeploymentCost(
  team: TeamTemplate,
  userPlan: 'free' | 'regular' | 'pro' = 'free'
): { deploymentFee: number; monthlyFee: number; currency: string } {
  return {
    deploymentFee: team.pricing.deploymentFee[userPlan] || team.pricing.deploymentFee.free,
    monthlyFee: team.pricing.monthlyFee[userPlan] || team.pricing.monthlyFee.free,
    currency: 'USD'
  };
}

/**
 * Get available models for an advisor based on user plan
 */
export function getAvailableModelsForAdvisor(
  advisor: AdvisorConfig,
  userPlan: 'free' | 'regular' | 'pro' = 'free'
): string[] {
  return advisor.modelConfiguration.tierAvailability[userPlan] ||
         advisor.modelConfiguration.tierAvailability.free ||
         [];
}

/**
 * Generate team deployment summary
 */
export function generateDeploymentSummary(
  team: TeamTemplate,
  customizations?: {
    removedAdvisors?: string[];
    renamedRoles?: Record<string, string>;
  }
): {
  totalAdvisors: number;
  requiredAdvisors: number;
  optionalAdvisors: number;
  removedAdvisors: string[];
  renamedRoles: Record<string, string>;
  estimatedDeploymentTime: string;
  categories: string[];
} {
  let processedRoles = [...team.advisorRoles];

  const removedAdvisors = customizations?.removedAdvisors || [];
  const renamedRoles = customizations?.renamedRoles || {};

  if (removedAdvisors.length > 0) {
    processedRoles = processedRoles.filter(role => !removedAdvisors.includes(role.roleId));
  }

  const categories = [...new Set(team.advisorRoles.map(role => {
    // This would need to be resolved from advisor configs in real implementation
    return 'general'; // Placeholder
  }))];

  return {
    totalAdvisors: processedRoles.length,
    requiredAdvisors: processedRoles.filter(role => !role.optional).length,
    optionalAdvisors: processedRoles.filter(role => role.optional).length,
    removedAdvisors,
    renamedRoles,
    estimatedDeploymentTime: team.onboarding.estimatedTime,
    categories
  };
}

/**
 * Check if team deployment is allowed for user plan
 */
export function isDeploymentAllowed(
  team: TeamTemplate,
  userPlan: 'free' | 'regular' | 'pro' = 'free'
): { allowed: boolean; reason?: string } {
  const deploymentFee = team.pricing.deploymentFee[userPlan] || team.pricing.deploymentFee.free;

  if (deploymentFee > 0) {
    return {
      allowed: false,
      reason: `Team deployment requires ${userPlan} plan payment of $${deploymentFee}`
    };
  }

  return { allowed: true };
}

/**
 * Get team statistics (mock implementation)
 */
export function getTeamStatistics(teamId: string): {
  totalDeployments: number;
  activeDeployments: number;
  averageRating: number;
  popularCategories: string[];
} {
  // Mock data - in real implementation, this would come from analytics database
  return {
    totalDeployments: 1250,
    activeDeployments: 890,
    averageRating: 4.7,
    popularCategories: ['startup', 'business', 'marketing']
  };
}