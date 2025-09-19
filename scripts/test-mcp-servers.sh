#!/bin/bash

# MCP Servers Test Script
# This script tests the Dockerized MCP servers for the AI Advisor App

set -e

echo "🧪 Testing MCP Servers for AI Advisor App..."

# Test MCP Proxy health
echo "🔍 Testing MCP Proxy health..."
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo "✅ MCP Proxy is healthy"
else
    echo "❌ MCP Proxy is not healthy"
    exit 1
fi

# Test GitHub MCP server
echo "🔍 Testing GitHub MCP server..."
GITHUB_HEALTH=$(curl -s http://localhost:8080/github/health 2>/dev/null || echo "failed")
if [[ "$GITHUB_HEALTH" == *"healthy"* ]] || [[ "$GITHUB_HEALTH" == *"ok"* ]]; then
    echo "✅ GitHub MCP server is healthy"
else
    echo "❌ GitHub MCP server is not healthy"
    echo "Response: $GITHUB_HEALTH"
fi

# Test Filesystem MCP server
echo "🔍 Testing Filesystem MCP server..."
FS_HEALTH=$(curl -s http://localhost:8080/filesystem/health 2>/dev/null || echo "failed")
if [[ "$FS_HEALTH" == *"healthy"* ]] || [[ "$FS_HEALTH" == *"ok"* ]]; then
    echo "✅ Filesystem MCP server is healthy"
else
    echo "❌ Filesystem MCP server is not healthy"
    echo "Response: $FS_HEALTH"
fi

# Test Shadcn MCP server
echo "🔍 Testing Shadcn MCP server..."
SHADCN_HEALTH=$(curl -s http://localhost:8080/shadcn/health 2>/dev/null || echo "failed")
if [[ "$SHADCN_HEALTH" == *"healthy"* ]] || [[ "$SHADCN_HEALTH" == *"ok"* ]]; then
    echo "✅ Shadcn MCP server is healthy"
else
    echo "❌ Shadcn MCP server is not healthy"
    echo "Response: $SHADCN_HEALTH"
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test GitHub tools list
echo "  Testing GitHub tools list..."
GITHUB_TOOLS=$(curl -s http://localhost:8080/github/tools 2>/dev/null || echo "failed")
if [[ "$GITHUB_TOOLS" == *"create_issue"* ]]; then
    echo "  ✅ GitHub tools endpoint working"
else
    echo "  ❌ GitHub tools endpoint failed"
fi

# Test Filesystem tools list
echo "  Testing Filesystem tools list..."
FS_TOOLS=$(curl -s http://localhost:8080/filesystem/tools 2>/dev/null || echo "failed")
if [[ "$FS_TOOLS" == *"read_file"* ]]; then
    echo "  ✅ Filesystem tools endpoint working"
else
    echo "  ❌ Filesystem tools endpoint failed"
fi

# Test Shadcn tools list
echo "  Testing Shadcn tools list..."
SHADCN_TOOLS=$(curl -s http://localhost:8080/shadcn/tools 2>/dev/null || echo "failed")
if [[ "$SHADCN_TOOLS" == *"get_component"* ]]; then
    echo "  ✅ Shadcn tools endpoint working"
else
    echo "  ❌ Shadcn tools endpoint failed"
fi

echo ""
echo "🎉 MCP Servers test complete!"
echo ""
echo "📊 Server Status:"
echo "   - MCP Proxy: $(curl -s http://localhost:8080/health 2>/dev/null || echo 'offline')"
echo "   - GitHub MCP: $(curl -s http://localhost:8080/github/health 2>/dev/null || echo 'offline')"
echo "   - Filesystem MCP: $(curl -s http://localhost:8080/filesystem/health 2>/dev/null || echo 'offline')"
echo "   - Shadcn MCP: $(curl -s http://localhost:8080/shadcn/health 2>/dev/null || echo 'offline')"
echo ""
echo "📈 Monitoring:"
echo "   - Grafana: http://localhost:3000"
echo "   - Prometheus: http://localhost:9090"