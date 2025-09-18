import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { authenticatedQuery, authenticatedMutation, validateConversationOwnership } from "./middleware";

/**
 * Message Management Functions
 *
 * These functions handle message CRUD operations with real-time capabilities,
 * replacing the current /api/messages endpoints.
 */

// Get messages for a conversation (with real-time subscription support)
export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    const limit = args.limit || 100;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(limit);

    // Get advisor details for each message
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

    return messagesWithAdvisors;
  }),
});

// Get recent messages across all conversations (for activity feed)
export const getRecentMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    const limit = args.limit || 50;
    
    // Get user's conversations
    const userConversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const conversationIds = userConversations.map(conv => conv._id);

    // Get recent messages from user's conversations
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit * 2); // Get more to filter by user's conversations

    // Filter messages that belong to user's conversations
    const userMessages = messages
      .filter(message => conversationIds.includes(message.conversationId))
      .slice(0, limit);

    // Get additional details for each message
    const messagesWithDetails = await Promise.all(
      userMessages.map(async (message) => {
        let advisor = null;
        if (message.advisorId) {
          advisor = await ctx.db.get(message.advisorId);
        }

        const conversation = await ctx.db.get(message.conversationId);

        return {
          ...message,
          advisor: advisor ? {
            _id: advisor._id,
            name: advisor.persona.name,
            title: advisor.persona.title,
            imageUrl: advisor.imageUrl,
          } : null,
          conversation: conversation ? {
            _id: conversation._id,
            title: conversation.title,
          } : null,
        };
      })
    );

    return messagesWithDetails;
  }),
});

// Create message (for migration purposes)
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    sender: v.union(v.literal("user"), v.literal("advisor"), v.literal("system")),
    advisorId: v.optional(v.id("advisors")),
    content: v.string(),
    contentJson: v.optional(v.any()),
    mentions: v.array(v.string()),
    tokensUsed: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: args.sender,
      advisorId: args.advisorId,
      content: args.content,
      contentJson: args.contentJson,
      mentions: args.mentions,
      tokensUsed: args.tokensUsed,
      createdAt: args.createdAt,
    });

    return messageId;
  },
});

// Send a new message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    sender: v.union(v.literal("user"), v.literal("advisor"), v.literal("system")),
    advisorId: v.optional(v.id("advisors")),
    content: v.string(),
    contentJson: v.optional(v.any()),
    mentions: v.optional(v.array(v.string())),
    tokensUsed: v.optional(v.number()),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: args.sender,
      advisorId: args.advisorId,
      content: args.content,
      contentJson: args.contentJson,
      mentions: args.mentions || [],
      tokensUsed: args.tokensUsed,
      createdAt: Date.now(),
    });

    // Update conversation's updatedAt timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  }),
});

// Update message (for editing)
export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.optional(v.string()),
    contentJson: v.optional(v.any()),
    mentions: v.optional(v.array(v.string())),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Get the message and validate ownership through conversation
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await validateConversationOwnership(ctx, (message as any).conversationId, user);
    const { messageId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(args.messageId, filteredUpdates);
    }
  }),
});

// Delete message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Get the message and validate ownership through conversation
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await validateConversationOwnership(ctx, (message as any).conversationId, user);

    await ctx.db.delete(args.messageId);
  }),
});

// Get message by ID
export const getMessageById = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) return null;

    // Get advisor details if present
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
  },
});

// Search messages in a conversation
export const searchMessages = query({
  args: {
    conversationId: v.id("conversations"),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Simple text search (in a real app, you might want full-text search)
    const searchResults = messages
      .filter(message => 
        message.content.toLowerCase().includes(args.searchTerm.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Get advisor details for search results
    const resultsWithAdvisors = await Promise.all(
      searchResults.map(async (message) => {
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

    return resultsWithAdvisors;
  },
});

// Get message statistics for a conversation
export const getMessageStats = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const stats = {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.sender === "user").length,
      advisorMessages: messages.filter(m => m.sender === "advisor").length,
      systemMessages: messages.filter(m => m.sender === "system").length,
      totalTokens: messages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0),
      firstMessageAt: messages.length > 0 ? Math.min(...messages.map(m => m.createdAt)) : null,
      lastMessageAt: messages.length > 0 ? Math.max(...messages.map(m => m.createdAt)) : null,
    };

    return stats;
  },
});

// List all messages (for migration compatibility)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});

// Temporary non-authenticated functions for migration testing

// Get message by ID for migration
export const getMessageByIdForMigration = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) return null;

    // Get advisor details if present
    let advisor = null;
    if (message.advisorId) {
      advisor = await ctx.db.get(message.advisorId);
    }

    // Get conversation details
    const conversation = await ctx.db.get(message.conversationId);

    return {
      ...message,
      advisor: advisor ? {
        _id: advisor._id,
        name: advisor.persona.name,
        title: advisor.persona.title,
        imageUrl: advisor.imageUrl,
        persona: advisor.persona,
      } : null,
      conversation: conversation ? {
        _id: conversation._id,
        title: conversation.title,
        userId: conversation.userId,
      } : null,
    };
  },
});

// Update message for migration
export const updateMessageForMigration = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.optional(v.string()),
    contentJson: v.optional(v.any()),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow editing user messages
    if (message.sender !== "user") {
      throw new Error("Only user messages can be edited");
    }

    const { messageId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(args.messageId, filteredUpdates);
    }

    // Update conversation timestamp
    await ctx.db.patch(message.conversationId, {
      updatedAt: Date.now(),
    });
  },
});

// Delete message for migration
export const deleteMessageForMigration = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.delete(args.messageId);

    // Update conversation timestamp
    await ctx.db.patch(message.conversationId, {
      updatedAt: Date.now(),
    });

    return message;
  },
});

// Create user message for chat (temporary migration version)
export const createUserMessageForMigration = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    mentions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: "user",
      content: args.content,
      mentions: args.mentions,
      createdAt: Date.now(),
    });

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Create advisor message for chat (temporary migration version)
export const createAdvisorMessageForMigration = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    content: v.string(),
    tokensUsed: v.optional(v.number()),
    contentJson: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: "advisor",
      advisorId: args.advisorId,
      content: args.content,
      tokensUsed: args.tokensUsed,
      contentJson: args.contentJson,
      mentions: [],
      createdAt: Date.now(),
    });

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Get message count for conversation (for title generation logic)
export const getMessageCountForMigration = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages.length;
  },
});

// Get conversation history for title generation (temporary migration version)
export const getConversationHistoryForMigration = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(limit);

    return messages.map(message => ({
      id: message._id,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
    }));
  },
});
