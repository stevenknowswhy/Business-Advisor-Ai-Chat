import { NextRequest, NextResponse } from 'next/server';

export interface MCPService {
  name: string;
  url: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  description: string;
  capabilities: string[];
}

const MCP_SERVICES: MCPService[] = [
  {
    name: 'github',
    url: 'http://localhost:3001',
    port: 3001,
    status: 'offline',
    description: 'GitHub integration for repository management',
    capabilities: ['repo-management', 'issue-tracking', 'pull-requests', 'code-analysis']
  },
  {
    name: 'filesystem',
    url: 'http://localhost:3002',
    port: 3002,
    status: 'offline',
    description: 'Filesystem operations and document processing',
    capabilities: ['file-operations', 'document-analysis', 'workspace-management']
  },
  {
    name: 'shadcn',
    url: 'http://localhost:3003',
    port: 3003,
    status: 'offline',
    description: 'Shadcn UI component generation and management',
    capabilities: ['component-generation', 'ui-suggestions', 'design-patterns']
  },
  {
    name: 'playwright',
    url: 'http://localhost:3004',
    port: 3004,
    status: 'offline',
    description: 'Web automation and testing',
    capabilities: ['web-automation', 'testing', 'screenshot-capture', 'performance-analysis']
  }
];

// Check service health with timeout
async function checkServiceHealth(service: MCPService): Promise<MCPService> {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    // Create the fetch promise
    const fetchPromise = fetch(`${service.url}/health`, {
      method: 'GET',
    });

    // Race the promises
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (response.ok) {
      return { ...service, status: 'online' };
    } else {
      return { ...service, status: 'error' };
    }
  } catch (error) {
    return { ...service, status: 'offline' };
  }
}

// GET /api/mcp/status - Get status of all MCP services
export async function GET() {
  try {
    // Check health of all services
    const servicesWithStatus = await Promise.all(
      MCP_SERVICES.map(checkServiceHealth)
    );

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithStatus,
        summary: {
          total: servicesWithStatus.length,
          online: servicesWithStatus.filter(s => s.status === 'online').length,
          offline: servicesWithStatus.filter(s => s.status === 'offline').length,
          error: servicesWithStatus.filter(s => s.status === 'error').length
        }
      }
    });
  } catch (error) {
    console.error('Error checking MCP services status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check MCP services status' },
      { status: 500 }
    );
  }
}

// POST /api/mcp/status - Force refresh service status
export async function POST() {
  try {
    const servicesWithStatus = await Promise.all(
      MCP_SERVICES.map(checkServiceHealth)
    );

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithStatus,
        summary: {
          total: servicesWithStatus.length,
          online: servicesWithStatus.filter(s => s.status === 'online').length,
          offline: servicesWithStatus.filter(s => s.status === 'offline').length,
          error: servicesWithStatus.filter(s => s.status === 'error').length
        }
      }
    });
  } catch (error) {
    console.error('Error refreshing MCP services status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh MCP services status' },
      { status: 500 }
    );
  }
}