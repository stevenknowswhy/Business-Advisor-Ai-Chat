import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';

interface TeamTemplate {
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

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Path to team configuration files
const TEAMS_DIR = path.join(process.cwd(), 'prisma', 'teams');

async function loadTeamFile(teamId: string): Promise<TeamTemplate | null> {
  try {
    const filePath = path.join(TEAMS_DIR, `${teamId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading team ${teamId}:`, error);
    return null;
  }
}

async function getAllAvailableTeams(): Promise<TeamTemplate[]> {
  try {
    const files = await fs.readdir(TEAMS_DIR);
    const teamFiles = files.filter(file => file.endsWith('.json'));

    const teams: TeamTemplate[] = [];
    for (const file of teamFiles) {
      const teamId = file.replace('.json', '');
      const team = await loadTeamFile(teamId);
      if (team) {
        teams.push(team);
      }
    }

    // Sort by featured status and popularity score
    return teams.sort((a, b) => {
      if (a.metadata.featured && !b.metadata.featured) return -1;
      if (!a.metadata.featured && b.metadata.featured) return 1;
      return b.metadata.popularityScore - a.metadata.popularityScore;
    });
  } catch (error) {
    console.error('Error loading teams:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    let teams = await getAllAvailableTeams();

    // Apply filters
    if (category) {
      teams = teams.filter(team => team.category.toLowerCase() === category.toLowerCase());
    }

    if (featured) {
      teams = teams.filter(team => team.metadata.featured);
    }

    // Add deployment eligibility based on user's plan (this would come from user database in real implementation)
    const teamsWithEligibility = teams.map(team => ({
      ...team,
      deploymentEligibility: {
        free: team.pricing.deploymentFee.free === 0,
        regular: team.pricing.deploymentFee.regular > 0,
        pro: team.pricing.deploymentFee.pro === 0
      }
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        teams: teamsWithEligibility,
        count: teamsWithEligibility.length,
        categories: [...new Set(teams.map(team => team.category))],
        featuredCount: teams.filter(team => team.metadata.featured).length
      }
    });

  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, teamId, customizations } = body;

    if (!action || !teamId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields: action and teamId' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'preview':
        return await handleTeamPreview(teamId);

      case 'validate':
        return await handleTeamValidation(teamId, customizations);

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in teams API POST:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTeamPreview(teamId: string): Promise<NextResponse<ApiResponse>> {
  const team = await loadTeamFile(teamId);

  if (!team) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Team not found' },
      { status: 404 }
    );
  }

  // Load advisor details for each role
  const advisorDetails = [];
  for (const role of team.advisorRoles) {
    try {
      const advisorPath = path.join(process.cwd(), 'prisma', 'advisors', `${role.advisorId}.json`);
      const advisorContent = await fs.readFile(advisorPath, 'utf-8');
      const advisor = JSON.parse(advisorContent);

      advisorDetails.push({
        role: role.roleName,
        roleDescription: role.roleDescription,
        advisor: {
          id: advisor.advisorId,
          name: advisor.persona.name,
          title: advisor.persona.title,
          image: advisor.persona.image,
          oneLiner: advisor.persona.oneLiner,
          category: advisor.modelConfiguration.category,
          defaultModel: advisor.modelConfiguration.defaultModel
        },
        optional: role.optional || false,
        sessionPriority: role.sessionPriority
      });
    } catch (error) {
      console.error(`Error loading advisor ${role.advisorId}:`, error);
    }
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      team: {
        id: team.teamId,
        name: team.name,
        tagline: team.tagline,
        description: team.description,
        category: team.category,
        targetAudience: team.targetAudience,
        useCases: team.useCases,
        onboarding: team.onboarding,
        pricing: team.pricing,
        successMetrics: team.successMetrics,
        featured: team.metadata.featured,
        popularityScore: team.metadata.popularityScore
      },
      advisors: advisorDetails,
      interactionProtocol: team.interactionProtocol,
      customizationOptions: team.customizationOptions
    }
  });
}

async function handleTeamValidation(teamId: string, customizations?: any): Promise<NextResponse<ApiResponse>> {
  const team = await loadTeamFile(teamId);

  if (!team) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Team not found' },
      { status: 404 }
    );
  }

  const validationResults = {
    isValid: true,
    warnings: [] as string[],
    errors: [] as string[],
    requirements: {
      minAdvisors: team.advisorRoles.filter(role => !role.optional).length,
      maxAdvisors: team.advisorRoles.length,
      estimatedDeploymentTime: team.onboarding.estimatedTime
    }
  };

  // Validate customizations if provided
  if (customizations) {
    if (customizations.removedAdvisors) {
      const requiredAdvisors = team.advisorRoles.filter(role => !role.optional).map(role => role.roleId);
      const removedRequired = customizations.removedAdvisors.filter((id: string) => requiredAdvisors.includes(id));

      if (removedRequired.length > 0) {
        validationResults.isValid = false;
        validationResults.errors.push(`Cannot remove required advisors: ${removedRequired.join(', ')}`);
      }
    }

    if (customizations.renamedRoles && !team.customizationOptions.renameableRoles) {
      validationResults.warnings.push('Role renaming is not supported for this team');
    }
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      validation: validationResults,
      team: {
        id: team.teamId,
        name: team.name,
        advisorCount: {
          total: team.advisorRoles.length,
          required: team.advisorRoles.filter(role => !role.optional).length,
          optional: team.advisorRoles.filter(role => role.optional).length
        }
      }
    }
  });
}