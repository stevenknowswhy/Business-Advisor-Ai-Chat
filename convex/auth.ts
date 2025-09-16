import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Authentication Functions
 *
 * These functions handle user authentication, sync with Clerk,
 * and provide authenticated context for protected operations.
 */

/**
 * Validate Clerk session token and extract user information
 */
async function validateClerkSessionToken(token: string) {
  try {
    console.log("Validating Clerk session token...");

    // Verify the session token with Clerk
    const response = await fetch("https://api.clerk.com/v1/sessions/verify", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error("Session verification failed:", response.status, response.statusText);
      return null;
    }

    const session = await response.json();
    console.log("Session verified successfully:", session.user_id);

    return {
      userId: session.user_id,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Failed to validate session token:", error);
    return null;
  }
}

/**
 * Extract and validate Clerk user from Convex auth context
 */
async function getValidatedClerkUser(auth: any) {
  try {
    // Use Convex's getUserIdentity function to get the user identity
    const identity = await auth.getUserIdentity();

    if (!identity) {
      console.log("No user identity found");
      return null;
    }

    console.log("User identity found:", identity.subject);

    return {
      userId: identity.subject,
      sessionId: identity.tokenIdentifier,
    };
  } catch (error) {
    console.error("Failed to get user identity:", error);
    return null;
  }
}

/**
 * Get user identity information from Clerk API
 */
async function getUserIdentityFromClerk(userId: string) {
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch user from Clerk:", error);
    return null;
  }
}

/**
 * Get authenticated user with session token validation
 * This replaces the requireUser() function from the Prisma setup
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const sessionData = await getValidatedClerkUser(ctx.auth);

  if (!sessionData) {
    throw new Error("User not authenticated");
  }

  // Check if user exists in Convex
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", sessionData.userId))
    .first();

  if (!user) {
    throw new Error("User not found. Please sync your account first.");
  }

  return user;
}

/**
 * Get or create authenticated user with session token validation (for mutations only)
 * This automatically syncs user from Clerk if they don't exist
 */
export async function requireUserWithAutoSync(ctx: MutationCtx) {
  const sessionData = await getValidatedClerkUser(ctx.auth);

  if (!sessionData) {
    throw new Error("User not authenticated");
  }

  // Check if user exists in Convex
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", sessionData.userId))
    .first();

  if (!user) {
    // Auto-sync user from Clerk if they don't exist
    const clerkUser = await getUserIdentityFromClerk(sessionData.userId);
    if (!clerkUser) {
      throw new Error("Unable to get user identity from Clerk");
    }

    // Extract user info from Clerk API response
    const email = clerkUser.primary_email_address?.email_address || clerkUser.email_addresses?.[0]?.email_address;
    const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || clerkUser.username;
    const image = clerkUser.image_url;

    console.log("Creating new user:", { clerkId: sessionData.userId, email, name });

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: sessionData.userId,
      email,
      name,
      image,
      plan: "free", // Default plan
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Fetch the newly created user
    user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    console.log("User created successfully:", user._id);
  }

  return user;
}

/**
 * Sync user from Clerk (mutation)
 * This creates or updates a user record from Clerk authentication
 * Returns the user object for immediate use
 */
export const syncUserFromClerk = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUserWithAutoSync(ctx);
    return user;
  },
});

/**
 * Ensure user exists (lightweight sync)
 * This is a simple endpoint to ensure user is synced before queries
 */
export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUserWithAutoSync(ctx);
    return { success: true, userId: user._id };
  },
});

/**
 * Get current authenticated user (returns null if not authenticated)
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const sessionData = await getValidatedClerkUser(ctx.auth);

  if (!sessionData) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", sessionData.userId))
    .first();
}



/**
 * Get current authenticated user info with fresh Clerk data (public query)
 */
export const getCurrentUserInfo = query({
  args: {},
  handler: async (ctx) => {
    const sessionData = await getValidatedClerkUser(ctx.auth);
    if (!sessionData) {
      return null;
    }

    const clerkId = sessionData.userId;

    // Get user from local database
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    // Queries are read-only in Convex. If the user doesn't exist yet,
    // return null and let the client call the sync/ensure mutation.
    if (!user) {
      return null;
    }

    return user;
  },
});

/**
 * Update current user's profile
 */
export const updateCurrentUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.image !== undefined) updates.image = args.image;

    await ctx.db.patch(user._id, updates);
    
    return user._id;
  },
});

/**
 * Update current user's plan
 */
export const updateCurrentUserPlan = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    await ctx.db.patch(user._id, {
      plan: args.plan,
      updatedAt: Date.now(),
    });
    
    return user._id;
  },
});

/**
 * Delete current user account
 */
export const deleteCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    
    // Note: In a real app, you'd want to handle cascading deletes
    // or prevent deletion if user has conversations
    await ctx.db.delete(user._id);
    
    return { success: true };
  },
});

/**
 * Check if current user has a specific plan
 */
export const hasUserPlan = query({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return user?.plan === args.plan;
  },
});

/**
 * Get user statistics (for dashboard)
 */
export const getCurrentUserStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    
    // Get user's conversation count
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get user's message count
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("sender"), "user"))
      .collect();

    // Filter messages from user's conversations
    const conversationIds = conversations.map(c => c._id);
    const userMessages = messages.filter(m => conversationIds.includes(m.conversationId));

    return {
      conversationCount: conversations.length,
      messageCount: userMessages.length,
      plan: user.plan,
      memberSince: user.createdAt,
    };
  },
});
