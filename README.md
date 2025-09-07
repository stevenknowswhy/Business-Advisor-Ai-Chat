# AI Advisor Chat

A Teams-like AI advisory board application built with the T3 Stack, featuring specialized AI advisors with distinct personas and expertise areas.

## 🎯 Features

- **Multi-Advisor Chat**: Switch between specialized AI advisors seamlessly
- **@Mention System**: Natural advisor switching with autocomplete
- **Real-time Streaming**: Token-by-token AI responses via Server-Sent Events
- **Conversation Persistence**: All chats saved with full history
- **Subscription Tiers**: Model access based on user plans (Free/Base/Premium)
- **Professional UI**: Teams-like interface with advisor rail and chat area
- **Secure Authentication**: Clerk integration with current best practices

## 🤖 AI Advisors

### Alex Reyes - Investor Advisor
- **Expertise**: Venture capital, startup evaluation, fundraising
- **Personality**: Radically candid, decisive, zero-fluff
- **Specializes in**: Investment readiness, market validation, pitch feedback

### Amara Johnson - Chief Technology Officer
- **Expertise**: Technical architecture, team scaling, system design
- **Personality**: Pragmatic, business-aware, systems thinker
- **Specializes in**: Tech stack decisions, scaling challenges, technical debt

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI Provider**: OpenRouter with multiple model support
- **Real-time**: Server-Sent Events via Vercel AI SDK
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon database account
- Clerk account
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-advisor-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:
   ```bash
   # Database
   DATABASE_URL="your_neon_database_url"

   # OpenRouter
   OPENROUTER_API_KEY="your_openrouter_api_key"
   APP_URL="http://localhost:3000"

   # Clerk
   CLERK_SECRET_KEY="your_clerk_secret_key"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`
