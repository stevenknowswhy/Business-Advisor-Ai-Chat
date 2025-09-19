#!/bin/bash

# MCP Servers Stop Script
# This script stops the Dockerized MCP servers for the AI Advisor App

set -e

echo "🛑 Stopping MCP Servers for AI Advisor App..."

# Change to the project directory
cd "$(dirname "$0")/.."

# Stop the MCP servers using Docker Compose
echo "🐳 Stopping Docker containers..."
docker-compose -f docker-compose.mcp.yml down

# Optional: Remove volumes (uncomment if you want to clean up data)
# echo "🗑️  Removing volumes..."
# docker-compose -f docker-compose.mcp.yml down -v

echo "✅ MCP Servers stopped successfully!"