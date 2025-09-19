import { NextRequest, NextResponse } from 'next/server';

// GitHub MCP service URL
const GITHUB_MCP_URL = process.env.GITHUB_MCP_URL || 'http://localhost:3001';

interface GitHubRequest {
  action: string;
  params?: Record<string, any>;
}

interface GitHubResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// GitHub MCP actions
const GITHUB_ACTIONS = {
  SEARCH_REPOS: 'searchRepos',
  GET_REPO: 'getRepo',
  GET_ISSUES: 'getIssues',
  GET_PULL_REQUESTS: 'getPullRequests',
  CREATE_ISSUE: 'createIssue',
  CREATE_PULL_REQUEST: 'createPullRequest',
  GET_USER_REPOS: 'getUserRepos',
  GET_REPO_CONTENT: 'getRepoContent',
  ANALYZE_CODE: 'analyzeCode'
} as const;

async function callGitHubMCP(action: string, params?: Record<string, any>): Promise<GitHubResponse> {
  try {
    const response = await fetch(`${GITHUB_MCP_URL}/api/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`GitHub MCP service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling GitHub MCP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// POST /api/mcp/github - Call GitHub MCP service
export async function POST(request: NextRequest) {
  try {
    const body: GitHubRequest = await request.json();
    const { action, params } = body;

    if (!action || !Object.values(GITHUB_ACTIONS).includes(action as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing action' },
        { status: 400 }
      );
    }

    const result = await callGitHubMCP(action, params);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GitHub MCP route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/mcp/github/capabilities - Get available GitHub MCP capabilities
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        actions: Object.values(GITHUB_ACTIONS),
        description: 'GitHub integration for repository management and code analysis'
      }
    });
  } catch (error) {
    console.error('Error getting GitHub MCP capabilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get capabilities' },
      { status: 500 }
    );
  }
}