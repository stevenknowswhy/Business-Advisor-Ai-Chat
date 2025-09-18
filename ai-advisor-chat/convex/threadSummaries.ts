import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticatedQuery, authenticatedMutation, validateConversationOwnership } from "./middleware";

/**
 * Thread Summary Management Functions
 *
 * These functions handle thread summary CRUD operations for storing
 * conversation summaries and context.
 */

// Get thread summaries for a conversation
export const getConversationSummaries = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("threadSummaries")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc") // Most recent first
      .take(limit);
  }),
});

// Get thread summary by ID
export const getSummaryById = query({
  args: {
    summaryId: v.id("threadSummaries"),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    const summary = await ctx.db.get(args.summaryId);
    if (!summary) {
      throw new Error("Thread summary not found");
    }

    // Type assertion to ensure summary has the correct type
    const threadSummary = summary as any;

    // Validate user owns the conversation
    await validateConversationOwnership(ctx, threadSummary.conversationId, user);

    return summary;
  }),
});

// Create thread summary (for migration purposes)
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    startMessageId: v.optional(v.string()),
    endMessageId: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const summaryId = await ctx.db.insert("threadSummaries", {
      conversationId: args.conversationId,
      content: args.content,
      startMessageId: args.startMessageId,
      endMessageId: args.endMessageId,
      createdAt: args.createdAt,
    });

    return summaryId;
  },
});

// Create new thread summary
export const createSummary = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    startMessageId: v.optional(v.string()),
    endMessageId: v.optional(v.string()),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);

    const summaryId = await ctx.db.insert("threadSummaries", {
      conversationId: args.conversationId,
      content: args.content,
      startMessageId: args.startMessageId,
      endMessageId: args.endMessageId,
      createdAt: Date.now(),
    });

    return summaryId;
  }),
});

// Update thread summary
export const updateSummary = mutation({
  args: {
    summaryId: v.id("threadSummaries"),
    content: v.optional(v.string()),
    startMessageId: v.optional(v.string()),
    endMessageId: v.optional(v.string()),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Get the summary and validate ownership through conversation
    const summary = await ctx.db.get(args.summaryId);
    if (!summary) {
      throw new Error("Thread summary not found");
    }

    // Type assertion to ensure summary has the correct type
    const threadSummary = summary as any;

    // Validate user owns the conversation
    await validateConversationOwnership(ctx, threadSummary.conversationId, user);

    const updates: any = {};
    if (args.content !== undefined) updates.content = args.content;
    if (args.startMessageId !== undefined) updates.startMessageId = args.startMessageId;
    if (args.endMessageId !== undefined) updates.endMessageId = args.endMessageId;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.summaryId, updates);
    }
  }),
});

// Delete thread summary
export const deleteSummary = mutation({
  args: {
    summaryId: v.id("threadSummaries"),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Get the summary and validate ownership through conversation
    const summary = await ctx.db.get(args.summaryId);
    if (!summary) {
      throw new Error("Thread summary not found");
    }

    // Type assertion to ensure summary has the correct type
    const threadSummary = summary as any;

    // Validate user owns the conversation
    await validateConversationOwnership(ctx, threadSummary.conversationId, user);

    await ctx.db.delete(args.summaryId);
  }),
});

// Clear all summaries for a conversation
export const clearConversationSummaries = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);

    const summaries = await ctx.db
      .query("threadSummaries")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }

    return summaries.length;
  }),
});

// Get summary statistics for a conversation
export const getSummaryStats = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);

    const summaries = await ctx.db
      .query("threadSummaries")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const stats = {
      totalSummaries: summaries.length,
      totalCharacters: summaries.reduce((sum, s) => sum + s.content.length, 0),
      firstSummaryAt: summaries.length > 0 ? Math.min(...summaries.map(s => s.createdAt)) : null,
      lastSummaryAt: summaries.length > 0 ? Math.max(...summaries.map(s => s.createdAt)) : null,
    };

    return stats;
  }),
});

// List all thread summaries (for migration compatibility)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("threadSummaries").collect();
  },
});
