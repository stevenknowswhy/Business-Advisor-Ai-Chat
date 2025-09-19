#!/bin/bash

# MCP Servers Startup Script
# This script starts the Dockerized MCP servers for the AI Advisor App

set -e

echo "🚀 Starting MCP Servers for AI Advisor App..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load environment variables
if [ -f .env.mcp ]; then
    echo "📝 Loading environment variables from .env.mcp"
    export $(grep -v '^#' .env.mcp | xargs)
fi

# Change to the project directory
cd "$(dirname "$0")/.."

# Start the MCP servers using Docker Compose
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.mcp.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.mcp.yml ps

# Test connectivity to MCP servers
echo "🧪 Testing MCP server connectivity..."

# Test GitHub MCP server
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ MCP Proxy is running"
else
    echo "❌ MCP Proxy is not responding"
fi

# Test individual servers
for service in mcp-github mcp-filesystem mcp-shadcn; do
    if curl -s http://localhost:8080/${service#mcp-}/health > /dev/null; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not responding"
    fi
done

echo "🎉 MCP Servers startup complete!"
echo ""
echo "📋 Available endpoints:"
echo "   - MCP Proxy: http://localhost:8080"
echo "   - GitHub MCP: http://localhost:8080/github"
echo "   - Filesystem MCP: http://localhost:8080/filesystem"
echo "   - Shadcn MCP: http://localhost:8080/shadcn"
echo ""
echo "📊 Monitoring:"
echo "   - Grafana: http://localhost:3000"
echo "   - Prometheus: http://localhost:9090"
echo ""
echo "📖 Documentation: http://localhost:8081"
echo ""
echo "To stop the servers, run: ./scripts/stop-mcp-servers.sh"