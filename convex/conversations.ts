import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { authenticatedQuery, authenticatedMutation, validateConversationOwnership } from "./middleware";

/**
 * Conversation Management Functions
 *
 * These functions handle conversation CRUD operations,
 * replacing the current /api/conversations endpoints.
 */

// Get user's conversations with message counts and last message
export const getUserConversations = query({
  args: {},
  handler: authenticatedQuery(async (ctx, args, user) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50); // Limit to recent conversations

    // Get additional data for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Get message count
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();

        // Get last message
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation_created", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();

        // Get active advisor details
        let activeAdvisor = null;
        if (conv.activeAdvisorId) {
          activeAdvisor = await ctx.db.get(conv.activeAdvisorId);
        }

        return {
          ...conv,
          messageCount: messages.length,
          lastMessage: lastMessage ? {
            content: lastMessage.content.slice(0, 100) + (lastMessage.content.length > 100 ? "..." : ""),
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender,
          } : null,
          activeAdvisor: activeAdvisor ? {
            _id: activeAdvisor._id,
            name: activeAdvisor.persona.name,
            title: activeAdvisor.persona.title,
            imageUrl: activeAdvisor.imageUrl,
          } : null,
        };
      })
    );

    return conversationsWithDetails;
  }),
});

// Get conversation by ID with messages
export const getConversationById = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: authenticatedQuery(async (ctx, args: { conversationId: any }, user) => {
    const { conversation } = await validateConversationOwnership(ctx, args.conversationId, user);

    // Get all messages for this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    // Get advisor details for messages
    const messagesWithAdvisors = await Promise.all(
      messages.map(async (message) => {
        let advisor = null;
        if (message.advisorId) {
          advisor = await ctx.db.get(message.advisorId);
        }

        return {
          ...message,
          advisor: advisor ? {
            _id: advisor._id,
            name: advisor.persona.name,
            title: advisor.persona.title,
            imageUrl: advisor.imageUrl,
          } : null,
        };
      })
    );

    // Get active advisor details
    let activeAdvisor = null;
    if ((conversation as any).activeAdvisorId) {
      activeAdvisor = await ctx.db.get((conversation as any).activeAdvisorId);
    }

    return {
      ...conversation,
      messages: messagesWithAdvisors,
      activeAdvisor: activeAdvisor ? {
        _id: activeAdvisor._id,
        name: (activeAdvisor as any).persona.name,
        title: (activeAdvisor as any).persona.title,
        imageUrl: (activeAdvisor as any).imageUrl,
        persona: (activeAdvisor as any).persona,
      } : null,
    };
  }),
});

// Create conversation (for migration purposes)
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
    activeAdvisorId: v.optional(v.id("advisors")),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title,
      activeAdvisorId: args.activeAdvisorId,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    return conversationId;
  },
});

// Create new conversation
export const createConversation = mutation({
  args: {
    title: v.optional(v.string()),
    activeAdvisorId: v.optional(v.id("advisors")),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // If no advisor specified, get the first active advisor
    let advisorId = args.activeAdvisorId;
    if (!advisorId) {
      const defaultAdvisor = await ctx.db
        .query("advisors")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .first();
      advisorId = defaultAdvisor?._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      userId: user._id,
      title: args.title || "New Conversation",
      activeAdvisorId: advisorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return conversationId;
  }),
});

// Update conversation
export const updateConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    activeAdvisorId: v.optional(v.id("advisors")),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    const { conversation } = await validateConversationOwnership(ctx, args.conversationId, user);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.activeAdvisorId !== undefined) updates.activeAdvisorId = args.activeAdvisorId;

    await ctx.db.patch(args.conversationId, updates);
  }),
});

// Delete conversation
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    const { conversation } = await validateConversationOwnership(ctx, args.conversationId, user);

    // Delete all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete advisor memories for this conversation
    const memories = await ctx.db
      .query("advisorMemories")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    // Delete thread summaries for this conversation
    const summaries = await ctx.db
      .query("threadSummaries")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }

    // Finally delete the conversation
    await ctx.db.delete(args.conversationId);
  }),
});

// List all conversations (for migration compatibility)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("conversations").collect();
  },
});

// Alias for getUserConversations (for frontend compatibility)
export const getConversations = getUserConversations;
