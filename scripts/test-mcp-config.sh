#!/bin/bash

# MCP Configuration Test Script
# This script tests the MCP configuration files and setup

set -e

echo "🧪 Testing MCP Configuration for AI Advisor App..."

# Check if required files exist
echo "🔍 Checking configuration files..."

required_files=(
    ".claude/mcp.json"
    ".env.mcp"
    "docker-compose.mcp.yml"
    "scripts/start-mcp-servers.sh"
    "scripts/stop-mcp-servers.sh"
    "scripts/test-mcp-servers.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

# Check MCP server directories
echo ""
echo "🔍 Checking MCP server directories..."

server_dirs=(
    "mcp-servers/github"
    "mcp-servers/filesystem"
    "mcp-servers/shadcn"
    "mcp-servers/proxy"
)

for dir in "${server_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir directory exists"
    else
        echo "❌ $dir directory is missing"
    fi
done

# Check Dockerfile existence
echo ""
echo "🔍 Checking Dockerfiles..."

dockerfiles=(
    "mcp-servers/github/Dockerfile"
    "mcp-servers/filesystem/Dockerfile"
    "mcp-servers/shadcn/Dockerfile"
)

for dockerfile in "${dockerfiles[@]}"; do
    if [ -f "$dockerfile" ]; then
        echo "✅ $dockerfile exists"
    else
        echo "❌ $dockerfile is missing"
    fi
done

# Check MCP server implementations
echo ""
echo "🔍 Checking MCP server implementations..."

server_files=(
    "mcp-servers/github/index.js"
    "mcp-servers/github/package.json"
    "mcp-servers/filesystem/index.js"
    "mcp-servers/filesystem/package.json"
    "mcp-servers/shadcn/index.js"
    "mcp-servers/shadcn/package.json"
)

for file in "${server_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

# Check Nginx configuration
echo ""
echo "🔍 Checking Nginx configuration..."

nginx_files=(
    "mcp-servers/proxy/nginx.conf"
    "mcp-servers/proxy/conf.d/mcp-github.conf"
)

for file in "${nginx_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

# Validate JSON configuration
echo ""
echo "🔍 Validating JSON configuration..."

if [ -f ".claude/mcp.json" ]; then
    if python3 -m json.tool .claude/mcp.json > /dev/null 2>&1; then
        echo "✅ .claude/mcp.json is valid JSON"
    else
        echo "❌ .claude/mcp.json contains invalid JSON"
    fi
fi

# Check environment variables
echo ""
echo "🔍 Checking environment variables..."

if [ -f ".env.mcp" ]; then
    echo "✅ .env.mcp exists"
    echo "📝 Environment variables defined:"
    grep -v '^#' .env.mcp | grep '=' | while read line; do
        var_name=$(echo "$line" | cut -d'=' -f1)
        var_value=$(echo "$line" | cut -d'=' -f2)
        if [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"placeholder"* ]]; then
            echo "  ⚠️  $var_name needs to be configured"
        else
            echo "  ✅ $var_name is configured"
        fi
    done
else
    echo "❌ .env.mcp is missing"
fi

# Check Docker availability
echo ""
echo "🔍 Checking Docker availability..."

if command -v docker > /dev/null 2>&1; then
    echo "✅ Docker is installed"
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker is running"
    else
        echo "❌ Docker is not running"
    fi
else
    echo "❌ Docker is not installed"
fi

if command -v docker-compose > /dev/null 2>&1; then
    echo "✅ Docker Compose is installed"
else
    echo "❌ Docker Compose is not installed"
fi

echo ""
echo "🎉 MCP Configuration test complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set up environment variables in .env.mcp"
echo "   2. Run './scripts/start-mcp-servers.sh' to start the servers"
echo "   3. Run './scripts/test-mcp-servers.sh' to test connectivity"
echo "   4. Configure Claude Code to use the MCP servers"