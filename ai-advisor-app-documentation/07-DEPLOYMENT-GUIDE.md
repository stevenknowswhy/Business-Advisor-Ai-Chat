# AI Advisor Chat - Deployment Guide

## 🚀 Deployment Overview

The AI Advisor Chat application is designed for **Vercel deployment** with **Convex** as the real-time backend. This guide covers the complete deployment process from local development to production.

---

## 📋 Prerequisites

### Required Accounts
1. **Vercel Account** - For frontend deployment
2. **Convex Account** - For real-time database and functions
3. **Clerk Account** - For authentication
4. **OpenRouter Account** - For AI model access
5. **GitHub Account** - For CI/CD integration

### Environment Variables
```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"
CONVEX_DEPLOYMENT="dev:your-deployment-name"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_your-secret-key-here"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-publishable-key-here"
CLERK_JWT_ISSUER_DOMAIN="https://your-clerk-domain.clerk.accounts.dev"

# OpenRouter Configuration
OPENROUTER_API_KEY="sk-or-your-api-key-here"
APP_URL="https://your-app-domain.vercel.app"

# Model Configuration (optional overrides)
OPENROUTER_FREE_MODEL="nvidia/nemotron-nano-9b-v2:free"
OPENROUTER_BASE_MODEL="deepseek/deepseek-chat-v3-0324"
OPENROUTER_PREMIUM_MODEL="deepseek/deepseek-chat-v3.1"
```

---

## 🔧 Development Setup

### 1. **Clone and Install Dependencies**
```bash
# Clone the repository
git clone https://github.com/your-username/ai-advisor-chat.git
cd ai-advisor-chat

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### 2. **Set Up Convex**
```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex development
npx convex dev --configure

# This will:
# - Create a new Convex project
# - Generate deployment URL
# - Set up environment variables
```

### 3. **Configure Environment Variables**
```bash
# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

### 4. **Set Up Clerk Authentication**
1. Create a Clerk application at [clerk.com](https://clerk.com/)
2. In your Clerk dashboard, go to **JWT Templates**
3. Create a new template named **"convex"** with:
   - **Audience**: `convex`
   - **Issuer**: Your Clerk domain
   - **Include standard claims**: name, email, picture

### 5. **Deploy Convex Functions**
```bash
# Deploy Convex functions to development
npx convex dev

# Deploy to production
npx convex deploy --prod
```

### 6. **Start Development Server**
```bash
# Start Next.js development server
npm run dev
# or
yarn dev
# or
pnpm dev

# Open http://localhost:3000
```

---

## 🚀 Production Deployment

### 1. **Connect to GitHub**
1. Push your code to GitHub
2. Connect your Vercel account to GitHub
3. Import the repository

### 2. **Configure Vercel**
In your Vercel project dashboard:

#### Environment Variables
Set these in **Project Settings → Environment Variables**:

```bash
# Required
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud
CLERK_SECRET_KEY=sk_live_your-secret-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-publishable-key
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
OPENROUTER_API_KEY=sk-or-your-production-api-key
APP_URL=https://your-app-domain.vercel.app

# Optional - Model Configuration
OPENROUTER_FREE_MODEL=nvidia/nemotron-nano-9b-v2:free
OPENROUTER_BASE_MODEL=deepseek/deepseek-chat-v3-0324
OPENROUTER_PREMIUM_MODEL=deepseek/deepseek-chat-v3.1
```

#### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. **Deploy Convex to Production**
```bash
# Deploy Convex functions and database schema
npx convex deploy --prod

# Verify deployment
npx convex dashboard
```

### 4. **Deploy Frontend to Vercel**
```bash
# Method 1: Automatic via GitHub
# Push to main branch and Vercel will auto-deploy

# Method 2: Manual via CLI
npm install -g vercel
vercel --prod

# Method 3: Vercel Dashboard
# Click "Deploy" in the Vercel dashboard
```

---

## 🔍 Post-Deployment Checklist

### 1. **Verify Services**
- [ ] Frontend loads at `https://your-app.vercel.app`
- [ ] Authentication works (sign in/sign up)
- [ ] Convex functions are accessible
- [ ] Database queries are working
- [ ] AI model responses are functioning
- [ ] Real-time updates are working

### 2. **Test Core Features**
- [ ] User can sign in and sign up
- [ ] Marketplace loads and displays advisors
- [ ] User can select advisors
- [ ] Chat functionality works
- [ ] Messages are stored and retrieved
- [ ] Real-time typing indicators work
- [ ] Responsive design works on mobile

### 3. **Security Checks**
- [ ] Environment variables are not exposed
- [ ] Authentication is properly enforced
- [ ] API routes are protected
- [ ] CORS settings are correct
- [ ] HTTPS is enforced

### 4. **Performance Checks**
- [ ] Page load times are acceptable (< 3s)
- [ ] Core Web Vitals are good
- [ ] Images are optimized
- [ ] Bundle size is reasonable

---

## ⚡ Performance Optimization

### 1. **Vercel Optimization**
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_ENABLE_EXPERIMENTAL_MIDDLEWARE": "true"
  }
}
```

### 2. **Next.js Optimization**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
```

### 3. **Convex Optimization**
```typescript
// convex/optimization.ts
export const optimizedQuery = query({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Use selective field queries
    return ctx.db
      .query("table")
      .filter(q => q.eq("field", "value"))
      .take(50) // Limit results
      .collect();
  },
});
```

---

## 🔐 Security Best Practices

### 1. **Environment Variables**
```bash
# Never commit .env.local to version control
echo ".env.local" >> .gitignore

# Use Vercel's environment variable encryption
vercel env add NEXT_PUBLIC_CONVEX_URL
```

### 2. **API Security**
```typescript
// convex/security.ts
export const secureMutation = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Always authenticate user
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // Validate input
    const validated = validateArgs(args);

    // Check permissions
    if (!hasPermission(user, validated)) {
      throw new Error("Insufficient permissions");
    }

    // Execute operation
    return performOperation(user, validated);
  },
});
```

### 3. **CORS Configuration**
```typescript
// src/app/api/[...path]/route.ts
export async function GET(request: Request) {
  const origin = request.headers.get('origin');

  // Allow specific origins
  const allowedOrigins = [
    'https://your-app.vercel.app',
    'https://www.your-app.com',
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Unauthorized origin', { status: 403 });
  }

  // Add CORS headers
  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 📊 Monitoring & Analytics

### 1. **Vercel Analytics**
Enable in Vercel dashboard:
- **Real-time metrics**
- **Web Vitals monitoring**
- **Error tracking**
- **Performance insights**

### 2. **Convex Dashboard**
Monitor at `https://dashboard.convex.dev`:
- **Function performance**
- **Database queries**
- **Real-time connections**
- **Error logs**

### 3. **Custom Monitoring**
```typescript
// convex/monitoring.ts
export const monitoredFunction = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    try {
      const result = await performOperation(ctx, args);

      // Log success metric
      console.log('Operation successful', {
        duration: Date.now() - startTime,
        operation: args.operation,
      });

      return result;
    } catch (error) {
      // Log error metric
      console.error('Operation failed', {
        duration: Date.now() - startTime,
        operation: args.operation,
        error: error.message,
      });

      throw error;
    }
  },
});
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Build application
        run: npm run build

      - name: Deploy Convex
        run: npx convex deploy --prod
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Build Failures**
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npm run typecheck

# Check for linting errors
npm run lint
```

#### 2. **Convex Connection Issues**
```bash
# Verify Convex deployment
npx convex deploy --dry-run

# Check environment variables
npx convex env list

# Reset Convex development
npx convex dev --configure
```

#### 3. **Authentication Issues**
```bash
# Verify Clerk configuration
echo "CLERK_SECRET_KEY: $CLERK_SECRET_KEY"
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

# Test JWT template
curl -X POST "https://your-clerk-domain.clerk.accounts.dev/v1/jwt" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"
```

#### 4. **AI Model Issues**
```bash
# Test OpenRouter API
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "HTTP-Referer: $APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek/deepseek-chat-v3.1", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Debug Commands
```bash
# Check Convex function logs
npx convex logs

# Test individual Convex functions
npx convex run function_name

# Check Vercel deployment logs
vercel logs

# Test API endpoints
curl https://your-app.vercel.app/api/health
```

---

## 📈 Production Best Practices

### 1. **Database Optimization**
- Use proper indexing
- Implement query pagination
- Monitor query performance
- Regular cleanup of old data

### 2. **Security Monitoring**
- Regular security audits
- Monitor for unusual activity
- Keep dependencies updated
- Implement rate limiting

### 3. **Performance Monitoring**
- Monitor Core Web Vitals
- Track page load times
- Monitor API response times
- Set up performance alerts

### 4. **Backup & Recovery**
- Regular database backups
- Disaster recovery plan
- Environment variable backup
- Code repository backup

---

## 🎯 Scaling Considerations

### 1. **Vertical Scaling**
- Monitor resource usage
- Upgrade database tier
- Optimize function performance
- Implement caching strategies

### 2. **Horizontal Scaling**
- Load balancing configuration
- CDN integration
- Geographic distribution
- Multi-region deployment

### 3. **Cost Optimization**
- Monitor usage costs
- Optimize resource allocation
- Implement caching
- Use efficient data structures

---

This deployment guide provides a comprehensive roadmap for taking the AI Advisor Chat application from development to production, with best practices for security, performance, and monitoring.