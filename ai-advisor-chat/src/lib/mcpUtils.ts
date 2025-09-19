// MCP (Model Context Protocol) utility functions
export interface MCPService {
  name: string;
  url: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  description: string;
  capabilities: string[];
}

export interface MCPRequest {
  action: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MCPCapabilities {
  actions: string[];
  description: string;
}

// MCP service endpoints
const MCP_ENDPOINTS = {
  status: '/api/mcp/status',
  github: '/api/mcp/github',
  filesystem: '/api/mcp/filesystem',
  shadcn: '/api/mcp/shadcn',
  playwright: '/api/mcp/playwright'
} as const;

// Service configurations
const MCP_SERVICES = {
  github: {
    name: 'GitHub',
    description: 'GitHub integration for repository management',
    baseUrl: process.env.GITHUB_MCP_URL || 'http://localhost:3001',
    capabilities: [
      'searchRepos',
      'getRepo',
      'getIssues',
      'getPullRequests',
      'createIssue',
      'createPullRequest',
      'getUserRepos',
      'getRepoContent',
      'analyzeCode'
    ]
  },
  filesystem: {
    name: 'Filesystem',
    description: 'Filesystem operations and document processing',
    baseUrl: process.env.FILESYSTEM_MCP_URL || 'http://localhost:3002',
    capabilities: [
      'readFile',
      'writeFile',
      'listDirectory',
      'createDirectory',
      'deleteFile',
      'moveFile',
      'copyFile',
      'searchFiles',
      'getFileInfo',
      'analyzeDocument'
    ]
  },
  shadcn: {
    name: 'Shadcn',
    description: 'Shadcn UI component generation and management',
    baseUrl: process.env.SHADCN_MCP_URL || 'http://localhost:3003',
    capabilities: [
      'getComponent',
      'listComponents',
      'getComponentDemo',
      'getComponentMetadata',
      'generateComponent',
      'getDirectoryStructure',
      'getBlock',
      'listBlocks'
    ]
  },
  playwright: {
    name: 'Playwright',
    description: 'Web automation and testing',
    baseUrl: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3004',
    capabilities: [
      'navigate',
      'screenshot',
      'click',
      'fill',
      'select',
      'hover',
      'getText',
      'getAttribute',
      'waitForElement',
      'waitForNavigation',
      'executeScript',
      'getPageTitle',
      'getPageUrl',
      'getElementCount',
      'checkElementExists',
      'getElementPosition',
      'getElementSize',
      'scrollToElement',
      'takeFullScreenshot',
      'getPerformanceMetrics'
    ]
  }
} as const;

// Generic MCP service caller
export async function callMCPService(
  serviceName: keyof typeof MCP_SERVICES,
  action: string,
  params?: Record<string, any>
): Promise<MCPResponse> {
  try {
    const service = MCP_SERVICES[serviceName];
    const endpoint = MCP_ENDPOINTS[serviceName];

    if (!service || !endpoint) {
      return {
        success: false,
        error: `Invalid MCP service: ${serviceName}`
      };
    }

    // Validate action
    const isValidAction = service.capabilities.some(capability => capability === action);
    if (!isValidAction) {
      return {
        success: false,
        error: `Invalid action '${action}' for service '${serviceName}'`
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `MCP service error: ${response.statusText} - ${errorText}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error calling MCP service '${serviceName}':`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get MCP service status
export async function getMCPServiceStatus(): Promise<{
  services: MCPService[];
  summary: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
} | null> {
  try {
    const response = await fetch(MCP_ENDPOINTS.status);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      console.error('Failed to get MCP status:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error getting MCP service status:', error);
    return null;
  }
}

// Get MCP service capabilities
export async function getMCPServiceCapabilities(
  serviceName: keyof typeof MCP_SERVICES
): Promise<MCPCapabilities | null> {
  try {
    const endpoint = MCP_ENDPOINTS[serviceName];
    const response = await fetch(`${endpoint}/capabilities`);

    if (!response.ok) {
      throw new Error(`Failed to get capabilities for ${serviceName}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`Error getting MCP service capabilities for ${serviceName}:`, error);
    return null;
  }
}

// GitHub MCP helper functions
export const githubMCP = {
  searchRepositories: (query: string, language?: string) =>
    callMCPService('github', 'searchRepos', { query, language }),

  getRepository: (owner: string, repo: string) =>
    callMCPService('github', 'getRepo', { owner, repo }),

  getIssues: (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') =>
    callMCPService('github', 'getIssues', { owner, repo, state }),

  getPullRequests: (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') =>
    callMCPService('github', 'getPullRequests', { owner, repo, state }),

  createIssue: (owner: string, repo: string, title: string, body: string) =>
    callMCPService('github', 'createIssue', { owner, repo, title, body }),

  createPullRequest: (owner: string, repo: string, title: string, body: string, head: string, base: string) =>
    callMCPService('github', 'createPullRequest', { owner, repo, title, body, head, base }),

  analyzeCode: (owner: string, repo: string, path: string) =>
    callMCPService('github', 'analyzeCode', { owner, repo, path })
};

// Filesystem MCP helper functions
export const filesystemMCP = {
  readFile: (path: string) =>
    callMCPService('filesystem', 'readFile', { path }),

  writeFile: (path: string, content: string) =>
    callMCPService('filesystem', 'writeFile', { path, content }),

  listDirectory: (path: string) =>
    callMCPService('filesystem', 'listDirectory', { path }),

  createDirectory: (path: string) =>
    callMCPService('filesystem', 'createDirectory', { path }),

  searchFiles: (path: string, pattern: string) =>
    callMCPService('filesystem', 'searchFiles', { path, pattern }),

  getFileInfo: (path: string) =>
    callMCPService('filesystem', 'getFileInfo', { path }),

  analyzeDocument: (path: string) =>
    callMCPService('filesystem', 'analyzeDocument', { path })
};

// Shadcn MCP helper functions
export const shadcnMCP = {
  getComponent: (componentName: string) =>
    callMCPService('shadcn', 'getComponent', { componentName }),

  listComponents: () =>
    callMCPService('shadcn', 'listComponents', {}),

  getComponentDemo: (componentName: string) =>
    callMCPService('shadcn', 'getComponentDemo', { componentName }),

  getComponentMetadata: (componentName: string) =>
    callMCPService('shadcn', 'getComponentMetadata', { componentName }),

  generateComponent: (description: string, framework: 'react' | 'vue' | 'svelte' = 'react') =>
    callMCPService('shadcn', 'generateComponent', { description, framework }),

  getBlock: (blockName: string) =>
    callMCPService('shadcn', 'getBlock', { blockName }),

  listBlocks: (category?: string) =>
    callMCPService('shadcn', 'listBlocks', { category })
};

// Playwright MCP helper functions
export const playwrightMCP = {
  navigate: (url: string) =>
    callMCPService('playwright', 'navigate', { url }),

  screenshot: (selector?: string, options?: { format?: 'png' | 'jpeg' | 'webp'; quality?: number }) =>
    callMCPService('playwright', 'screenshot', { selector, ...options }),

  click: (selector: string) =>
    callMCPService('playwright', 'click', { selector }),

  fill: (selector: string, value: string) =>
    callMCPService('playwright', 'fill', { selector, value }),

  getText: (selector: string) =>
    callMCPService('playwright', 'getText', { selector }),

  waitForElement: (selector: string, timeout?: number) =>
    callMCPService('playwright', 'waitForElement', { selector, timeout }),

  executeScript: (script: string) =>
    callMCPService('playwright', 'executeScript', { script }),

  getPageTitle: () =>
    callMCPService('playwright', 'getPageTitle', {}),

  getPageUrl: () =>
    callMCPService('playwright', 'getPageUrl', {}),

  checkElementExists: (selector: string) =>
    callMCPService('playwright', 'checkElementExists', { selector }),

  takeFullScreenshot: (options?: { format?: 'png' | 'jpeg' | 'webp'; quality?: number }) =>
    callMCPService('playwright', 'takeFullScreenshot', { ...options }),

  getPerformanceMetrics: () =>
    callMCPService('playwright', 'getPerformanceMetrics', {})
};

// Utility functions for MCP integration
export const mcpUtils = {
  // Check if MCP services are available
  async isAvailable(): Promise<boolean> {
    const status = await getMCPServiceStatus();
    return status !== null && status.summary.online > 0;
  },

  // Get online services
  async getOnlineServices(): Promise<string[]> {
    const status = await getMCPServiceStatus();
    if (!status) return [];

    return status.services
      .filter(service => service.status === 'online')
      .map(service => service.name);
  },

  // Get service health summary
  async getHealthSummary(): Promise<{
    healthy: boolean;
    totalServices: number;
    onlineServices: number;
    issues: string[];
  }> {
    const status = await getMCPServiceStatus();
    if (!status) {
      return {
        healthy: false,
        totalServices: 0,
        onlineServices: 0,
        issues: ['Unable to fetch MCP service status']
      };
    }

    const issues: string[] = [];
    if (status.summary.offline > 0) {
      issues.push(`${status.summary.offline} services are offline`);
    }
    if (status.summary.error > 0) {
      issues.push(`${status.summary.error} services have errors`);
    }

    return {
      healthy: status.summary.online === status.summary.total,
      totalServices: status.summary.total,
      onlineServices: status.summary.online,
      issues
    };
  }
};