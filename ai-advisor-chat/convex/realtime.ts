import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireUser } from "./auth";
import { authenticatedQuery, authenticatedMutation, validateConversationOwnership } from "./middleware";

/**
 * Real-time Features
 *
 * These functions handle typing indicators, user presence,
 * and other real-time chat features.
 */

// ===== TYPING INDICATORS =====

// Set typing status for a user in a conversation
export const setTypingStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    // Check if typing indicator already exists
    const existingIndicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingIndicator) {
      // Update existing indicator
      await ctx.db.patch(existingIndicator._id, {
        isTyping: args.isTyping,
        lastTypingAt: Date.now(),
      });
    } else {
      // Create new indicator
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: user._id,
        isTyping: args.isTyping,
        lastTypingAt: Date.now(),
      });
    }

    // Clean up old typing indicators (older than 10 seconds)
    const cutoffTime = Date.now() - 10000; // 10 seconds ago
    const oldIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.lt(q.field("lastTypingAt"), cutoffTime))
      .collect();

    for (const indicator of oldIndicators) {
      await ctx.db.delete(indicator._id);
    }
  }),
});

// Get typing users for a conversation
export const getTypingUsers = query({
  args: { conversationId: v.id("conversations") },
  handler: authenticatedQuery(async (ctx, args: any, user) => {
    // Validate user owns the conversation
    await validateConversationOwnership(ctx, args.conversationId, user);
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_typing", (q) => 
        q.eq("conversationId", args.conversationId).eq("isTyping", true)
      )
      .collect();

    // Filter out stale indicators (older than 10 seconds)
    const cutoffTime = Date.now() - 10000;
    const activeIndicators = typingIndicators.filter(
      indicator => indicator.lastTypingAt > cutoffTime
    );

    // Get user details for active typing indicators
    const typingUsers = await Promise.all(
      activeIndicators.map(async (indicator) => {
        const user = await ctx.db.get(indicator.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          image: user.image,
          lastTypingAt: indicator.lastTypingAt,
        } : null;
      })
    );

    return typingUsers.filter(user => user !== null);
  }),
});

// ===== USER PRESENCE =====

// Update user presence (online/offline)
export const updateUserPresence = mutation({
  args: {
    isOnline: v.boolean(),
    currentConversationId: v.optional(v.id("conversations")),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // If conversation is specified, validate ownership
    if (args.currentConversationId) {
      await validateConversationOwnership(ctx, args.currentConversationId, user);
    }
    // Check if presence record already exists
    const existingPresence = await ctx.db
      .query("userPresence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingPresence) {
      // Update existing presence
      await ctx.db.patch(existingPresence._id, {
        isOnline: args.isOnline,
        lastSeenAt: Date.now(),
        currentConversationId: args.currentConversationId,
      });
    } else {
      // Create new presence record
      await ctx.db.insert("userPresence", {
        userId: user._id,
        isOnline: args.isOnline,
        lastSeenAt: Date.now(),
        currentConversationId: args.currentConversationId,
      });
    }
  }),
});

// Get user presence by user ID
export const getUserPresence = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPresence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get online users
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const onlinePresences = await ctx.db
      .query("userPresence")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .collect();

    // Filter out stale presence records (older than 5 minutes)
    const cutoffTime = Date.now() - 300000; // 5 minutes ago
    const activePresences = onlinePresences.filter(
      presence => presence.lastSeenAt > cutoffTime
    );

    // Get user details for active presences
    const onlineUsers = await Promise.all(
      activePresences.map(async (presence) => {
        const user = await ctx.db.get(presence.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          image: user.image,
          lastSeenAt: presence.lastSeenAt,
          currentConversationId: presence.currentConversationId,
        } : null;
      })
    );

    return onlineUsers.filter(user => user !== null);
  },
});

// Get users in a specific conversation
export const getUsersInConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const presences = await ctx.db
      .query("userPresence")
      .withIndex("by_conversation", (q) => q.eq("currentConversationId", args.conversationId))
      .collect();

    // Get user details
    const users = await Promise.all(
      presences.map(async (presence) => {
        const user = await ctx.db.get(presence.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          image: user.image,
          isOnline: presence.isOnline,
          lastSeenAt: presence.lastSeenAt,
        } : null;
      })
    );

    return users.filter(user => user !== null);
  },
});

// ===== CLEANUP FUNCTIONS =====

// Clean up stale typing indicators and presence records
export const cleanupStaleRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Clean up typing indicators older than 10 seconds
    const staleTypingIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.lt(q.field("lastTypingAt"), now - 10000))
      .collect();

    for (const indicator of staleTypingIndicators) {
      await ctx.db.delete(indicator._id);
    }

    // Mark users as offline if they haven't been seen in 5 minutes
    const stalePresences = await ctx.db
      .query("userPresence")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .filter((q) => q.lt(q.field("lastSeenAt"), now - 300000))
      .collect();

    for (const presence of stalePresences) {
      await ctx.db.patch(presence._id, {
        isOnline: false,
        currentConversationId: undefined,
      });
    }

    return {
      cleanedTypingIndicators: staleTypingIndicators.length,
      cleanedPresences: stalePresences.length,
    };
  },
});

// ===== ACTIVITY TRACKING =====

// Track user activity (for analytics)
export const trackUserActivity = mutation({
  args: {
    activity: v.string(), // "message_sent", "conversation_created", etc.
    conversationId: v.optional(v.id("conversations")),
    metadata: v.optional(v.any()),
  },
  handler: authenticatedMutation(async (ctx, args: any, user) => {
    // Validate conversation ownership if specified
    if (args.conversationId) {
      await validateConversationOwnership(ctx, args.conversationId, user);
    }

    // Update user presence to show they're active
    await ctx.runMutation(api.realtime.updateUserPresence, {
      isOnline: true,
      currentConversationId: args.conversationId,
    });

    // In a real app, you might want to store activity logs
    // For now, we'll just update the presence
  }),
});
