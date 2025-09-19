import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, copyFileSync } from 'fs';
import { join, dirname, basename, extname, parse } from 'path';
import { watch } from 'chokidar';
import { lookup } from 'mime-types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/app/workspace';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// MCP Server setup
const server = new Server({
  name: 'filesystem-mcp-server',
  version: '1.0.0',
});

// Helper functions
function sanitizePath(path) {
  // Prevent directory traversal attacks
  const sanitized = path.replace(/\.\./g, '').replace(/^\/+/, '');
  return join(WORKSPACE_ROOT, sanitized);
}

function getFileInfo(filePath) {
  try {
    const stats = statSync(filePath);
    return {
      name: basename(filePath),
      path: filePath,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      mimeType: stats.isFile() ? lookup(filePath) || 'application/octet-stream' : null,
    };
  } catch (error) {
    throw new Error(`Cannot access file: ${error.message}`);
  }
}

// Register MCP tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Read file contents',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path relative to workspace' },
            encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path relative to workspace' },
            content: { type: 'string', description: 'File content' },
            encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' },
            create_dirs: { type: 'boolean', default: true },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_directory',
        description: 'List directory contents',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path relative to workspace', default: '.' },
            recursive: { type: 'boolean', default: false },
            include_hidden: { type: 'boolean', default: false },
          },
        },
      },
      {
        name: 'create_directory',
        description: 'Create directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path relative to workspace' },
            recursive: { type: 'boolean', default: true },
          },
          required: ['path'],
        },
      },
      {
        name: 'delete_file',
        description: 'Delete file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File or directory path relative to workspace' },
            recursive: { type: 'boolean', default: false },
          },
          required: ['path'],
        },
      },
      {
        name: 'move_file',
        description: 'Move or rename file',
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path' },
            destination: { type: 'string', description: 'Destination path' },
            overwrite: { type: 'boolean', default: false },
          },
          required: ['source', 'destination'],
        },
      },
      {
        name: 'copy_file',
        description: 'Copy file',
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path' },
            destination: { type: 'string', description: 'Destination path' },
            overwrite: { type: 'boolean', default: false },
          },
          required: ['source', 'destination'],
        },
      },
      {
        name: 'search_files',
        description: 'Search for files by pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern (glob)' },
            path: { type: 'string', description: 'Search path', default: '.' },
            case_sensitive: { type: 'boolean', default: false },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'get_file_info',
        description: 'Get file metadata',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
          },
          required: ['path'],
        },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file':
        const filePath = sanitizePath(args.path);
        if (!existsSync(filePath)) {
          throw new Error(`File not found: ${args.path}`);
        }
        const content = readFileSync(filePath, args.encoding === 'base64' ? 'base64' : 'utf8');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              content,
              encoding: args.encoding,
              path: args.path,
              ...getFileInfo(filePath)
            }, null, 2)
          }]
        };

      case 'write_file':
        const writePath = sanitizePath(args.path);
        if (args.create_dirs) {
          const dir = dirname(writePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
        }
        writeFileSync(writePath, args.content, args.encoding === 'base64' ? 'base64' : 'utf8');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: args.path,
              ...getFileInfo(writePath)
            }, null, 2)
          }]
        };

      case 'list_directory':
        const listPath = sanitizePath(args.path);
        if (!existsSync(listPath)) {
          throw new Error(`Directory not found: ${args.path}`);
        }

        const items = readdirSync(listPath, {
          withFileTypes: true,
          recursive: args.recursive
        });

        const results = items.map(item => {
          const fullPath = join(listPath, item.name);
          return getFileInfo(fullPath);
        }).filter(item => args.include_hidden || !item.name.startsWith('.'));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              path: args.path,
              items: results,
              count: results.length
            }, null, 2)
          }]
        };

      case 'create_directory':
        const dirPath = sanitizePath(args.path);
        mkdirSync(dirPath, { recursive: args.recursive });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: args.path,
              ...getFileInfo(dirPath)
            }, null, 2)
          }]
        };

      case 'delete_file':
        const deletePath = sanitizePath(args.path);
        if (!existsSync(deletePath)) {
          throw new Error(`File not found: ${args.path}`);
        }

        if (statSync(deletePath).isDirectory() && args.recursive) {
          // Recursive directory deletion (simplified - in production, use proper recursive delete)
          rmdirSync(deletePath, { recursive: true });
        } else {
          unlinkSync(deletePath);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              deleted: args.path
            }, null, 2)
          }]
        };

      case 'move_file':
        const sourcePath = sanitizePath(args.source);
        const destPath = sanitizePath(args.destination);

        if (!existsSync(sourcePath)) {
          throw new Error(`Source file not found: ${args.source}`);
        }

        if (existsSync(destPath) && !args.overwrite) {
          throw new Error(`Destination already exists: ${args.destination}`);
        }

        // In a real implementation, you'd use fs.rename or fs.copyFile + unlink
        // For simplicity, we'll copy and then delete
        copyFileSync(sourcePath, destPath);
        unlinkSync(sourcePath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              source: args.source,
              destination: args.destination,
              ...getFileInfo(destPath)
            }, null, 2)
          }]
        };

      case 'copy_file':
        const copySourcePath = sanitizePath(args.source);
        const copyDestPath = sanitizePath(args.destination);

        if (!existsSync(copySourcePath)) {
          throw new Error(`Source file not found: ${args.source}`);
        }

        if (existsSync(copyDestPath) && !args.overwrite) {
          throw new Error(`Destination already exists: ${args.destination}`);
        }

        copyFileSync(copySourcePath, copyDestPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              source: args.source,
              destination: args.destination,
              ...getFileInfo(copyDestPath)
            }, null, 2)
          }]
        };

      case 'search_files':
        const searchPath = sanitizePath(args.path);
        if (!existsSync(searchPath)) {
          throw new Error(`Search path not found: ${args.path}`);
        }

        // Simplified search - in production, use proper glob implementation
        const searchResults = [];
        const searchRecursive = (currentPath, pattern) => {
          const items = readdirSync(currentPath, { withFileTypes: true });

          for (const item of items) {
            const fullPath = join(currentPath, item.name);

            if (item.isDirectory()) {
              searchRecursive(fullPath, pattern);
            } else if (item.isFile()) {
              const relativePath = fullPath.replace(WORKSPACE_ROOT + '/', '');
              if (new RegExp(pattern.replace(/\*/g, '.*'), args.case_sensitive ? '' : 'i').test(relativePath)) {
                searchResults.push(getFileInfo(fullPath));
              }
            }
          }
        };

        searchRecursive(searchPath, args.pattern);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pattern: args.pattern,
              path: args.path,
              results: searchResults,
              count: searchResults.length
            }, null, 2)
          }]
        };

      case 'get_file_info':
        const infoPath = sanitizePath(args.path);
        if (!existsSync(infoPath)) {
          throw new Error(`File not found: ${args.path}`);
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(getFileInfo(infoPath), null, 2)
          }]
        };

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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    workspace_root: WORKSPACE_ROOT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Filesystem Server running on port ${PORT}`);
  console.log(`Workspace root: ${WORKSPACE_ROOT}`);
});

export default app;