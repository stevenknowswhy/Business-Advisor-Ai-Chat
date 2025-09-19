# MCP Servers Setup for AI Advisor App

This guide covers the setup and configuration of MCP (Model-Controlled Protocol) servers in Docker containers for the AI Advisor App.

## Overview

The MCP server infrastructure provides isolated, scalable services for:
- **GitHub Operations**: Issue management, repository access, pull requests
- **Filesystem Operations**: File reading, writing, directory management
- **Shadcn UI Operations**: Component and block management for UI development

## Prerequisites

- Docker and Docker Compose installed
- Claude Code with MCP support
- GitHub token for GitHub MCP server

## Setup Instructions

### 1. Environment Configuration

Create and configure `.env.mcp`:

```bash
cp .env.mcp.example .env.mcp
```

Edit `.env.mcp` and set the required values:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `MCP_DB_PASSWORD`: Database password
- `GRAFANA_PASSWORD`: Grafana admin password
- `JWT_SECRET`: JWT secret for authentication

### 2. Start MCP Servers

```bash
./scripts/start-mcp-servers.sh
```

This will:
- Start all Docker containers
- Wait for services to be healthy
- Test connectivity
- Display available endpoints

### 3. Test MCP Servers

```bash
./scripts/test-mcp-servers.sh
```

### 4. Stop MCP Servers

```bash
./scripts/stop-mcp-servers.sh
```

## Available Services

### MCP Servers
- **GitHub MCP**: `http://localhost:8080/github`
- **Filesystem MCP**: `http://localhost:8080/filesystem`
- **Shadcn MCP**: `http://localhost:8080/shadcn`
- **MCP Proxy**: `http://localhost:8080`

### Monitoring
- **Grafana**: `http://localhost:3000`
- **Prometheus**: `http://localhost:9090`

### Documentation
- **MCP Documentation**: `http://localhost:8081`

## Claude Code Integration

The MCP servers are configured to work with Claude Code through `.claude/mcp.json`. The configuration includes:

### GitHub MCP Server
- Repository management
- Issue creation and management
- Pull request operations
- Code search functionality

### Filesystem MCP Server
- File reading and writing
- Directory operations
- Path sanitization and security
- Workspace management

### Shadcn MCP Server
- Component retrieval and management
- Block operations
- UI component integration

## Security Features

- **Path Sanitization**: Prevents directory traversal attacks
- **Environment Variables**: Sensitive data handled through environment configuration
- **Rate Limiting**: Nginx configuration prevents abuse
- **Health Checks**: Monitoring for service availability
- **Non-root Containers**: Docker containers run with limited privileges

## Development

### Adding New MCP Servers

1. Create server directory in `mcp-servers/`
2. Implement server following existing patterns
3. Create `Dockerfile` for containerization
4. Update `docker-compose.mcp.yml`
5. Configure Nginx proxy in `mcp-servers/proxy/conf.d/`
6. Update Claude Code configuration in `.claude/mcp.json`

### Testing

```bash
# Test configuration
./scripts/test-mcp-config.sh

# Test running servers
./scripts/test-mcp-servers.sh

# View logs
docker-compose -f docker-compose.mcp.yml logs -f [service-name]
```

## Troubleshooting

### Common Issues

1. **Container not starting**: Check Docker logs with `docker logs [container-name]`
2. **Port conflicts**: Ensure ports 3000-3003, 5432, 6379, 8080-8081, 9090 are available
3. **Environment variables**: Verify all required variables are set in `.env.mcp`
4. **Permissions**: Ensure scripts are executable with `chmod +x scripts/*.sh`

### Service Status

Check service status:
```bash
docker-compose -f docker-compose.mcp.yml ps
```

### Logs

View service logs:
```bash
docker-compose -f docker-compose.mcp.yml logs -f mcp-github
docker-compose -f docker-compose.mcp.yml logs -f mcp-filesystem
docker-compose -f docker-compose.mcp.yml logs -f mcp-shadcn
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │    │   MCP Proxy     │    │   Monitoring    │
│                 │    │    (Nginx)      │    │                 │
│  ┌─────────────┐│    │                 │    │  ┌─────────────┐│
│  │   GitHub    ││◄──►│                 │◄──►│  │  Grafana    ││
│  │     MCP     ││    │                 │    │  └─────────────┘│
│  └─────────────┘│    │                 │    │                 │
│                 │    │                 │    │  ┌─────────────┐│
│  ┌─────────────┐│    │                 │    │  │ Prometheus  ││
│  │ Filesystem  ││◄──►│                 │    │  └─────────────┘│
│  │     MCP     ││    │                 │    │                 │
│  └─────────────┘│    │                 │    └─────────────────┘
│                 │    │                 │
│  ┌─────────────┐│    │                 │
│  │   Shadcn    ││◄──►│                 │
│  │     MCP     ││    │                 │
│  └─────────────┘│    └─────────────────┘
└─────────────────┘
```

## Performance

The MCP server infrastructure is optimized for:
- **High Availability**: Health checks and automatic restarts
- **Scalability**: Docker Compose supports service scaling
- **Monitoring**: Comprehensive metrics and logging
- **Security**: Multiple layers of security protection

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review service logs
3. Verify environment configuration
4. Ensure Docker is running properly