import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const SHADCN_API_BASE = 'https://www.shadcn.io/api/mcp';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// MCP Server setup
const server = new Server(
  {
    name: 'shadcn-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Helper function to make API requests
async function shadcnAPIRequest(endpoint, options = {}) {
  const url = `${SHADCN_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Advisor-App-MCP-Server/1.0.0',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Shadcn API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Register MCP tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'list_components',
        description: 'List all available Shadcn UI components',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category' },
            page: { type: 'number', description: 'Page number', default: 1 },
            per_page: { type: 'number', description: 'Items per page', default: 30 },
          },
        },
      },
      {
        name: 'get_component',
        description: 'Get detailed information about a specific Shadcn UI component',
        inputSchema: {
          type: 'object',
          properties: {
            componentName: { type: 'string', description: 'Component name (e.g., button, card, input)' },
          },
          required: ['componentName'],
        },
      },
      {
        name: 'get_component_demo',
        description: 'Get demo code for a specific Shadcn UI component',
        inputSchema: {
          type: 'object',
          properties: {
            componentName: { type: 'string', description: 'Component name' },
            framework: { type: 'string', enum: ['react', 'vue', 'svelte'], default: 'react' },
          },
          required: ['componentName'],
        },
      },
      {
        name: 'list_blocks',
        description: 'List all available Shadcn UI blocks',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category' },
            page: { type: 'number', description: 'Page number', default: 1 },
            per_page: { type: 'number', description: 'Items per page', default: 30 },
          },
        },
      },
      {
        name: 'get_block',
        description: 'Get detailed information about a specific Shadcn UI block',
        inputSchema: {
          type: 'object',
          properties: {
            blockName: { type: 'string', description: 'Block name (e.g., dashboard-01, login-02)' },
            includeComponents: { type: 'boolean', default: true },
          },
          required: ['blockName'],
        },
      },
      {
        name: 'get_component_metadata',
        description: 'Get metadata for a specific Shadcn UI component',
        inputSchema: {
          type: 'object',
          properties: {
            componentName: { type: 'string', description: 'Component name' },
          },
          required: ['componentName'],
        },
      },
      {
        name: 'get_directory_structure',
        description: 'Get the directory structure of the Shadcn UI repository',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path within the repository', default: 'v4 registry' },
            owner: { type: 'string', default: 'shadcn-ui' },
            repo: { type: 'string', default: 'ui' },
            branch: { type: 'string', default: 'main' },
          },
        },
      },
      {
        name: 'search_components',
        description: 'Search for components by name or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            page: { type: 'number', default: 1 },
            per_page: { type: 'number', default: 30 },
          },
          required: ['query'],
        },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_components':
        const components = await shadcnAPIRequest('/components', {
          method: 'GET',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              components: components.data || components,
              count: components.data?.length || components.length || 0,
              page: args.page || 1,
              per_page: args.per_page || 30
            }, null, 2)
          }]
        };

      case 'get_component':
        const component = await shadcnAPIRequest(`/components/${args.componentName}`, {
          method: 'GET',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(component, null, 2)
          }]
        };

      case 'get_component_demo':
        const demo = await shadcnAPIRequest(`/components/${args.componentName}/demo`, {
          method: 'GET',
          headers: {
            'X-Framework': args.framework || 'react',
          },
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              componentName: args.componentName,
              framework: args.framework || 'react',
              demo: demo
            }, null, 2)
          }]
        };

      case 'list_blocks':
        const blocks = await shadcnAPIRequest('/blocks', {
          method: 'GET',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              blocks: blocks.data || blocks,
              count: blocks.data?.length || blocks.length || 0,
              page: args.page || 1,
              per_page: args.per_page || 30,
              category: args.category
            }, null, 2)
          }]
        };

      case 'get_block':
        const block = await shadcnAPIRequest(`/blocks/${args.blockName}`, {
          method: 'GET',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              blockName: args.blockName,
              includeComponents: args.includeComponents !== false,
              block: block
            }, null, 2)
          }]
        };

      case 'get_component_metadata':
        const metadata = await shadcnAPIRequest(`/components/${args.componentName}/metadata`, {
          method: 'GET',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(metadata, null, 2)
          }]
        };

      case 'get_directory_structure':
        const structure = await shadcnAPIRequest('/directory', {
          method: 'GET',
          headers: {
            'X-Path': args.path || 'v4 registry',
            'X-Owner': args.owner || 'shadcn-ui',
            'X-Repo': args.repo || 'ui',
            'X-Branch': args.branch || 'main',
          },
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              path: args.path || 'v4 registry',
              owner: args.owner || 'shadcn-ui',
              repo: args.repo || 'ui',
              branch: args.branch || 'main',
              structure: structure
            }, null, 2)
          }]
        };

      case 'search_components':
        const searchResults = await shadcnAPIRequest(`/search?q=${encodeURIComponent(args.query)}`, {
          method: 'GET',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: args.query,
              results: searchResults.data || searchResults,
              count: searchResults.data?.length || searchResults.length || 0,
              page: args.page || 1,
              per_page: args.per_page || 30
            }, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('Error calling Shadcn API:', error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api_base: SHADCN_API_BASE
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Shadcn Server running on port ${PORT}`);
  console.log(`Shadcn API base: ${SHADCN_API_BASE}`);
});

export default app;