# Vercel MCP Setup for AI Advisor Chat

## VS Code with Copilot Setup

### Installation Steps:

1. **Open Command Palette** (Ctrl+Shift+P / Cmd+Shift+P)
2. **Run:** `MCP: Add Server`
3. **Select:** `HTTP`
4. **Enter Details:**
   ```
   URL: https://mcp.vercel.com/daily-ai-assistant/ai-advisor-chat
   Name: Vercel AI Advisor Chat
   ```
5. **Select:** `Workspace` (for project-specific access)
6. **Click:** `Add`

### Authorization Steps:

1. **Open Command Palette** (Ctrl+Shift+P / Cmd+Shift+P)
2. **Run:** `MCP: List Servers`
3. **Select:** `Vercel AI Advisor Chat`
4. **Click:** `Start Server`
5. **When prompted:** Click `Allow` for authentication
6. **If popup appears:** Click `Cancel` on external website prompt
7. **When asked about URL Handler:** Click `Yes`
8. **Click:** `Open` and complete Vercel sign-in flow

## Cursor Setup

### Method 1: One-Click (if available)
- Use the Cursor integration button from Vercel dashboard

### Method 2: Manual Configuration
1. **Create/Edit:** `.cursor/mcp.json` in your project root
2. **Add Configuration:**
   ```json
   {
     "mcpServers": {
       "vercel-ai-advisor": {
         "url": "https://mcp.vercel.com/daily-ai-assistant/ai-advisor-chat"
       }
     }
   }
   ```
3. **Restart Cursor**
4. **Click:** "Needs login" prompt when it appears
5. **Complete:** Vercel authorization flow

## Claude Desktop Setup

### Requirements:
- Claude Pro, Max, Team, or Enterprise plan

### Setup Steps:
1. **Open Settings** in Claude Desktop sidebar
2. **Navigate to:** Connectors → Add custom connector
3. **Configure:**
   ```
   Name: Vercel AI Advisor Chat
   URL: https://mcp.vercel.com/daily-ai-assistant/ai-advisor-chat
   ```
4. **Save** and authorize when prompted

## Claude Code (CLI) Setup

### Installation:
```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Navigate to your project
cd ai-advisor-chat

# Add Vercel MCP with project-specific access
claude mcp add --transport http vercel-ai-advisor https://mcp.vercel.com/daily-ai-assistant/ai-advisor-chat

# Start Claude Code
claude

# Authenticate MCP tools
/mcp
```

## Security Configuration

### Enable Human Confirmation
- Always enable human confirmation for deployment actions
- Review permissions before authorizing
- Verify you're connecting to: `https://mcp.vercel.com`

### Best Practices:
- ✅ Only use official Vercel MCP endpoint
- ✅ Review each deployment action before approval
- ✅ Use project-specific URLs for better security
- ✅ Regularly review connected applications

## Testing Your Connection

### Verification Commands:
Once connected, test with these AI prompts:

1. **"List my Vercel projects"**
2. **"Show deployment status for ai-advisor-chat"**
3. **"Check environment variables for the AI Advisor Chat project"**

### Expected Capabilities:
- ✅ Deploy AI Advisor Chat to Vercel
- ✅ Monitor deployment status and logs
- ✅ Manage environment variables
- ✅ Troubleshoot deployment issues
- ✅ Access Vercel documentation

## Environment Variables for Deployment

Ensure these are configured in Vercel:

```bash
DATABASE_URL=your_neon_database_url
OPENROUTER_API_KEY=your_openrouter_api_key
APP_URL=https://your-vercel-domain.vercel.app
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
OPENROUTER_FREE_MODEL=google/gemini-flash-1.5
OPENROUTER_BASE_MODEL=openai/gpt-4o-mini
OPENROUTER_PREMIUM_MODEL=anthropic/claude-3.5-sonnet
```

## Troubleshooting

### Common Issues:
1. **"Needs login" prompt:** Complete OAuth flow in browser
2. **Permission errors:** Verify team access and project permissions
3. **Connection timeout:** Check network and try again
4. **Invalid URL:** Ensure using exact project-specific URL

### Support:
- Check Vercel MCP documentation
- Verify AI client is in supported list
- Ensure latest version of your AI client
