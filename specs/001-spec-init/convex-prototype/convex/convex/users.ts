import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      // If Convex withIndex signature is not available, the filter still works; index exists for performance.
      .filter(q => q.eq(q.field("clerkId"), clerkId))
      .first();
    return user ?? null;
  },
});

export const ensureUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email ?? null,
        name: args.name ?? existing.name ?? null,
        plan: args.plan ?? existing.plan ?? null,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const _id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      legacyId: null,
      email: args.email ?? null,
      name: args.name ?? null,
      plan: args.plan ?? "free",
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(_id);
  },
});



export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();
    return user ?? null;
  },
});

export const ensureCurrentUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const clerkId = identity.subject;
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email ?? null,
        name: args.name ?? existing.name ?? null,
        image: args.image ?? existing.image ?? null,
        plan: args.plan ?? existing.plan ?? null,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }
    const _id = await ctx.db.insert("users", {
      clerkId,
      legacyId: null,
      email: args.email ?? null,
      name: args.name ?? null,
      image: args.image ?? null,
      plan: args.plan ?? "free",
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(_id);
  },
});


export const getOrEnsureCurrentUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const clerkId = identity.subject;
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();
    if (existing) return existing;
    const now = Date.now();
    const _id = await ctx.db.insert("users", {
      clerkId,
      legacyId: null,
      email: args.email ?? null,
      name: args.name ?? null,
      image: args.image ?? null,
      plan: args.plan ?? "free",
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(_id);
  },
});
