# AI Advisor Chat - Full-Stack Architecture

## Document Information
- **Version**: 1.0
- **Date**: September 6, 2025
- **Author**: BMAD Method Architect Agent
- **Status**: Draft
- **Dependencies**: project-brief.md, prd.md

## Architecture Overview

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router │ React 19 │ TypeScript │ Tailwind CSS   │
│  - Chat Interface      │ - Real-time Streaming │ - Animations   │
│  - Advisor Rail        │ - State Management    │ - Responsive   │
│  - @Mention System     │ - Error Boundaries    │ - Accessibility│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (Node.js Runtime)                          │
│  - Authentication Middleware (Clerk)                           │
│  - Rate Limiting & Validation                                  │
│  - Request/Response Logging                                    │
│  - Error Handling                                              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Chat Service   │ │ Advisor Service │ │  User Service   │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ - SSE Streaming │ │ - Persona Mgmt  │ │ - Profile Mgmt  │
│ - @Mention Parse│ │ - Context Mgmt  │ │ - Subscription  │
│ - Message Queue │ │ - Memory Store  │ │ - Preferences   │
│ - Context Mgmt  │ │ - Prompt Engine │ │ - Usage Track   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ OpenRouter API  │ │ Neon PostgreSQL │ │   Clerk Auth    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ - Model Routing │ │ - Prisma ORM    │ │ - User Sessions │
│ - Tier Control  │ │ - Connection    │ │ - JWT Tokens    │
│ - Fallback Mgmt │ │   Pooling       │ │ - Social Login  │
│ - Usage Track   │ │ - Migrations    │ │ - Webhooks      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Technology Stack

#### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with Server Components
- **Language**: TypeScript 5.8+
- **Styling**: Tailwind CSS 4.0 with custom animations
- **State Management**: React Server Components + Client State
- **Real-time**: Server-Sent Events (SSE) via Vercel AI SDK
- **Animations**: Framer Motion for smooth transitions

#### Backend Stack
- **Runtime**: Node.js (required for Prisma compatibility)
- **API Framework**: Next.js API Routes
- **Database**: Neon PostgreSQL with connection pooling
- **ORM**: Prisma with type-safe queries
- **Authentication**: Clerk with JWT validation
- **AI Provider**: OpenRouter with multiple model support
- **Streaming**: Vercel AI SDK for token streaming

#### Infrastructure Stack
- **Hosting**: Vercel with automatic scaling
- **Database**: Neon PostgreSQL (serverless)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Custom logging
- **Environment**: Environment-based configuration