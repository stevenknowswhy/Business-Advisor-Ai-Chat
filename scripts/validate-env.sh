#!/bin/bash

# Environment Validation Script for MCP Servers
# This script validates the environment configuration

set -e

echo "🔍 Validating environment configuration..."

# Check if .env.mcp exists
if [ ! -f ".env.mcp" ]; then
    echo "❌ .env.mcp file not found"
    echo "💡 Run './scripts/setup-env.sh' to create it"
    exit 1
fi

# Load environment variables
source .env.mcp

# Required variables
required_vars=(
    "GITHUB_TOKEN"
    "MCP_DB_PASSWORD"
    "GRAFANA_PASSWORD"
    "JWT_SECRET"
    "SESSION_SECRET"
    "REDIS_PASSWORD"
)

# Optional but recommended variables
recommended_vars=(
    "CORS_ORIGIN"
    "LOG_LEVEL"
    "NODE_ENV"
    "RATE_LIMIT_REQUESTS"
    "HEALTH_CHECK_INTERVAL"
)

echo "📋 Checking required variables..."
missing_required=0
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
        missing_required=$((missing_required + 1))
    else
        echo "✅ $var is set"
        # Check if it's a placeholder value
        if [[ "${!var}" == *"your_"* ]] || [[ "${!var}" == *"placeholder"* ]] || [[ "${!var}" == *"here"* ]]; then
            echo "⚠️  $var contains placeholder value"
        fi
    fi
done

echo ""
echo "📋 Checking recommended variables..."
missing_recommended=0
for var in "${recommended_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var is not set (recommended)"
        missing_recommended=$((missing_recommended + 1))
    else
        echo "✅ $var is set"
    fi
done

# Validate specific variable formats
echo ""
echo "📋 Validating variable formats..."

# Validate GitHub token format
if [[ ! -z "$GITHUB_TOKEN" ]]; then
    if [[ ! "$GITHUB_TOKEN" =~ ^ghp_[a-zA-Z0-9_]{36}$ ]] && [[ ! "$GITHUB_TOKEN" =~ ^github_pat_[a-zA-Z0-9_]{82}$ ]]; then
        echo "⚠️  GitHub token format may be invalid"
    else
        echo "✅ GitHub token format looks valid"
    fi
fi

# Validate port ranges
ports=(
    "GITHUB_SERVER_PORT:3001"
    "FILESYSTEM_SERVER_PORT:3002"
    "SHADCN_SERVER_PORT:3003"
    "PROXY_PORT:8080"
    "GRAFANA_PORT:3000"
    "PROMETHEUS_PORT:9090"
    "DOCS_PORT:8081"
)

for port_config in "${ports[@]}"; do
    var_name=${port_config%:*}
    expected_port=${port_config#*:}
    if [[ ! -z "${!var_name}" ]]; then
        if [[ "${!var_name}" -eq "$expected_port" ]]; then
            echo "✅ $var_name is set to expected port $expected_port"
        else
            echo "⚠️  $var_name is set to ${!var_name} (expected $expected_port)"
        fi
    fi
done

# Validate network configuration
if [[ ! -z "$MCP_NETWORK_SUBNET" ]]; then
    if [[ "$MCP_NETWORK_SUBNET" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        echo "✅ Network subnet format is valid"
    else
        echo "❌ Network subnet format is invalid"
    fi
fi

# Validate security settings
echo ""
echo "📋 Checking security settings..."

# Check password strength
password_vars=(
    "MCP_DB_PASSWORD"
    "GRAFANA_PASSWORD"
    "JWT_SECRET"
    "SESSION_SECRET"
    "REDIS_PASSWORD"
)

for var in "${password_vars[@]}"; do
    if [[ ! -z "${!var}" ]]; then
        password_length=${#var}
        if [[ $password_length -lt 16 ]]; then
            echo "⚠️  $var is too short (minimum 16 characters recommended)"
        else
            echo "✅ $var length is adequate"
        fi
    fi
done

# Summary
echo ""
echo "📊 Validation Summary:"
if [[ $missing_required -gt 0 ]]; then
    echo "❌ $missing_required required variables are missing"
    exit 1
elif [[ $missing_recommended -gt 0 ]]; then
    echo "⚠️  $missing_recommended recommended variables are missing"
    echo "✅ All required variables are set"
else
    echo "✅ All variables are properly configured"
fi

echo ""
echo "🔧 Configuration is ready for MCP servers!"
echo ""
echo "💡 Next steps:"
echo "   - Start servers: './scripts/start-mcp-servers.sh'"
echo "   - Test connectivity: './scripts/test-mcp-servers.sh'"
echo "   - View logs: 'docker-compose -f docker-compose.mcp.yml logs -f'"