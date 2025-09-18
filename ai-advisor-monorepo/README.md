# AI Advisor Chat - Monorepo

[![WCAG 2.1 AA Compliant](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black.svg)](https://nextjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-1.10+-red.svg)](https://turbo.build/)

A modern, accessible AI advisory board application built with Next.js, TypeScript, and Turborepo. This monorepo contains both the marketing site and the core AI application, with shared UI components and utilities.

## 🏗️ Architecture

This monorepo follows a feature-driven development approach with clear separation between marketing and application concerns:

```
ai-advisor-monorepo/
├── apps/
│   ├── marketing/          # Marketing site (SSG/ISR)
│   └── app/                # Core AI application
├── packages/
│   ├── ui/                 # Shared UI components
│   └── utils/              # Shared utilities & types
├── package.json            # Root package.json
└── turbo.json             # Turborepo configuration
```

## 🚀 Apps

### Marketing Site (`apps/marketing`)
- **Purpose**: Landing page, pricing, blog, and lead generation
- **Technology**: Next.js with Static Site Generation (SSG)
- **Domain**: `yourapp.com`
- **Features**:
  - SEO-optimized static pages
  - Pricing page with deep-links to app signup
  - MDX-powered blog
  - UTM tracking and analytics
  - Fast loading with perfect PageSpeed scores

### Core Application (`apps/app`)
- **Purpose**: AI advisor chat interface and user management
- **Technology**: Next.js with App Router, Convex, Clerk Auth
- **Domain**: `app.yourapp.com`
- **Features**:
  - AI-powered conversations with specialized advisors
  - User authentication and subscription management
  - Real-time chat with streaming responses
  - WCAG 2.1 AA accessibility compliance
  - Comprehensive advisor management system

## 📦 Packages

### UI Package (`packages/ui`)
Shared React components with consistent design system:
- `Button` - Accessible button component with variants
- `Input` - Form input with validation states
- `Card` - Content container component
- `Modal` - Accessible modal dialog

### Utils Package (`packages/utils`)
Shared utilities and TypeScript types:
- Date formatting and relative time functions
- Validation utilities (email, URL)
- ID generation functions
- Shared TypeScript types for advisors, conversations, etc.

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Getting Started

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd ai-advisor-monorepo
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Copy environment files for each app
   cp apps/app/.env.example apps/app/.env
   cp apps/marketing/.env.example apps/marketing/.env
   ```

3. **Start development servers**:
   ```bash
   # Start all apps in development mode
   npm run dev

   # Or start individual apps
   npm run dev --filter=marketing
   npm run dev --filter=app
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start all apps in development
npm run build        # Build all apps for production
npm run start        # Start all apps in production mode

# Individual app commands
npm run dev --filter=marketing     # Start marketing site only
npm run dev --filter=app          # Start core app only
npm run build --filter=marketing  # Build marketing site only

# Linting and formatting
npm run lint         # Lint all packages
npm run format       # Format all code
npm run type-check   # Type check all packages

# Convex (app only)
# From apps/app, you can run the Convex dev server alongside Next.js:
# Option A (script): npm run convex:dev --filter=app
# Option B (direct): cd apps/app && npx convex dev

# Utilities
npm run clean        # Clean all build artifacts
```

## 🚀 Deployment

### Vercel Deployment

This monorepo is optimized for Vercel deployment with automatic detection:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Projects**: Vercel will detect the monorepo and prompt for configuration
3. **Set Build Commands**:
   - **Marketing**: `cd ../.. && npm run build --filter=marketing...`
   - **App**: `cd ../.. && npm run build --filter=app...`
4. **Set Output Directories**:
   - **Marketing**: `apps/marketing/.next`
   - **App**: `apps/app/.next`

### Domain Configuration
- **Marketing**: `yourapp.com` (root domain)
- **App**: `app.yourapp.com` (subdomain)

### Environment Variables
Configure the following in Vercel:

**Marketing App**:
- `NEXT_PUBLIC_APP_URL` - URL of the core application
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID

**Core App**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (client)
- `CLERK_SECRET_KEY` - Clerk secret key (server)
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT template issuer domain (e.g., https://<your-subdomain>.clerk.accounts.dev)
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (from Convex dashboard)
- `CONVEX_DEPLOYMENT` - Convex deployment name (auto-set locally by `npx convex dev`; set in Vercel for prod)
- `OPENROUTER_API_KEY` - OpenRouter API key (optional, if using OpenRouter)

## 🎯 Key Features

### Marketing Site Features
- **SEO Optimized**: Static generation with proper meta tags
- **Fast Loading**: Optimized images and minimal JavaScript
- **UTM Tracking**: First-party cookie tracking across domains
- **Deep Linking**: Direct links to app signup with plan selection
- **Blog System**: MDX-powered blog with RSS feed

### Core App Features
- **AI Conversations**: Real-time streaming with multiple AI models
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Authentication**: Secure user management with Clerk
- **Subscriptions**: Stripe integration for billing
- **Advisor Management**: Create and customize AI advisors
- **Conversation History**: Persistent chat history

### Advisor JSON Management

- Upload advisor definitions via UI buttons in the sidebar (Upload Advisor JSON, Enrich from JSON)
- Backend actions:
  - `advisors.uploadAdvisorJSON` — validates and creates/upserts an advisor from JSON
  - `advisors.enrichAdvisorsFromJSON` — backfills persona fields for existing advisors
- Accessibility: Upload control includes aria-label and title per WCAG 2.1 AA


## 🔧 Technical Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS with shared design tokens
- **Monorepo**: Turborepo for build optimization
- **Data Layer**: Convex (real-time database with typed queries/mutations/actions)
- **Authentication**: Clerk for user management
- **AI**: OpenRouter API with multiple model support
- **Deployment**: Vercel with automatic deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test thoroughly
4. Ensure all apps build successfully: `npm run build`
5. Run linting and type checking: `npm run lint && npm run type-check`
6. Commit with descriptive messages
7. Push and create a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Turborepo and modern web technologies**
