import { NextRequest, NextResponse } from 'next/server';

// Shadcn MCP service URL
const SHADCN_MCP_URL = process.env.SHADCN_MCP_URL || 'http://localhost:3003';

interface ShadcnRequest {
  action: string;
  params?: Record<string, any>;
}

interface ShadcnResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Shadcn MCP actions
const SHADCN_ACTIONS = {
  GET_COMPONENT: 'getComponent',
  LIST_COMPONENTS: 'listComponents',
  GET_COMPONENT_DEMO: 'getComponentDemo',
  GET_COMPONENT_METADATA: 'getComponentMetadata',
  GENERATE_COMPONENT: 'generateComponent',
  GET_DIRECTORY_STRUCTURE: 'getDirectoryStructure',
  GET_BLOCK: 'getBlock',
  LIST_BLOCKS: 'listBlocks'
} as const;

async function callShadcnMCP(action: string, params?: Record<string, any>): Promise<ShadcnResponse> {
  try {
    const response = await fetch(`${SHADCN_MCP_URL}/api/shadcn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`Shadcn MCP service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Shadcn MCP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// POST /api/mcp/shadcn - Call Shadcn MCP service
export async function POST(request: NextRequest) {
  try {
    const body: ShadcnRequest = await request.json();
    const { action, params } = body;

    if (!action || !Object.values(SHADCN_ACTIONS).includes(action as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing action' },
        { status: 400 }
      );
    }

    const result = await callShadcnMCP(action, params);

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
    console.error('Error in Shadcn MCP route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/mcp/shadcn/capabilities - Get available Shadcn MCP capabilities
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        actions: Object.values(SHADCN_ACTIONS),
        description: 'Shadcn UI component generation and management'
      }
    });
  } catch (error) {
    console.error('Error getting Shadcn MCP capabilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get capabilities' },
      { status: 500 }
    );
  }
}