#!/bin/bash
set -euo pipefail

# Load local env
set -a
source .env 2>/dev/null || true
set +a

echo "Setting Vercel environment variables..."

# Set OPENROUTER_API_KEY
echo "Setting OPENROUTER_API_KEY..."
echo "$OPENROUTER_API_KEY" | npx vercel env add OPENROUTER_API_KEY production

# Set APP_URL for production
echo "Setting APP_URL..."
echo "https://v0-business-consulting-website-nw4mlsbsv-agents-v3.vercel.app" | npx vercel env add APP_URL production

# Set model environment variables
echo "Setting model environment variables..."
echo "x-ai/grok-code-fast-1" | npx vercel env add OPENROUTER_FREE_MODEL production
echo "x-ai/grok-code-fast-1" | npx vercel env add OPENROUTER_BASE_MODEL production
echo "x-ai/grok-code-fast-1" | npx vercel env add OPENROUTER_PREMIUM_MODEL production

echo "Environment variables set. Deploying..."
npx vercel --prod

echo "Deployment complete!"
