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

// Temporary non-authenticated function for migration testing
export const getAllConversationsForMigration = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db
      .query("conversations")
      .order("desc")
      .take(50);

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
  },
});

// Temporary non-authenticated create function for migration testing
export const createConversationForMigration = mutation({
  args: {
    title: v.optional(v.string()),
    activeAdvisorId: v.optional(v.id("advisors")),
    userId: v.optional(v.id("users")), // For migration, we'll pass a dummy user ID
  },
  handler: async (ctx, args) => {
    // If no advisor specified, get the first active advisor
    let advisorId = args.activeAdvisorId;
    if (!advisorId) {
      const defaultAdvisor = await ctx.db
        .query("advisors")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .first();
      advisorId = defaultAdvisor?._id;
    }

    // For migration testing, use a dummy user ID if none provided
    let userId = args.userId;
    if (!userId) {
      // Create or get a test user
      const testUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), "test@migration.com"))
        .first();

      if (testUser) {
        userId = testUser._id;
      } else {
        // Create a test user for migration
        userId = await ctx.db.insert("users", {
          clerkId: "test_migration_user",
          email: "test@migration.com",
          name: "Migration Test User",
          plan: "free",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    const conversationId = await ctx.db.insert("conversations", {
      userId,
      title: args.title || "New Conversation",
      activeAdvisorId: advisorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

// Temporary non-authenticated get conversation by ID for migration testing
export const getConversationByIdForMigration = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      return null;
    }

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
    if (conversation.activeAdvisorId) {
      activeAdvisor = await ctx.db.get(conversation.activeAdvisorId);
    }

    return {
      ...conversation,
      messages: messagesWithAdvisors,
      activeAdvisor: activeAdvisor ? {
        _id: activeAdvisor._id,
        name: activeAdvisor.persona.name,
        title: activeAdvisor.persona.title,
        imageUrl: activeAdvisor.imageUrl,
        persona: activeAdvisor.persona,
      } : null,
    };
  },
});

// Temporary non-authenticated update function for migration testing
export const updateConversationForMigration = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    activeAdvisorId: v.optional(v.id("advisors")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.activeAdvisorId !== undefined) updates.activeAdvisorId = args.activeAdvisorId;

    await ctx.db.patch(args.conversationId, updates);
  },
});

// Temporary non-authenticated delete function for migration testing
export const deleteConversationForMigration = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

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
  },
});

// Alias for getUserConversations (for frontend compatibility)
export const getConversations = getUserConversations;

// Temporary non-authenticated functions for chat migration

// Get conversation with messages for chat (temporary migration version)
export const getConversationWithMessagesForMigration = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    messageLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      return null;
    }

    // Get the user record to verify ownership
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!userRecord) {
      return null;
    }

    // Verify user ownership
    if (conversation.userId !== userRecord._id) {
      return null;
    }

    const messageLimit = args.messageLimit || 50;

    // Get messages for the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(messageLimit);

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
            persona: advisor.persona,
          } : null,
        };
      })
    );

    return {
      ...conversation,
      messages: messagesWithAdvisors,
    };
  },
});

// Create conversation for chat (temporary migration version)
export const createConversationForChat = mutation({
  args: {
    userId: v.string(),
    activeAdvisorId: v.id("advisors"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // First, ensure the user exists in the users table
    let userRecord = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!userRecord) {
      // Create a temporary user record for migration
      const userId = await ctx.db.insert("users", {
        clerkId: args.userId,
        email: "migration@example.com",
        name: "Migration User",
        plan: "free",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Get the full user record after creation
      userRecord = await ctx.db.get(userId);
    }

    if (!userRecord) {
      throw new Error("Failed to create or retrieve user record");
    }

    const conversationId = await ctx.db.insert("conversations", {
      userId: userRecord._id,
      activeAdvisorId: args.activeAdvisorId,
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Return the conversation with empty messages array for consistency
    return {
      _id: conversationId,
      userId: args.userId, // Return the original string for compatibility
      activeAdvisorId: args.activeAdvisorId,
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
  },
});

// Update conversation active advisor (temporary migration version)
export const updateConversationActiveAdvisorForMigration = mutation({
  args: {
    conversationId: v.id("conversations"),
    activeAdvisorId: v.id("advisors"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      activeAdvisorId: args.activeAdvisorId,
      updatedAt: Date.now(),
    });
  },
});

// Update conversation title (temporary migration version)
export const updateConversationTitleForMigration = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});
