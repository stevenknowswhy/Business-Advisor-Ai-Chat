import { NextRequest, NextResponse } from 'next/server';

// Filesystem MCP service URL
const FILESYSTEM_MCP_URL = process.env.FILESYSTEM_MCP_URL || 'http://localhost:3002';

interface FilesystemRequest {
  action: string;
  params?: Record<string, any>;
}

interface FilesystemResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Filesystem MCP actions
const FILESYSTEM_ACTIONS = {
  READ_FILE: 'readFile',
  WRITE_FILE: 'writeFile',
  LIST_DIRECTORY: 'listDirectory',
  CREATE_DIRECTORY: 'createDirectory',
  DELETE_FILE: 'deleteFile',
  MOVE_FILE: 'moveFile',
  COPY_FILE: 'copyFile',
  SEARCH_FILES: 'searchFiles',
  GET_FILE_INFO: 'getFileInfo',
  ANALYZE_DOCUMENT: 'analyzeDocument'
} as const;

async function callFilesystemMCP(action: string, params?: Record<string, any>): Promise<FilesystemResponse> {
  try {
    const response = await fetch(`${FILESYSTEM_MCP_URL}/api/filesystem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`Filesystem MCP service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Filesystem MCP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// POST /api/mcp/filesystem - Call Filesystem MCP service
export async function POST(request: NextRequest) {
  try {
    const body: FilesystemRequest = await request.json();
    const { action, params } = body;

    if (!action || !Object.values(FILESYSTEM_ACTIONS).includes(action as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing action' },
        { status: 400 }
      );
    }

    // Validate file paths for security
    if (params?.path || params?.sourcePath || params?.destinationPath) {
      const path = params.path || params.sourcePath || params.destinationPath;
      if (!isValidPath(path)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file path' },
          { status: 400 }
        );
      }
    }

    const result = await callFilesystemMCP(action, params);

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
    console.error('Error in Filesystem MCP route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/mcp/filesystem/capabilities - Get available Filesystem MCP capabilities
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        actions: Object.values(FILESYSTEM_ACTIONS),
        description: 'Filesystem operations and document processing'
      }
    });
  } catch (error) {
    console.error('Error getting Filesystem MCP capabilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get capabilities' },
      { status: 500 }
    );
  }
}

// Security helper functions
function isValidPath(path: string): boolean {
  // Prevent directory traversal attacks
  const normalizedPath = path.replace(/^\.+/, '').replace(/\/\.+/g, '/');

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /^\/etc/,         // System directories
    /^\/usr/,         // System directories
    /^\/bin/,         // System directories
    /^\/sbin/,        // System directories
    /^\/var/,         // System directories
    /\.env$/,         // Environment files
    /\.key$/,         // Key files
    /\.pem$/,         // Certificate files
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(normalizedPath));
}

// Additional security validation for write operations
function validateWriteOperation(params: Record<string, any>): boolean {
  if (params.path && params.content) {
    // Validate file size
    const content = params.content;
    if (typeof content === 'string' && content.length > 10 * 1024 * 1024) { // 10MB limit
      return false;
    }

    // Validate file extensions for write operations
    const allowedExtensions = [
      '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx',
      '.css', '.html', '.xml', '.csv', '.log', '.yaml', '.yml'
    ];

    const extension = params.path.toLowerCase().split('.').pop();
    if (extension && !allowedExtensions.includes(`.${extension}`)) {
      return false;
    }
  }

  return true;
}