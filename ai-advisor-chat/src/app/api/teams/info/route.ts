import { NextRequest, NextResponse } from 'next/server';
import { getAllAvailableTeams } from '@/lib/teamUtils';
import { loadAdvisorConfig } from '@/lib/teamUtils';

// Interface for team information with advisor counts
export interface TeamInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  advisorCount: number;
  featured: boolean;
  tags: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAdvisors = searchParams.get('includeAdvisors') === 'true';

    // Get all available teams
    const teams = await getAllAvailableTeams();

    // Calculate team information with advisor counts
    const teamInfo: TeamInfo[] = await Promise.all(
      teams.map(async (team: any) => {
        let advisorCount = team.advisorRoles.length;

        // If we need to include real advisor data, load each advisor config
        if (includeAdvisors) {
          try {
            const advisorConfigs = await Promise.all(
              team.advisorRoles.map(async (role: any) => {
                const advisor = await loadAdvisorConfig(role.advisorId);
                return advisor;
              })
            );
            // Count only successfully loaded advisors
            advisorCount = advisorConfigs.filter(Boolean).length;
          } catch (error) {
            console.error(`Error loading advisors for team ${team.id}:`, error);
          }
        }

        return {
          id: team.id,
          name: team.name,
          description: team.description,
          category: team.category,
          advisorCount,
          featured: team.metadata?.featured || false,
          tags: team.metadata?.tags || [],
        };
      })
    );

    // Filter out teams with no advisors
    const validTeams = teamInfo.filter(team => team.advisorCount > 0);

    // Sort by featured status and then by name
    validTeams.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: {
        teams: validTeams,
        summary: {
          totalTeams: validTeams.length,
          featuredTeams: validTeams.filter(t => t.featured).length,
          totalAdvisors: validTeams.reduce((sum, team) => sum + team.advisorCount, 0),
          categories: [...new Set(validTeams.map(t => t.category))],
        }
      }
    });

  } catch (error) {
    console.error('Error fetching team information:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team information' },
      { status: 500 }
    );
  }
}