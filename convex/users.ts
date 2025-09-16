import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, getCurrentUser } from "./auth";
import { authenticatedQuery, authenticatedMutation, requireAdmin } from "./middleware";

/**
 * User Management Functions
 *
 * These functions handle user creation, updates, and queries
 * integrating with Clerk authentication.
 */

// Get or create user from Clerk authentication (deprecated - use auth.ts functions)
export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update user info if provided
      if (args.email || args.name || args.image) {
        await ctx.db.patch(existingUser._id, {
          email: args.email ?? existingUser.email,
          name: args.name ?? existingUser.name,
          image: args.image ?? existingUser.image,
          updatedAt: Date.now(),
        });
      }
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      plan: "free", // Default plan
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Clerk ID (admin function)
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Require admin access to look up users by Clerk ID
    await requireAdmin(ctx, user);

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  }),
});

// Get user by ID (admin function)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Require admin access to look up users by ID
    await requireAdmin(ctx, user);

    return await ctx.db.get(args.userId);
  }),
});

// Update user plan (admin function)
export const updateUserPlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Require admin access to update user plans
    await requireAdmin(ctx, user);

    await ctx.db.patch(args.userId, {
      plan: args.plan,
      updatedAt: Date.now(),
    });
  }),
});

// Update user profile (admin function - for updating other users)
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Require admin access to update other users' profiles
    await requireAdmin(ctx, user);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.image !== undefined) updates.image = args.image;

    await ctx.db.patch(args.userId, updates);
  }),
});

// Get all users (admin function)
export const getAllUsers = query({
  args: {},
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Require admin access to list all users
    await requireAdmin(ctx, user);

    return await ctx.db.query("users").collect();
  }),
});

// Delete user (admin function)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Require admin access to delete users
    await requireAdmin(ctx, user);

    // Note: In a real app, you'd want to handle cascading deletes
    // or prevent deletion if user has conversations
    await ctx.db.delete(args.userId);
  }),
});

// Create user (for migration purposes)
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    plan: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      plan: args.plan,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    return userId;
  },
});

// List all users (for migration validation)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
