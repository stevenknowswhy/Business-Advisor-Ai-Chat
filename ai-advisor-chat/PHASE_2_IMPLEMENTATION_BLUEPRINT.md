# Phase 2 Core Build Wave Implementation Plan

## 🎯 Core Build Wave Overview
**Duration**: 4-6 hours
**Strategy**: Parallel frontend/backend development with blog integration as side quest

## 🔄 Parallel Development Streams

### Stream A: Frontend Payment Components (2-3 hours)
**Priority**: High - Direct revenue impact

#### A1. Payment Modal System
- **Location**: `src/components/payments/PaymentModal.tsx`
- **Features**:
  - Stripe Elements integration
  - Advisor selection and pricing
  - Payment method selection
  - Billing form with validation
  - Order summary display

#### A2. Advisor Subscription Cards
- **Location**: `src/components/advisors/AdvisorSubscriptionCard.tsx`
- **Features**:
  - Pricing tiers (Basic, Premium, Enterprise)
  - Feature comparison matrix
  - Subscription toggle (monthly/yearly)
  - CTA integration with payment modal

#### A3. Payment Success/Error States
- **Location**: `src/components/payments/PaymentStatus.tsx`
- **Features**:
  - Success confirmation with next steps
  - Error handling with retry options
  - Loading states during processing

#### A4. User Dashboard Payment Section
- **Location**: `src/components/dashboard/PaymentDashboard.tsx`
- **Features**:
  - Current subscription status
  - Payment history
  - Invoice download
  - Subscription management

### Stream B: Backend API Routes (2-3 hours)
**Priority**: High - Foundation for all features

#### B1. Payment Processing API
- **Location**: `src/app/api/payments/route.ts`
- **Endpoints**:
  - `POST /api/payments/create-intent` - Create payment intent
  - `POST /api/payments/confirm` - Confirm payment
  - `GET /api/payments/status/[id]` - Check payment status
  - `POST /api/payments/webhook` - Stripe webhook handler

#### B2. Subscription Management API
- **Location**: `src/app/api/subscriptions/route.ts`
- **Endpoints**:
  - `POST /api/subscriptions/create` - Create subscription
  - `PUT /api/subscriptions/cancel` - Cancel subscription
  - `GET /api/subscriptions/user/[userId]` - Get user subscriptions
  - `PUT /api/subscriptions/update` - Update subscription plan

#### B3. RBAC Implementation API
- **Location**: `src/app/api/roles/route.ts`
- **Endpoints**:
  - `POST /api/roles/assign` - Assign role to user
  - `DELETE /api/roles/remove` - Remove role from user
  - `GET /api/roles/user/[userId]` - Get user roles
  - `GET /api/roles/list` - List available roles

#### B4. User Profile Enhancement API
- **Location**: `src/app/api/user/profile/route.ts`
- **Endpoints**:
  - `GET /api/user/profile` - Get user profile with payment info
  - `PUT /api/user/profile` - Update user profile
  - `GET /api/user/billing` - Get billing information
  - `POST /api/user/billing/update` - Update billing information

### Stream C: Blog Integration (Side Quest, 1-2 hours)
**Priority**: Medium - Content marketing enhancement

#### C1. Blog API Integration
- **Location**: `src/app/api/blog/route.ts`
- **Features**:
  - Fetch blog posts from marketing site
  - Caching layer for performance
  - Category filtering
  - Search functionality

#### C2. Blog Display Components
- **Location**: `src/components/blog/BlogPreview.tsx`
- **Features**:
  - Blog post cards
  - Category tags
  - Read time estimation
  - Link to marketing site

## 📋 Implementation Checklist

### Frontend Components
- [ ] PaymentModal with Stripe Elements
- [ ] AdvisorSubscriptionCard with pricing tiers
- [ ] PaymentStatus component for success/error states
- [ ] PaymentDashboard for user management
- [ ] TypeScript interfaces for all payment types
- [ ] Zod schemas for form validation
- [ ] Error handling and loading states
- [ ] Responsive design for all components

### Backend APIs
- [ ] Stripe webhook handler setup
- [ ] Payment intent creation and confirmation
- [ ] Subscription lifecycle management
- [ ] RBAC role assignment and checking
- [ ] User profile with billing information
- [ ] API route protection with authentication
- [ ] Error handling and validation
- [ ] Database schema updates for payments

### Blog Integration
- [ ] Blog API integration with marketing site
- [ ] BlogPreview component with caching
- [ ] Category filtering functionality
- [ ] Search capabilities

## 🔧 Technical Requirements

### Dependencies to Install
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install stripe
npm install @types/stripe
```

### Environment Variables
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MARKETING_BLOG_API_URL=https://marketing.example.com/api/blog
```

### Database Schema Updates
- Add `payments` table to Convex schema
- Add `subscriptions` table to Convex schema
- Add `user_roles` table to Convex schema
- Update `users` table with payment-related fields

## 🚀 Deployment Strategy

### Staging Deployment
1. Deploy frontend components to Vercel
2. Deploy backend APIs to Vercel
3. Test Stripe integration in test mode
4. Verify RBAC functionality

### Production Deployment
1. Switch Stripe to production keys
2. Deploy to production environment
3. Monitor payment processing and webhook handling
4. Set up payment failure alerts

## 📊 Success Metrics

### Payment Processing
- Successful payment rate > 95%
- Average payment processing time < 30 seconds
- Payment failure recovery rate > 80%

### User Experience
- Time to complete payment < 2 minutes
- Form completion rate > 85%
- Subscription cancellation rate < 5%

### System Performance
- API response time < 200ms
- Webhook processing time < 1 second
- Uptime 99.9% for payment services

## 🔍 Risk Mitigation

### Payment Processing Risks
- Implement proper error handling for failed payments
- Set up Stripe webhook monitoring
- Create payment retry mechanisms
- Implement fraud detection measures

### RBAC Implementation Risks
- Thorough testing of role permissions
- Implement proper fallback mechanisms
- Create audit logs for role changes
- Set up alerts for unauthorized access attempts

### Integration Risks
- Implement proper error boundaries
- Create fallback content for blog integration
- Set up monitoring for API failures
- Implement proper caching strategies