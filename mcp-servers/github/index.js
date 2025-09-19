import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk';
import { Octokit } from '@octokit/rest';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// MCP Server setup
const server = new Server({
  name: 'github-mcp-server',
  version: '1.0.0',
});

// Register MCP tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'create_issue',
        description: 'Create a GitHub issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'Issue title' },
            body: { type: 'string', description: 'Issue body' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'search_repositories',
        description: 'Search GitHub repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            page: { type: 'number', description: 'Page number', default: 1 },
            per_page: { type: 'number', description: 'Results per page', default: 30 },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_repository',
        description: 'Get repository information',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'list_issues',
        description: 'List repository issues',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
            page: { type: 'number', default: 1 },
            per_page: { type: 'number', default: 30 },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'create_pull_request',
        description: 'Create a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'PR title' },
            body: { type: 'string', description: 'PR body' },
            head: { type: 'string', description: 'Head branch' },
            base: { type: 'string', description: 'Base branch' },
          },
          required: ['owner', 'repo', 'title', 'head', 'base'],
        },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_issue':
        const issue = await octokit.rest.issues.create({
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          body: args.body,
          labels: args.labels,
        });
        return { content: [{ type: 'text', text: JSON.stringify(issue.data, null, 2) }] };

      case 'search_repositories':
        const searchResults = await octokit.rest.search.repos({
          q: args.query,
          page: args.page,
          per_page: args.per_page,
        });
        return { content: [{ type: 'text', text: JSON.stringify(searchResults.data, null, 2) }] };

      case 'get_repository':
        const repo = await octokit.rest.repos.get({
          owner: args.owner,
          repo: args.repo,
        });
        return { content: [{ type: 'text', text: JSON.stringify(repo.data, null, 2) }] };

      case 'list_issues':
        const issues = await octokit.rest.issues.listForRepo({
          owner: args.owner,
          repo: args.repo,
          state: args.state,
          page: args.page,
          per_page: args.per_page,
        });
        return { content: [{ type: 'text', text: JSON.stringify(issues.data, null, 2) }] };

      case 'create_pull_request':
        const pr = await octokit.rest.pulls.create({
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          body: args.body,
          head: args.head,
          base: args.base,
        });
        return { content: [{ type: 'text', text: JSON.stringify(pr.data, null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP GitHub Server running on port ${PORT}`);
});

export default app;