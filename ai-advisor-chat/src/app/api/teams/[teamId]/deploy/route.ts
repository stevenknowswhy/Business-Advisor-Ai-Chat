import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface DeploymentRequest {
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

interface DeploymentResponse {
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

interface DeployedAdvisor {
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

// Path to team configuration files
const TEAMS_DIR = path.join(process.cwd(), 'prisma', 'teams');
const ADVISORS_DIR = path.join(process.cwd(), 'prisma', 'advisors');

async function loadTeamFile(teamId: string): Promise<any> {
  try {
    const filePath = path.join(TEAMS_DIR, `${teamId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading team ${teamId}:`, error);
    return null;
  }
}

async function loadAdvisorFile(advisorId: string): Promise<any> {
  try {
    const filePath = path.join(ADVISORS_DIR, `${advisorId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading advisor ${advisorId}:`, error);
    return null;
  }
}

// Mock user plan determination - in real implementation, this would come from user database
async function getUserPlan(userId: string): Promise<'free' | 'regular' | 'pro'> {
  // For now, return 'regular' as default
  return 'regular';
}

// Mock deployment function - in real implementation, this would:
// 1. Create advisors in Convex database
// 2. Set up user-advisor relationships
// 3. Configure team-specific settings
// 4. Initialize conversation templates
async function deployTeamToUser(
  teamConfig: any,
  userId: string,
  customizations: DeploymentRequest['customizations'] = {},
  userPlan: 'free' | 'regular' | 'pro' = 'free'
): Promise<DeploymentResponse> {
  const deploymentId = uuidv4();
  const startTime = Date.now();

  // Apply customizations to team configuration
  let processedRoles = [...teamConfig.advisorRoles];

  if (customizations.removedAdvisors) {
    processedRoles = processedRoles.filter(role => !customizations.removedAdvisors?.includes(role.roleId));
  }

  if (customizations.renamedRoles) {
    processedRoles = processedRoles.map(role => ({
      ...role,
      roleName: customizations.renamedRoles?.[role.roleId] || role.roleName
    }));
  }

  // Deploy each advisor
  const deployedAdvisors: DeployedAdvisor[] = [];
  const deploymentErrors: string[] = [];

  for (const role of processedRoles) {
    try {
      const advisorConfig = await loadAdvisorFile(role.advisorId);
      if (!advisorConfig) {
        deploymentErrors.push(`Advisor configuration not found: ${role.advisorId}`);
        continue;
      }

      // Determine available models based on user plan
      const availableModels = advisorConfig.modelConfiguration.tierAvailability[userPlan] ||
                           advisorConfig.modelConfiguration.tierAvailability.free;

      // Create deployed advisor record
      const deployedAdvisor: DeployedAdvisor = {
        advisorId: role.advisorId,
        name: advisorConfig.persona.name,
        title: advisorConfig.persona.title,
        role: role.roleName,
        status: 'deploying',
        modelConfiguration: {
          defaultModel: advisorConfig.modelConfiguration.defaultModel,
          availableModels,
          category: advisorConfig.modelConfiguration.category
        },
        deploymentMessage: `Deploying ${advisorConfig.persona.name} as ${role.roleName}...`
      };

      deployedAdvisors.push(deployedAdvisor);

      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Update status to ready
      deployedAdvisor.status = 'ready';
      deployedAdvisor.deploymentMessage = `${advisorConfig.persona.name} is ready as ${role.roleName}`;

    } catch (error) {
      console.error(`Error deploying advisor ${role.advisorId}:`, error);
      deploymentErrors.push(`Failed to deploy advisor: ${role.advisorId}`);
    }
  }

  // Calculate costs based on team pricing and user plan
  const pricing = teamConfig.pricing;
  const deploymentFee = pricing.deploymentFee[userPlan] || pricing.deploymentFee.free;
  const monthlyFee = pricing.monthlyFee[userPlan] || pricing.monthlyFee.free;

  const response: DeploymentResponse = {
    deploymentId,
    teamId: teamConfig.teamId,
    teamName: teamConfig.name,
    status: deploymentErrors.length > 0 && deployedAdvisors.length === 0 ? 'failed' : 'completed',
    deployedAdvisors,
    estimatedCompletionTime: `${Math.max(1, deployedAdvisors.length * 2)} minutes`,
    nextSteps: [
      'Review your deployed advisors and their configurations',
      'Start a conversation with your team',
      'Customize individual advisor settings if needed',
      'Explore team interaction features'
    ],
    cost: {
      deploymentFee,
      monthlyFee,
      currency: 'USD'
    }
  };

  if (deploymentErrors.length > 0) {
    response.nextSteps.unshift(`Resolve deployment issues: ${deploymentErrors.join(', ')}`);
  }

  return response;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const teamId = params.teamId;
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: DeploymentRequest = await request.json();
    const { customizations, settings } = body;

    // Load team configuration
    const teamConfig = await loadTeamFile(teamId);
    if (!teamConfig) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get user plan for pricing
    const userPlan = await getUserPlan(userId);

    // Validate deployment eligibility
    const deploymentFee = teamConfig.pricing.deploymentFee[userPlan] || teamConfig.pricing.deploymentFee.free;
    if (deploymentFee > 0) {
      // In real implementation, check user's payment method and balance
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payment required for team deployment' },
        { status: 402 }
      );
    }

    // Validate customizations
    if (customizations?.removedAdvisors) {
      const requiredAdvisors = teamConfig.advisorRoles
        .filter((role: any) => !role.optional)
        .map((role: any) => role.roleId);

      const removedRequired = customizations.removedAdvisors.filter(id => requiredAdvisors.includes(id));
      if (removedRequired.length > 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Cannot remove required advisors: ${removedRequired.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Start deployment process
    console.log(`Starting team deployment for user ${userId}, team ${teamId}`);

    try {
      const deploymentResult = await deployTeamToUser(teamConfig, userId, customizations, userPlan);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: deploymentResult,
        message: deploymentResult.status === 'completed'
          ? 'Team deployed successfully!'
          : 'Team deployment completed with some issues'
      });

    } catch (deploymentError) {
      console.error('Deployment error:', deploymentError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Deployment failed due to server error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in team deployment API:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const teamId = params.teamId;
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Deployment ID required' },
        { status: 400 }
      );
    }

    // In real implementation, check deployment status from database
    // For now, return a mock response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        deploymentId,
        teamId,
        status: 'completed',
        progress: 100,
        deployedAdvisors: 5,
        message: 'Team deployment completed successfully'
      }
    });

  } catch (error) {
    console.error('Error checking deployment status:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}