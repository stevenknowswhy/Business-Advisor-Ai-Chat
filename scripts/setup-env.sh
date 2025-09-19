#!/bin/bash

# Environment Setup Script for MCP Servers
# This script helps configure environment variables securely

set -e

echo "🔧 Setting up environment variables for MCP Servers..."

# Function to generate secure random strings
generate_secure_string() {
    local length=$1
    openssl rand -hex $length 2>/dev/null || LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c $length
}

# Function to prompt for input with default value
prompt_input() {
    local prompt=$1
    local default=$2
    local var_name=$3

    echo -n "$prompt [$default]: "
    read input

    if [ -z "$input" ]; then
        echo "$default"
    else
        echo "$input"
    fi
}

# Backup existing .env.mcp if it exists
if [ -f ".env.mcp" ]; then
    echo "💾 Backing up existing .env.mcp to .env.mcp.backup"
    cp .env.mcp .env.mcp.backup
fi

# Generate secure passwords and secrets
echo "🔐 Generating secure credentials..."

DB_PASSWORD=$(generate_secure_string 32)
GRAFANA_PASSWORD=$(generate_secure_string 16)
JWT_SECRET=$(generate_secure_string 64)

# Ask for GitHub token
echo ""
echo "📝 GitHub Configuration"
echo "To get a GitHub token:"
echo "1. Go to https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Select scopes: repo, user, admin:org"
echo "4. Copy the generated token"
echo ""

echo -n "Enter your GitHub token: "
read -r GITHUB_TOKEN

# If no input provided, use a demo token
if [ -z "$GITHUB_TOKEN" ]; then
    GITHUB_TOKEN="demo_github_token_ghp_1234567890abcdef1234567890abcdef12"
    echo "Using demo token: $GITHUB_TOKEN"
fi

# Configuration options
echo ""
echo "🌐 Network Configuration"
CORS_ORIGIN=$(prompt_input "CORS Origin" "http://localhost:3000" "CORS_ORIGIN")
LOG_LEVEL=$(prompt_input "Log Level" "info" "LOG_LEVEL")
NODE_ENV=$(prompt_input "Node Environment" "production" "NODE_ENV")

# Create new .env.mcp file
cat > .env.mcp << EOF
# MCP Servers Configuration
# Generated on $(date)
# Do not commit this file to version control

# GitHub MCP Server
GITHUB_TOKEN=$GITHUB_TOKEN

# Database MCP Server
MCP_DB_PASSWORD=$DB_PASSWORD

# Grafana MCP Server
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# Network Configuration
MCP_NETWORK_SUBNET=172.20.0.0/16

# Server Ports
GITHUB_SERVER_PORT=3001
FILESYSTEM_SERVER_PORT=3002
SHADCN_SERVER_PORT=3003
PROXY_PORT=8080
GRAFANA_PORT=3000
PROMETHEUS_PORT=9090
DOCS_PORT=8081

# Logging
LOG_LEVEL=$LOG_LEVEL
LOG_FORMAT=json

# Security
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=$CORS_ORIGIN

# Performance
NODE_ENV=$NODE_ENV
MAX_MEMORY=512mb
TIMEOUT=30000

# Additional Security Settings
# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Session configuration
SESSION_SECRET=$(generate_secure_string 32)
SESSION_TTL=3600

# API configuration
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000

# Database configuration (if using external database)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mcp_db
DB_USER=mcp_user

# Redis configuration (if using external Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$(generate_secure_string 32)

# Monitoring configuration
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
EOF

echo ""
echo "✅ Environment variables configured successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   - GitHub Token: ${GITHUB_TOKEN:0:10}..."
echo "   - Database Password: ${DB_PASSWORD:0:8}..."
echo "   - Grafana Password: ${GRAFANA_PASSWORD:0:8}..."
echo "   - JWT Secret: ${JWT_SECRET:0:10}..."
echo "   - CORS Origin: $CORS_ORIGIN"
echo "   - Log Level: $LOG_LEVEL"
echo "   - Node Environment: $NODE_ENV"
echo ""
echo "🔐 Security note:"
echo "   - All secrets have been generated securely"
echo "   - Backup saved as .env.mcp.backup"
echo "   - Do not commit .env.mcp to version control"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the generated .env.mcp file"
echo "   2. Run './scripts/test-mcp-config.sh' to validate configuration"
echo "   3. Start the MCP servers with './scripts/start-mcp-servers.sh'"
echo ""
echo "⚠️  Important:"
echo "   - Keep your GitHub token secure"
echo "   - Store the generated passwords in a secure location"
echo "   - Regularly rotate your secrets"