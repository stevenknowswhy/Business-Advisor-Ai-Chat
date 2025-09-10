# AI Advisor Chat

[![WCAG 2.1 AA Compliant](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black.svg)](https://nextjs.org/)
[![Accessibility](https://img.shields.io/badge/Accessibility-Screen%20Reader%20Support-brightgreen.svg)](https://www.w3.org/WAI/)

A modern, accessible AI advisory board application built with Next.js and TypeScript, featuring specialized AI advisors with distinct personas and expertise areas. The application provides a Teams-like interface for seamless interaction with multiple AI advisors, complete with comprehensive accessibility support and professional-grade user experience.

## 🎯 Key Features

### 🤖 **AI Advisor Management**
- **Multi-Advisor Chat**: Switch between specialized AI advisors seamlessly
- **@Mention System**: Natural advisor switching with intelligent autocomplete
- **Custom Advisor Creation**: Full CRUD operations for creating and managing advisors
- **Advisor Profiles**: Detailed advisor information with images, expertise, and configurations
- **JSON Configuration**: Advanced advisor customization with validation

### 💬 **Conversation Management**
- **Real-time Streaming**: Token-by-token AI responses via Server-Sent Events
- **Conversation Persistence**: All chats saved with full history and metadata
- **Inline Title Editing**: Edit conversation titles with save/cancel functionality
- **Message Actions**: Individual message management and deletion
- **Conversation History**: Comprehensive chat history with advisor context

### 👤 **User Experience**
- **Enhanced Authentication**: Clerk integration with real user name display
- **Professional UI**: Teams-like interface with advisor rail and chat area
- **Responsive Design**: Mobile-first approach with seamless cross-device experience
- **Subscription Tiers**: Model access based on user plans (Free/Base/Premium)
- **Real User Display**: Shows actual user names from authentication provider

### ♿ **Accessibility & Compliance**
- **WCAG 2.1 AA Compliant**: Full accessibility compliance for all users
- **Screen Reader Support**: Comprehensive ARIA attributes and semantic HTML
- **Keyboard Navigation**: Complete keyboard accessibility for all interactions
- **Focus Management**: Proper focus indicators and tab order
- **Form Accessibility**: Proper labeling and validation feedback

## 🆕 Recent Updates (Latest Release)

### 🌟 **Accessibility Enhancements**
- ✅ **WCAG 2.1 AA Compliance**: Achieved full accessibility compliance
- ✅ **Form Labeling**: Added `aria-label`, `title`, and `placeholder` attributes to all form inputs
- ✅ **Button Accessibility**: Proper `type`, `aria-label`, and `title` attributes for all buttons
- ✅ **Modal Semantics**: Implemented `role="dialog"`, `aria-modal`, and `aria-labelledby`
- ✅ **Screen Reader Support**: Comprehensive accessibility for assistive technologies

### 🚀 **New Features**
- ✅ **Complete Advisor Management**: Create, edit, delete, and manage AI advisors
- ✅ **AdvisorModal Component**: Comprehensive form with validation and JSON configuration
- ✅ **Enhanced User Display**: Real user names from Clerk authentication
- ✅ **Conversation Title Editing**: Inline editing with save/cancel functionality
- ✅ **Database Schema Updates**: New advisor fields (firstName, lastName, imageUrl)
- ✅ **Full CRUD API**: Complete REST API endpoints for advisor management

### 🔧 **Code Quality Improvements**
- ✅ **TypeScript Enhancements**: Added `forceConsistentCasingInFileNames` for cross-platform compatibility
- ✅ **CSS Optimization**: Replaced inline styles with Tailwind CSS arbitrary values
- ✅ **Error Handling**: Enhanced null safety and error handling throughout
- ✅ **Component Architecture**: Improved prop passing and data flow
- ✅ **Performance**: Optimized CSS bundling and compilation

## 🤖 AI Advisors

### Alex Reyes - Investor Advisor
- **Expertise**: Venture capital, startup evaluation, fundraising strategies
- **Personality**: Radically candid, decisive, zero-fluff communication
- **Specializes in**: Investment readiness, market validation, pitch feedback
- **Model**: Premium tier (Claude 3.5 Sonnet)

### Amara Johnson - Chief Technology Officer
- **Expertise**: Technical architecture, team scaling, system design
- **Personality**: Pragmatic, business-aware, systems thinking approach
- **Specializes in**: Tech stack decisions, scaling challenges, technical debt management
- **Model**: Base tier (GPT-4o Mini)

## 🛠️ Technical Stack

### **Frontend**
- **Framework**: Next.js 15.5.2 with App Router and Turbopack
- **Language**: TypeScript 5.0+ with strict configuration
- **Styling**: Tailwind CSS with utility-first approach
- **UI Components**: Custom components with accessibility-first design
- **State Management**: React hooks with optimistic updates
- **Real-time**: Server-Sent Events via Vercel AI SDK

### **Backend**
- **Runtime**: Node.js with Edge Runtime support
- **Database**: Neon PostgreSQL with connection pooling
- **ORM**: Prisma with type-safe database access
- **Authentication**: Clerk with JWT validation
- **AI Integration**: OpenRouter API with multiple model support
- **API Design**: RESTful endpoints with proper error handling

### **Development & Deployment**
- **Build Tool**: Turbopack for fast development builds
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Built-in accessibility testing and validation
- **Deployment**: Vercel with GitHub Actions automation
- **Monitoring**: Built-in logging and error tracking

### **Accessibility & Performance**
- **Standards**: WCAG 2.1 AA compliance
- **Screen Readers**: Full ARIA support and semantic HTML
- **Performance**: Optimized CSS bundling and lazy loading
- **SEO**: Next.js built-in SEO optimization

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **Database**: Neon PostgreSQL account ([Get one here](https://neon.tech/))
- **Authentication**: Clerk account ([Sign up here](https://clerk.com/))
- **AI Provider**: OpenRouter API key ([Get API key](https://openrouter.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stevenknowswhy/Business-Advisor-Ai-Chat.git
   cd ai-advisor-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Configure your environment variables in `.env`:
   ```bash
   # Neon Database Configuration
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

   # OpenRouter Configuration
   OPENROUTER_API_KEY="sk-or-your-api-key-here"
   APP_URL="http://localhost:3000"

   # Model tiering (optional overrides)
   OPENROUTER_FREE_MODEL="google/gemini-flash-1.5"
   OPENROUTER_BASE_MODEL="openai/gpt-4o-mini"
   OPENROUTER_PREMIUM_MODEL="anthropic/claude-3.5-sonnet"

   # Clerk Authentication
   CLERK_SECRET_KEY="sk_test_your-secret-key-here"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-publishable-key-here"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push database schema
   npx prisma db push

   # Seed the database with initial advisors
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000` and start chatting with AI advisors!

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Build and start production server

# Database
npm run db:generate  # Generate Prisma client and run migrations
npm run db:migrate   # Deploy migrations to production
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format:check # Check code formatting
npm run format:write # Format code with Prettier
npm run check        # Run linting and type checking
```

## ♿ Accessibility Features

The AI Advisor Chat application is built with accessibility as a core principle, achieving **WCAG 2.1 AA compliance** to ensure an inclusive experience for all users.

### **Accessibility Standards Met**

- ✅ **WCAG 2.1 AA Compliant**: Full compliance with Web Content Accessibility Guidelines
- ✅ **Section 508 Compatible**: Meets federal accessibility requirements
- ✅ **Screen Reader Support**: Comprehensive support for NVDA, JAWS, VoiceOver, and TalkBack
- ✅ **Keyboard Navigation**: Complete keyboard accessibility for all interactions
- ✅ **Focus Management**: Proper focus indicators and logical tab order

### **Specific Accessibility Features**

#### **Form Accessibility**
- **Proper Labeling**: All form inputs have `aria-label`, `title`, and `placeholder` attributes
- **Error Handling**: Clear error messages with proper ARIA announcements
- **Validation Feedback**: Real-time validation with accessible feedback
- **Required Fields**: Clear indication of required form fields

#### **Interactive Elements**
- **Button Semantics**: Proper `type`, `aria-label`, and `title` attributes for all buttons
- **Link Context**: Descriptive link text and proper ARIA attributes
- **Modal Dialogs**: Proper `role="dialog"`, `aria-modal`, and `aria-labelledby` implementation
- **Focus Trapping**: Proper focus management within modals and dialogs

#### **Content Structure**
- **Semantic HTML**: Proper use of headings, landmarks, and semantic elements
- **ARIA Attributes**: Comprehensive ARIA labels, descriptions, and roles
- **Color Contrast**: Meets WCAG AA color contrast requirements (4.5:1 ratio)
- **Text Scaling**: Supports up to 200% zoom without horizontal scrolling

#### **Screen Reader Experience**
- **Advisor Announcements**: Clear announcements when switching between advisors
- **Message Context**: Proper context for chat messages and responses
- **Status Updates**: Live regions for dynamic content updates
- **Navigation Aids**: Skip links and landmark navigation

### **Testing & Validation**

The application has been tested with:
- **Automated Testing**: axe-core accessibility testing
- **Screen Readers**: NVDA, JAWS, VoiceOver, and TalkBack
- **Keyboard Navigation**: Full keyboard-only navigation testing
- **Color Blindness**: Testing with various color vision deficiencies
- **Zoom Testing**: 200% zoom level compatibility

## 🚀 Deployment

### **Production Deployment**

The application is deployed on Vercel with automated GitHub Actions integration:

#### **Automatic Deployment**
- **Trigger**: Automatic deployment on pushes to `master` branch
- **Build Process**: Next.js build with Turbopack optimization
- **Database**: Automatic Prisma migrations on deployment
- **Environment**: Production environment variables via GitHub secrets

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production (ai-advisor-chat)
on:
  push:
    branches: [master]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deploy
        run: curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
      - name: Health Check
        run: curl -f ${{ secrets.PRODUCTION_BASE_URL }}/api/health
```

#### **Environment Configuration**
Required environment variables for production:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `OPENROUTER_API_KEY`: OpenRouter API key for AI models
- `CLERK_SECRET_KEY`: Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key

### **Manual Deployment**

For manual deployment to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add OPENROUTER_API_KEY
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

## 📊 Performance & Monitoring

### **Performance Optimizations**
- **Turbopack**: Fast development builds and hot reloading
- **CSS Optimization**: Tailwind CSS with PurgeCSS for minimal bundle size
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting for optimal loading
- **Edge Runtime**: Serverless functions with edge runtime support

### **Monitoring & Analytics**
- **Error Tracking**: Built-in error boundary and logging
- **Performance Monitoring**: Core Web Vitals tracking
- **Database Monitoring**: Prisma query optimization and monitoring
- **API Monitoring**: Request/response logging and error tracking

## 🤝 Contributing

We welcome contributions to improve the AI Advisor Chat application! Please follow these guidelines:

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes with proper testing
4. Ensure accessibility compliance is maintained
5. Run linting and formatting: `npm run check`
6. Commit with descriptive messages
7. Push to your fork and create a pull request

### **Code Standards**
- **TypeScript**: Strict mode with proper typing
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Testing**: Include accessibility testing for new features
- **Documentation**: Update README for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Vercel**: For seamless deployment and hosting
- **Clerk**: For robust authentication solutions
- **OpenRouter**: For AI model access and integration
- **Neon**: For serverless PostgreSQL database
- **Accessibility Community**: For guidelines and best practices

---

**Built with ❤️ and accessibility in mind**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/stevenknowswhy/Business-Advisor-Ai-Chat) or open an issue.
