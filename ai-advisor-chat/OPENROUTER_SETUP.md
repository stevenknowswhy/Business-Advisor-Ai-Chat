# OpenRouter API Setup Guide

## Overview
The AI Advisor Chat application uses OpenRouter to provide AI-powered responses from various language models. This guide explains how to set up and configure OpenRouter for both development and production environments.

## Getting Started

### 1. Create OpenRouter Account
1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Navigate to the API Keys section in your dashboard

### 2. Generate API Key
1. Click "Create API Key"
2. Give it a descriptive name (e.g., "AI Advisor Chat - Development")
3. Copy the generated key (starts with `sk-or-v1-`)

### 3. Configure Environment Variables
Add the following to your `.env.local` file:

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY="sk-or-v1-your-actual-api-key-here"
OPENROUTER_FREE_MODEL="x-ai/grok-code-fast-1"
OPENROUTER_BASE_MODEL="deepseek/deepseek-chat-v3-0324"
OPENROUTER_PREMIUM_MODEL="deepseek/deepseek-chat-v3.1"
```

### 4. Restart Development Server
After adding the API key, restart your development server:
```bash
npm run dev
```

## Model Selection
The application automatically selects models based on user plan:
- **Free users**: `x-ai/grok-code-fast-1` (fast, cost-effective)
- **Premium users**: `deepseek/deepseek-chat-v3.1` (higher quality)

## Testing the Integration

### 1. Check API Key Validity
You can test your API key using curl:
```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "x-ai/grok-code-fast-1",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

### 2. Test in Application
1. Navigate to `/chat` in your application
2. Sign in with Clerk
3. Select an advisor
4. Send a test message
5. Verify you receive a personalized AI response (not a mock response)

## Troubleshooting

### Mock Responses Appearing
If you see messages like "This is a development demo response", it means:
1. API key is missing or invalid
2. OpenRouter API is returning authentication errors
3. Network connectivity issues

### Common Issues
- **401 "User not found"**: Invalid or expired API key
- **403 Forbidden**: API key doesn't have required permissions
- **429 Rate Limited**: Too many requests, wait and retry
- **500 Server Error**: Check OpenRouter status page

### Development Mode
In development, the application provides helpful mock responses when:
- No API key is configured
- API key is invalid
- OpenRouter API is unavailable

These mock responses include setup instructions and maintain the chat functionality for testing UI components.

## Production Deployment
For production deployment:
1. Ensure `OPENROUTER_API_KEY` is set in your hosting environment
2. Set `NODE_ENV=production`
3. Monitor API usage and costs in OpenRouter dashboard
4. Consider implementing rate limiting for user requests

## Cost Management
- Monitor usage in OpenRouter dashboard
- Set up billing alerts
- Consider implementing user-based rate limiting
- Use free models for development and testing

## Security Notes
- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Monitor for unusual usage patterns
