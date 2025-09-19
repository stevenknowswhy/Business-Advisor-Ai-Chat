#!/usr/bin/env node

/**
 * Simple GitHub MCP Server for testing
 * Bypasses SDK issues and provides basic functionality
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Octokit } from '@octokit/rest';

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

// Available tools
const tools = [
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
    description: 'Search for GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        per_page: { type: 'number', default: 10, description: 'Results per page' },
        page: { type: 'number', default: 1, description: 'Page number' },
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
];

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'github-mcp-server',
    timestamp: new Date().toISOString(),
  });
});

app.get('/tools', (req, res) => {
  res.json({ tools });
});

app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body.params;

    let result;
    switch (name) {
      case 'create_issue':
        result = await createIssue(args);
        break;
      case 'search_repositories':
        result = await searchRepositories(args);
        break;
      case 'get_repository':
        result = await getRepository(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result,
    });
  } catch (error) {
    console.error('Error in tool call:', error);
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32000,
        message: error.message,
      },
    });
  }
});

// Tool implementations
async function createIssue(args) {
  const { owner, repo, title, body, labels = [] } = args;

  const issue = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
    labels,
  });

  return {
    success: true,
    issue: {
      id: issue.data.id,
      number: issue.data.number,
      title: issue.data.title,
      html_url: issue.data.html_url,
      state: issue.data.state,
    },
    timestamp: new Date().toISOString(),
  };
}

async function searchRepositories(args) {
  const { query, per_page = 10, page = 1 } = args;

  const search = await octokit.search.repos({
    q: query,
    per_page,
    page,
  });

  return {
    success: true,
    repositories: search.data.items.map(repo => ({
      id: repo.id,
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      html_url: repo.html_url,
    })),
    total_count: search.data.total_count,
    page,
    per_page,
    timestamp: new Date().toISOString(),
  };
}

async function getRepository(args) {
  const { owner, repo } = args;

  const repository = await octokit.repos.get({
    owner,
    repo,
  });

  return {
    success: true,
    repository: {
      id: repository.data.id,
      name: repository.data.full_name,
      description: repository.data.description,
      stars: repository.data.stargazers_count,
      forks: repository.data.forks_count,
      language: repository.data.language,
      html_url: repository.data.html_url,
      clone_url: repository.data.clone_url,
      open_issues: repository.data.open_issues_count,
      created_at: repository.data.created_at,
      updated_at: repository.data.updated_at,
    },
    timestamp: new Date().toISOString(),
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`🔧 GitHub MCP Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛠️  Tools available: ${tools.length}`);
});

export default app;