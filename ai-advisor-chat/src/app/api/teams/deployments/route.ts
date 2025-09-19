import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { mockDeployedTeams } from '~/lib/mockTeams';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

    // In real implementation, fetch from database based on userId
    const userDeployments = mockDeployedTeams[userId] || [];

    // Calculate aggregate statistics
    const totalAdvisors = userDeployments.reduce((sum, team) => sum + team.advisors.length, 0);
    const totalConversations = userDeployments.reduce((sum, team) => sum + team.statistics.totalConversations, 0);
    const activeTeams = userDeployments.filter(team => team.status === 'active').length;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        deployments: userDeployments,
        summary: {
          totalTeams: userDeployments.length,
          activeTeams,
          totalAdvisors,
          totalConversations,
          averageTeamEffectiveness: userDeployments.length > 0
            ? userDeployments.reduce((sum, team) => sum + team.statistics.teamEffectivenessScore, 0) / userDeployments.length
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching deployed teams:', error);
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
    const { action, deploymentId, ...params } = body;

    if (!action || !deploymentId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Action and deploymentId are required' },
        { status: 400 }
      );
    }

    // Get user's deployed teams
    const userDeployments = mockDeployedTeams[userId] || [];
    const deployment = userDeployments.find(d => d.deploymentId === deploymentId);

    if (!deployment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Deployment not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'activate':
        deployment.status = 'active';
        break;

      case 'deactivate':
        deployment.status = 'inactive';
        break;

      case 'update_settings':
        if (params.settings) {
          deployment.settings = { ...deployment.settings, ...params.settings };
        }
        break;

      case 'update_advisor_model':
        if (params.advisorId && params.model) {
          const advisor = deployment.advisors.find(a => a.advisorId === params.advisorId);
          if (advisor) {
            advisor.model = params.model;
          }
        }
        break;

      case 'remove_advisor':
        if (params.advisorId) {
          deployment.advisors = deployment.advisors.filter(a => a.advisorId !== params.advisorId);
        }
        break;

      case 'add_advisor':
        // In real implementation, this would involve adding a new advisor to the team
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Adding advisors to deployed teams not yet implemented' },
          { status: 501 }
        );

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the deployment in the mock store
    mockDeployedTeams[userId] = userDeployments;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: deployment,
      message: `Team ${action.replace('_', ' ')}d successfully`
    });

  } catch (error) {
    console.error('Error managing deployed team:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}