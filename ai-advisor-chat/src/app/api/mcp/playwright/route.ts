import { NextRequest, NextResponse } from 'next/server';

// Playwright MCP service URL
const PLAYWRIGHT_MCP_URL = process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3004';

interface PlaywrightRequest {
  action: string;
  params?: Record<string, any>;
}

interface PlaywrightResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Playwright MCP actions
const PLAYWRIGHT_ACTIONS = {
  NAVIGATE: 'navigate',
  SCREENSHOT: 'screenshot',
  CLICK: 'click',
  FILL: 'fill',
  SELECT: 'select',
  HOVER: 'hover',
  GET_TEXT: 'getText',
  GET_ATTRIBUTE: 'getAttribute',
  WAIT_FOR_ELEMENT: 'waitForElement',
  WAIT_FOR_NAVIGATION: 'waitForNavigation',
  EXECUTE_SCRIPT: 'executeScript',
  GET_PAGE_TITLE: 'getPageTitle',
  GET_PAGE_URL: 'getPageUrl',
  GET_ELEMENT_COUNT: 'getElementCount',
  CHECK_ELEMENT_EXISTS: 'checkElementExists',
  GET_ELEMENT_POSITION: 'getElementPosition',
  GET_ELEMENT_SIZE: 'getElementSize',
  SCROLL_TO_ELEMENT: 'scrollToElement',
  TAKE_FULL_SCREENSHOT: 'takeFullScreenshot',
  GET_PERFORMANCE_METRICS: 'getPerformanceMetrics'
} as const;

async function callPlaywrightMCP(action: string, params?: Record<string, any>): Promise<PlaywrightResponse> {
  try {
    const response = await fetch(`${PLAYWRIGHT_MCP_URL}/api/playwright`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`Playwright MCP service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Playwright MCP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// POST /api/mcp/playwright - Call Playwright MCP service
export async function POST(request: NextRequest) {
  try {
    const body: PlaywrightRequest = await request.json();
    const { action, params } = body;

    if (!action || !Object.values(PLAYWRIGHT_ACTIONS).includes(action as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing action' },
        { status: 400 }
      );
    }

    // Validate URLs for security
    if (params?.url && !isValidUrl(params.url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Validate screenshot parameters
    if (action === 'screenshot' || action === 'takeFullScreenshot') {
      const format = params?.format || 'png';
      const allowedFormats = ['png', 'jpeg', 'webp'];

      if (!allowedFormats.includes(format)) {
        return NextResponse.json(
          { success: false, error: 'Invalid screenshot format' },
          { status: 400 }
        );
      }

      // Validate quality for jpeg/webp
      if (format !== 'png' && params?.quality) {
        const quality = parseInt(params.quality);
        if (isNaN(quality) || quality < 1 || quality > 100) {
          return NextResponse.json(
            { success: false, error: 'Quality must be between 1 and 100' },
            { status: 400 }
          );
        }
      }
    }

    const result = await callPlaywrightMCP(action, params);

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
    console.error('Error in Playwright MCP route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/mcp/playwright/capabilities - Get available Playwright MCP capabilities
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        actions: Object.values(PLAYWRIGHT_ACTIONS),
        description: 'Web automation and testing with Playwright'
      }
    });
  } catch (error) {
    console.error('Error getting Playwright MCP capabilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get capabilities' },
      { status: 500 }
    );
  }
}

// Security helper functions
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Allow only HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Block localhost and private networks in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname;

      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }

      // Block private IP ranges
      const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/
      ];

      if (privateRanges.some(range => range.test(hostname))) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Additional validation for browser automation parameters
function validateBrowserAction(action: string, params: Record<string, any>): boolean {
  // Validate selector
  if (params?.selector && typeof params.selector !== 'string') {
    return false;
  }

  // Validate timeout
  if (params?.timeout) {
    const timeout = parseInt(params.timeout);
    if (isNaN(timeout) || timeout < 1000 || timeout > 60000) {
      return false;
    }
  }

  // Validate script execution
  if (action === 'executeScript' && params?.script) {
    // Basic validation to prevent malicious script execution
    const script = params.script.toString();
    const forbiddenPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /document\.cookie/,
      /localStorage/,
      /sessionStorage/,
      /XMLHttpRequest/,
      /fetch\s*\(/,
      /window\./,
      /document\./,
      /alert\s*\(/,
      /confirm\s*\(/,
      /prompt\s*\(/
    ];

    return !forbiddenPatterns.some(pattern => pattern.test(script));
  }

  return true;
}