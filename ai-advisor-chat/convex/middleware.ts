import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { requireUser, requireUserWithAutoSync, getCurrentUser } from "./auth";

/**
 * Authentication Middleware
 * 
 * These helpers provide authentication middleware for Convex functions,
 * replacing the requireUser() pattern from the Prisma setup.
 */

/**
 * Authenticated query wrapper
 * Ensures user is authenticated before executing the query
 */
export function authenticatedQuery<Args, Output>(
  handler: (ctx: QueryCtx, args: Args, user: NonNullable<Awaited<ReturnType<typeof requireUser>>>) => Promise<Output>
) {
  return async (ctx: QueryCtx, args: Args): Promise<Output> => {
    const user = await requireUser(ctx);
    return handler(ctx, args, user);
  };
}

/**
 * Authenticated mutation wrapper
 * Ensures user is authenticated before executing the mutation
 * Automatically syncs user from Clerk if they don't exist
 */
export function authenticatedMutation<Args, Output>(
  handler: (ctx: MutationCtx, args: Args, user: NonNullable<Awaited<ReturnType<typeof requireUserWithAutoSync>>>) => Promise<Output>
) {
  return async (ctx: MutationCtx, args: Args): Promise<Output> => {
    const user = await requireUserWithAutoSync(ctx);
    return handler(ctx, args, user);
  };
}

/**
 * Optional authentication query wrapper
 * Provides user context if authenticated, null otherwise
 */
export function optionalAuthQuery<Args, Output>(
  handler: (ctx: QueryCtx, args: Args, user: Awaited<ReturnType<typeof getCurrentUser>>) => Promise<Output>
) {
  return async (ctx: QueryCtx, args: Args): Promise<Output> => {
    const user = await getCurrentUser(ctx);
    return handler(ctx, args, user);
  };
}

/**
 * Optional authentication mutation wrapper
 * Provides user context if authenticated, null otherwise
 */
export function optionalAuthMutation<Args, Output>(
  handler: (ctx: MutationCtx, args: Args, user: Awaited<ReturnType<typeof getCurrentUser>>) => Promise<Output>
) {
  return async (ctx: MutationCtx, args: Args): Promise<Output> => {
    const user = await getCurrentUser(ctx);
    return handler(ctx, args, user);
  };
}

/**
 * User ownership validation
 * Ensures the authenticated user owns the specified resource
 */
export async function validateUserOwnership(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: string,
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
) {
  const currentUser = user || await requireUser(ctx);
  
  if (currentUser._id !== resourceUserId) {
    throw new Error("Access denied: User does not own this resource");
  }
  
  return currentUser;
}

/**
 * Conversation ownership validation
 * Ensures the authenticated user owns the specified conversation
 */
export async function validateConversationOwnership(
  ctx: QueryCtx | MutationCtx,
  conversationId: any,
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
) {
  const currentUser = user || await requireUser(ctx);

  const conversation = await ctx.db.get(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  
  if ((conversation as any).userId !== currentUser._id) {
    throw new Error("Access denied: User does not own this conversation");
  }
  
  return { user: currentUser, conversation };
}

/**
 * Plan-based access control
 * Ensures user has the required plan level
 */
export async function requirePlan(
  ctx: QueryCtx | MutationCtx,
  requiredPlan: "free" | "pro" | "enterprise",
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
) {
  const currentUser = user || await requireUser(ctx);
  
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
  const userPlanLevel = planHierarchy[currentUser.plan as keyof typeof planHierarchy] ?? 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];
  
  if (userPlanLevel < requiredPlanLevel) {
    throw new Error(`Access denied: ${requiredPlan} plan required`);
  }
  
  return currentUser;
}

/**
 * Rate limiting helper (basic implementation)
 * In a real app, you'd want more sophisticated rate limiting
 */
export async function checkRateLimit(
  ctx: QueryCtx | MutationCtx,
  action: string,
  limit: number,
  windowMs: number,
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
) {
  const currentUser = user || await requireUser(ctx);
  
  // For now, just return true - implement actual rate limiting as needed
  // You could store rate limit data in a separate Convex table
  return true;
}

/**
 * Admin access control
 * Ensures user has admin privileges (based on plan or specific flag)
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
) {
  const currentUser = user || await requireUser(ctx);
  
  // For now, enterprise users are considered admins
  // In a real app, you'd have a separate admin flag or role system
  if (currentUser.plan !== "enterprise") {
    throw new Error("Access denied: Admin privileges required");
  }
  
  return currentUser;
}

/**
 * Batch ownership validation
 * Validates ownership of multiple resources at once
 */
export async function validateBatchOwnership<T extends { userId: string }>(
  ctx: QueryCtx | MutationCtx,
  resources: T[],
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
) {
  const currentUser = user || await requireUser(ctx);
  
  const invalidResources = resources.filter(resource => resource.userId !== currentUser._id);
  
  if (invalidResources.length > 0) {
    throw new Error(`Access denied: User does not own ${invalidResources.length} resource(s)`);
  }
  
  return currentUser;
}

/**
 * Context enrichment helper
 * Adds user context to function parameters
 */
export type EnrichedContext<T> = T & {
  user: NonNullable<Awaited<ReturnType<typeof requireUser>>>;
};

/**
 * Enrich context with authenticated user
 */
export async function enrichContext<T extends QueryCtx | MutationCtx>(
  ctx: T,
  user?: NonNullable<Awaited<ReturnType<typeof requireUser>>>
): Promise<EnrichedContext<T>> {
  const currentUser = user || await requireUser(ctx);
  
  return {
    ...ctx,
    user: currentUser,
  };
}
