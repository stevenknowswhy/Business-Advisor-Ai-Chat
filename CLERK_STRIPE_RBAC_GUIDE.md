# Clerk + Stripe Integration & RBAC Implementation Guide

## Overview
This guide provides comprehensive best practices for integrating Clerk authentication with Stripe payments and implementing Role-Based Access Control (RBAC) in a Next.js application.

## Current System Analysis

### Existing Clerk Setup
The current codebase uses Clerk for authentication with:
- **ClerkProvider** in the main layout
- **Middleware** for route protection
- **Public route configuration** for auth flows
- **Convex integration** for backend state management

### Key Dependencies
```json
"@clerk/nextjs": "^6.32.0",
"convex": "^1.27.1",
"@convex-dev/auth": "^0.0.89",
"zod": "^3.25.76"
```

## 1. Clerk + Stripe Integration Best Practices

### 1.1 User Registration and Stripe Customer Creation

**Best Practice**: Create Stripe customer during user registration
```typescript
// src/lib/stripe/customer.ts
import { Stripe } from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function createStripeUser(clerkUserId: string) {
  const user = await clerkClient.users.getUser(clerkUserId);

  const customer = await stripe.customers.create({
    email: user.emailAddresses[0]?.emailAddress,
    name: `${user.firstName} ${user.lastName}`.trim(),
    metadata: {
      clerkUserId: clerkUserId,
    },
  });

  // Store Stripe customer ID in Clerk user metadata
  await clerkClient.users.updateUser(clerkUserId, {
    publicMetadata: {
      stripeCustomerId: customer.id,
    },
  });

  return customer;
}
```

### 1.2 Webhook Endpoint Security

**Best Practice**: Secure webhook endpoints with proper validation
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      await handleInvoicePayment(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
```

### 1.3 Subscription Status Management

**Best Practice**: Sync subscription status with Clerk metadata
```typescript
// src/lib/stripe/subscriptions.ts
import { clerkClient } from '@clerk/nextjs/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);

  if (!customer || customer.deleted) {
    console.error('Customer not found for subscription:', subscription.id);
    return;
  }

  const clerkUserId = customer.metadata?.clerkUserId;
  if (!clerkUserId) {
    console.error('No Clerk user ID found for customer:', customer.id);
    return;
  }

  // Update user metadata with subscription info
  await clerkClient.users.updateUser(clerkUserId, {
    publicMetadata: {
      stripeCustomerId: customer.id,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      planType: subscription.items.data[0]?.price?.lookup_key || 'free',
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}
```

### 1.4 Customer Portal Integration

**Best Practice**: Use Stripe Customer Portal for subscription management
```typescript
// src/app/api/portal/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's Stripe customer ID from metadata
  const user = await clerkClient.users.getUser(userId);
  const stripeCustomerId = user.publicMetadata.stripeCustomerId as string;

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

## 2. RBAC Implementation with Clerk

### 2.1 Role Definition and Management

**Best Practice**: Use Clerk's public metadata for role management
```typescript
// src/types/roles.ts
export type UserRole = 'admin' | 'editor' | 'user' | 'guest';

export type Permission =
  | 'read:content'
  | 'write:content'
  | 'delete:content'
  | 'manage:users'
  | 'manage:billing'
  | 'access:premium_features';

export interface RolePermissions {
  [key: string]: Permission[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'read:content',
    'write:content',
    'delete:content',
    'manage:users',
    'manage:billing',
    'access:premium_features',
  ],
  editor: [
    'read:content',
    'write:content',
    'access:premium_features',
  ],
  user: [
    'read:content',
    'write:content',
  ],
  guest: [
    'read:content',
  ],
};
```

### 2.2 Enhanced Middleware with Role Protection

**Best Practice**: Extend middleware to support role-based access
```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { ROLE_PERMISSIONS } from "./types/roles";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  // ... other public routes
]);

const isRoleProtectedRoute = createRouteMatcher({
  admin: ["/admin(.*)", "/api/admin(.*)"],
  editor: ["/editor(.*)", "/api/editor(.*)"],
  premium: ["/premium(.*)", "/api/premium(.*)"],
});

function hasPermission(role: string, requiredPermissions: string[]): boolean {
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

export default clerkMiddleware(async (auth, req) => {
  // Check public routes first
  if (isPublicRoute(req)) {
    return;
  }

  // Protect authentication-required routes
  await auth.protect();

  const { userId } = await auth();
  if (!userId) return;

  // Get user role from metadata
  const user = await clerkClient.users.getUser(userId);
  const userRole = user.publicMetadata.role as string || 'user';

  // Check role-based route protection
  if (isRoleProtectedRoute.admin(req)) {
    if (!hasPermission(userRole, ['manage:users'])) {
      return new Response('Forbidden: Admin access required', { status: 403 });
    }
  }

  if (isRoleProtectedRoute.editor(req)) {
    if (!hasPermission(userRole, ['write:content'])) {
      return new Response('Forbidden: Editor access required', { status: 403 });
    }
  }

  if (isRoleProtectedRoute.premium(req)) {
    if (!hasPermission(userRole, ['access:premium_features'])) {
      return new Response('Forbidden: Premium subscription required', { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 2.3 Server-Side Role Checking Utilities

**Best Practice**: Create reusable utilities for server-side authorization
```typescript
// src/lib/auth/server.ts
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/roles';

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await clerkClient.users.getUser(userId);
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    role: user.publicMetadata.role as UserRole || 'user',
    subscriptionStatus: user.publicMetadata.subscriptionStatus as string,
    stripeCustomerId: user.publicMetadata.stripeCustomerId as string,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth();
  if (user.role !== requiredRole) {
    throw new Error(`Role ${requiredRole} required`);
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];

  if (!userPermissions.includes(permission)) {
    throw new Error(`Permission ${permission} required`);
  }

  return user;
}

export async function requireSubscription(minimumStatus: string = 'active') {
  const user = await requireAuth();
  const subscriptionStatus = user.subscriptionStatus;

  if (!subscriptionStatus || subscriptionStatus !== minimumStatus) {
    throw new Error(`Subscription status ${minimumStatus} required`);
  }

  return user;
}
```

### 2.4 Client-Side Role Components

**Best Practice**: Create components for conditional rendering based on roles
```typescript
// src/components/auth/RoleGuard.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/roles';

interface RoleGuardProps {
  roles?: UserRole[];
  permissions?: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({
  roles = [],
  permissions = [],
  fallback = null,
  children
}: RoleGuardProps) {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return <>{fallback}</>;
  }

  const userRole = user.publicMetadata.role as UserRole || 'user';

  // Check role-based access
  if (roles.length > 0 && !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasAllPermissions = permissions.every(perm =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Usage example:
// <RoleGuard roles={['admin', 'editor']} permissions={['write:content']}>
//   <EditButton />
// </RoleGuard>
```

## 3. Subscription Management Patterns

### 3.1 Feature Gating Components

**Best Practice**: Create components for feature gating based on subscription status
```typescript
// src/components/billing/FeatureGate.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface FeatureGateProps {
  feature: string;
  requiredPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
  children: React.ReactNode;
  upgradeMessage?: string;
}

export function FeatureGate({
  feature,
  requiredPlan = 'free',
  children,
  upgradeMessage = 'Upgrade to access this feature'
}: FeatureGateProps) {
  const { isLoaded, isSignedIn, user } = useAuth();
  const router = useRouter();

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">Please sign in to access this feature</p>
        <Button onClick={() => router.push('/sign-in')} className="mt-2">
          Sign In
        </Button>
      </div>
    );
  }

  const userPlan = user.publicMetadata.planType as string || 'free';
  const subscriptionStatus = user.publicMetadata.subscriptionStatus as string;

  // Check if user has access to this feature
  const planHierarchy = { free: 0, basic: 1, premium: 2, enterprise: 3 };
  const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];

  if (userPlanLevel >= requiredPlanLevel && subscriptionStatus === 'active') {
    return <>{children}</>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <p className="text-sm text-gray-600">{upgradeMessage}</p>
      <Button onClick={() => router.push('/pricing')} className="mt-2">
        View Plans
      </Button>
    </div>
  );
}
```

### 3.2 Subscription Status Utilities

**Best Practice**: Create utilities for checking subscription status
```typescript
// src/lib/billing/subscription.ts
import { clerkClient } from '@clerk/nextjs/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export interface SubscriptionInfo {
  status: string;
  planType: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  hasAccess: boolean;
  isTrialing: boolean;
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  const user = await clerkClient.users.getUser(userId);

  if (!user.publicMetadata.stripeCustomerId) {
    return {
      status: 'none',
      planType: 'free',
      currentPeriodEnd: 0,
      cancelAtPeriodEnd: false,
      hasAccess: true,
      isTrialing: false,
    };
  }

  const customerId = user.publicMetadata.stripeCustomerId as string;
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 1,
  });

  const subscription = subscriptions.data[0];

  if (!subscription) {
    return {
      status: 'none',
      planType: 'free',
      currentPeriodEnd: 0,
      cancelAtPeriodEnd: false,
      hasAccess: true,
      isTrialing: false,
    };
  }

  const planType = subscription.items.data[0]?.price?.lookup_key || 'free';
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const isTrialing = subscription.status === 'trialing';

  return {
    status: subscription.status,
    planType,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    hasAccess: isActive,
    isTrialing,
  };
}

export function checkFeatureAccess(
  subscription: SubscriptionInfo,
  requiredPlan: string
): boolean {
  const planHierarchy = { free: 0, basic: 1, premium: 2, enterprise: 3 };
  const userPlanLevel = planHierarchy[subscription.planType as keyof typeof planHierarchy] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy] || 0;

  return userPlanLevel >= requiredPlanLevel && subscription.hasAccess;
}
```

### 3.3 Graceful Subscription Expiration Handling

**Best Practice**: Handle subscription expiration gracefully
```typescript
// src/components/billing/SubscriptionBanner.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function SubscriptionBanner() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const subscriptionStatus = user.publicMetadata.subscriptionStatus as string;
    const cancelAtPeriodEnd = user.publicMetadata.cancelAtPeriodEnd as boolean;
    const currentPeriodEnd = user.publicMetadata.currentPeriodEnd as number;

    // Show banner if subscription is canceled but still active
    if (subscriptionStatus === 'active' && cancelAtPeriodEnd) {
      const daysUntilExpiry = Math.ceil(
        (currentPeriodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 7) {
        setShowBanner(true);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  if (!showBanner) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Subscription Cancellation
          </h3>
          <p className="text-sm text-yellow-700">
            Your subscription will end soon. Renew to continue accessing premium features.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/settings/billing')}
          >
            Manage Subscription
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## 4. Security Considerations

### 4.1 Environment Variable Management

**Best Practice**: Secure environment variable configuration
```typescript
// src/lib/env.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    DATABASE_URL: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
});
```

### 4.2 Rate Limiting for API Routes

**Best Practice**: Implement rate limiting for sensitive endpoints
```typescript
// src/lib/rateLimit.ts
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  constructor(private options: RateLimitOptions) {}

  async check(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.options.keyGenerator
      ? this.options.keyGenerator(req)
      : this.generateKey(req);

    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Clean up old entries
    this.cleanup(windowStart);

    let record = this.store.get(key);

    if (!record || record.resetTime < windowStart) {
      record = { count: 1, resetTime: now + this.options.windowMs };
      this.store.set(key, record);
    } else {
      record.count++;
    }

    const allowed = record.count <= this.options.maxRequests;
    const remaining = Math.max(0, this.options.maxRequests - record.count);

    return { allowed, remaining, resetTime: record.resetTime };
  }

  private generateKey(req: NextRequest): string {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const userId = req.headers.get('x-user-id') || 'anonymous';
    return createHash('sha256').update(`${ip}:${userId}`).digest('hex');
  }

  private cleanup(windowStart: number): void {
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < windowStart) {
        this.store.delete(key);
      }
    }
  }
}

// Usage in API routes:
// const rateLimiter = new RateLimiter({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   maxRequests: 100,
// });
```

### 4.3 CSP Configuration

**Best Practice**: Configure Content Security Policy for payment pages
```typescript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: *.stripe.com",
              "font-src 'self'",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "connect-src 'self' https://api.stripe.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## 5. Complete Implementation Examples

### 5.1 Checkout Session Creation

```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId, successUrl, cancelUrl } = await request.json();

  // Get or create Stripe customer
  const user = await clerkClient.users.getUser(userId);
  let stripeCustomerId = user.publicMetadata.stripeCustomerId as string;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName} ${user.lastName}`.trim(),
      metadata: { clerkUserId: userId },
    });

    stripeCustomerId = customer.id;

    // Store customer ID in user metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { stripeCustomerId: customer.id },
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      clerkUserId: userId,
    },
  });

  return NextResponse.json({ sessionId: session.id });
}
```

### 5.2 Subscription Management Dashboard

```typescript
// src/components/billing/SubscriptionManager.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SubscriptionData {
  status: string;
  planType: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionManager() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isLoaded, isSignedIn]);

  const handlePortalAccess = async () => {
    try {
      const response = await fetch('/api/portal/create', {
        method: 'POST',
      });
      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!subscription) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">No Active Subscription</h3>
          <Button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Subscription</h3>
            <p className="text-sm text-gray-600">
              Plan: {subscription.planType}
            </p>
            <p className="text-sm text-gray-600">
              Status: {subscription.status}
            </p>
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-red-600">
                Cancels on {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button onClick={handlePortalAccess}>
            Manage Subscription
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

## Conclusion

This comprehensive guide provides the foundation for implementing Clerk authentication with Stripe payments and RBAC in your Next.js application. The patterns shown here follow industry best practices for security, scalability, and maintainability.

### Key Takeaways:

1. **Security First**: Always validate webhooks, use proper authentication, and implement rate limiting
2. **Sync Data**: Keep subscription status synchronized between Stripe and Clerk
3. **Graceful Handling**: Provide clear feedback for subscription states and access restrictions
4. **Component-Based**: Create reusable components for role-based rendering and feature gating
5. **Type Safety**: Use TypeScript interfaces and Zod validation for type-safe implementations

### Next Steps:

1. Implement the webhook endpoint for subscription synchronization
2. Set up the Stripe customer portal for user self-service
3. Create role-based access controls for your specific use cases
4. Implement proper error handling and user feedback
5. Set up monitoring for subscription events and payment failures

This implementation provides a solid foundation for a production-ready authentication and payment system with Clerk and Stripe.