import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticatedQuery, authenticatedMutation, validateConversationOwnership } from "./middleware";

/**
 * Advisor Memory Management Functions
 *
 * These functions handle advisor memory CRUD operations for storing
 * conversation-specific advisor memories and context.
 */

// Get advisor memories for a conversation
export const getConversationMemories = query({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.optional(v.id("advisors")),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    
    let query = ctx.db
      .query("advisorMemories")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId));

    if (args.advisorId) {
      query = ctx.db
        .query("advisorMemories")
        .withIndex("by_conversation_advisor", (q) => 
          q.eq("conversationId", args.conversationId).eq("advisorId", args.advisorId)
        );
    }

    return await query.collect();
  }),
});

// Get specific advisor memory by key
export const getMemoryByKey = query({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    key: v.string(),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    
    return await ctx.db
      .query("advisorMemories")
      .withIndex("by_conversation_advisor_key", (q) => 
        q.eq("conversationId", args.conversationId)
         .eq("advisorId", args.advisorId)
         .eq("key", args.key)
      )
      .first();
  }),
});

// Create advisor memory (for migration purposes)
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    key: v.string(),
    value: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const memoryId = await ctx.db.insert("advisorMemories", {
      conversationId: args.conversationId,
      advisorId: args.advisorId,
      key: args.key,
      value: args.value,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    return memoryId;
  },
});

// Create or update advisor memory
export const setMemory = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    key: v.string(),
    value: v.any(),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);

    // Check if memory already exists
    const existingMemory = await ctx.db
      .query("advisorMemories")
      .withIndex("by_conversation_advisor_key", (q) => 
        q.eq("conversationId", args.conversationId)
         .eq("advisorId", args.advisorId)
         .eq("key", args.key)
      )
      .first();

    if (existingMemory) {
      // Update existing memory
      await ctx.db.patch(existingMemory._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
      return existingMemory._id;
    } else {
      // Create new memory
      const memoryId = await ctx.db.insert("advisorMemories", {
        conversationId: args.conversationId,
        advisorId: args.advisorId,
        key: args.key,
        value: args.value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return memoryId;
    }
  }),
});

// Delete advisor memory
export const deleteMemory = mutation({
  args: {
    memoryId: v.id("advisorMemories"),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Get the memory and validate ownership through conversation
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) {
      throw new Error("Memory not found");
    }

    // Type assertion to ensure memory has the correct type
    const advisorMemory = memory as any;

    // Validate user owns the conversation
    const { conversation } = await validateConversationOwnership(ctx, advisorMemory.conversationId, user);

    await ctx.db.delete(args.memoryId);
  }),
});

// Clear all memories for a conversation and advisor
export const clearAdvisorMemories = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);

    const memories = await ctx.db
      .query("advisorMemories")
      .withIndex("by_conversation_advisor", (q) => 
        q.eq("conversationId", args.conversationId).eq("advisorId", args.advisorId)
      )
      .collect();

    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    return memories.length;
  }),
});

// List all advisor memories (for migration compatibility)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("advisorMemories").collect();
  },
});
