import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUser } from "./_utils/auth";
import { api } from "./_generated/api";

/**
 * Append a message to a conversation.
 * The convexClient calls this as client.mutation('messages:appendMessage', [{ conversationId, senderId, role, content, partial }])
 */
export const appendMessage = mutation({
  args: {
    conversationId: v.any(),
    senderId: v.optional(v.string()),
    role: v.optional(v.string()),
    content: v.string(),
    partial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Enforce that the caller owns the conversation
    const user = await requireUser(ctx as any);
    const conv = await ctx.db.get(args.conversationId as any);
    if (!conv) throw new Error("Conversation not found");
    if (conv.ownerId && conv.ownerId !== (user as any)._id) {
      throw new Error("Forbidden");
    }

    const _id = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId ?? null,
      role: (args.role as any) ?? "user",
      content: args.content,
      partial: args.partial ?? false,
      createdAt: now,
    });

    // Update conversation's lastMessageAt (best effort)
    try {
      await ctx.db.patch(args.conversationId as any, { lastMessageAt: now, updatedAt: now });
    } catch (_) {}

    const message = await ctx.db.get(_id);

    // Trigger advisor responses for user messages
    if (args.role === "user" || !args.role) {
      // Get conversation to find assigned advisors
      const conversation = await ctx.db.get(args.conversationId as any);
      if (conversation && conversation.advisorIds && conversation.advisorIds.length > 0) {
        // Get recent conversation history
        const recentMessages = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
          .collect();

        recentMessages.sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

        // Format conversation history
        const conversationHistory = await Promise.all(
          recentMessages.slice(-10).map(async (msg: any) => {
            let senderName = "User";
            if (msg.role === "advisor" && msg.senderId) {
              const advisor = await ctx.db.get(msg.senderId);
              senderName = advisor?.name || "AI Advisor";
            }
            return {
              role: msg.role || "user",
              content: msg.content,
              senderName,
            };
          })
        );

        // Randomly select 1-2 advisors to respond (to avoid overwhelming the user)
        const shuffledAdvisors = [...conversation.advisorIds].sort(() => Math.random() - 0.5);
        const respondingAdvisors = shuffledAdvisors.slice(0, Math.random() > 0.5 ? 2 : 1);

        // Schedule advisor responses (with slight delays to feel more natural)
        for (let i = 0; i < respondingAdvisors.length; i++) {
          const advisorId = respondingAdvisors[i];

          try {
            await ctx.scheduler.runAfter(
              (i + 1) * 2000, // 2-4 second delays between responses
              api.aiResponses.generateAdvisorResponse,
              {
                conversationId: args.conversationId as any,
                advisorId,
                userMessage: args.content,
                conversationHistory,
              }
            );
          } catch (error) {
            console.error("Error scheduling advisor response:", error);
          }
        }
      }
    }

    return message;
  },
});

/**
 * List messages for a conversation.
 * The convexClient may call this with [conversationId] (scalar) or [{ conversationId }].
 * We accept either by normalizing the input.
 */
export const listMessagesForConversation = query({
  args: v.any(),
  handler: async (ctx, args) => {
    const conversationId =
      args && typeof args === "object" && "conversationId" in args
        ? (args as any).conversationId
        : args;

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .collect();
    messages.sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return messages;
  },
});

export const listMyMessagesForConversation = query({
  args: v.object({ conversationId: v.any() }),
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx as any);
    const conv = await ctx.db.get(conversationId as any);
    if (!conv) throw new Error("Conversation not found");
    if (conv.ownerId && conv.ownerId !== (user as any)._id) {
      throw new Error("Forbidden");
    }
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .collect();
    messages.sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    // Enrich messages with sender details
    const enrichedMessages = await Promise.all(
      messages.map(async (message: any) => {
        let senderName = "User";
        let senderType = "user";

        if (message.role === "advisor" && message.senderId) {
          const advisor = await ctx.db.get(message.senderId);
          if (advisor) {
            senderName = advisor.name || "AI Advisor";
            senderType = "advisor";
          }
        } else if (message.role === "user") {
          senderName = user.name || "You";
          senderType = "user";
        }

        return {
          ...message,
          senderName,
          senderType,
        };
      })
    );

    return enrichedMessages;
  },
});

/**
 * Send an advisor response to a conversation
 */
export const sendAdvisorResponse = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, advisorId, content }) => {
    const user = await requireUser(ctx as any);
    const now = Date.now();

    // Verify conversation ownership
    const conv = await ctx.db.get(conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.ownerId !== user._id) {
      throw new Error("You can only send messages to your own conversations");
    }

    // Verify advisor ownership and is assigned to conversation
    const advisor = await ctx.db.get(advisorId);
    if (!advisor || advisor.ownerId !== user._id) {
      throw new Error("Advisor not found or not owned by you");
    }

    const advisorIds = conv.advisorIds || [];
    if (!advisorIds.includes(advisorId)) {
      throw new Error("Advisor is not assigned to this conversation");
    }

    // Create advisor message
    const _id = await ctx.db.insert("messages", {
      conversationId,
      senderId: advisorId,
      role: "advisor",
      content,
      partial: false,
      createdAt: now,
    });

    // Update conversation's lastMessageAt
    await ctx.db.patch(conversationId, { lastMessageAt: now, updatedAt: now });

    return await ctx.db.get(_id);
  },
});

/**
 * Internal mutation to create advisor messages (called by actions)
 */
export const createAdvisorMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    advisorId: v.id("advisors"),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, advisorId, content }) => {
    const now = Date.now();

    const _id = await ctx.db.insert("messages", {
      conversationId,
      senderId: advisorId,
      role: "advisor",
      content,
      partial: false,
      createdAt: now,
    });

    // Update conversation's lastMessageAt
    await ctx.db.patch(conversationId, { lastMessageAt: now, updatedAt: now });

    return await ctx.db.get(_id);
  },
});

/**
 * Manually trigger advisor responses (for testing or manual invocation)
 */
export const triggerAdvisorResponses = mutation({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
  },
  handler: async (ctx, { conversationId, userMessage }) => {
    const user = await requireUser(ctx as any);

    // Verify conversation ownership
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found or not owned by user");
    }

    if (!conversation.advisorIds || conversation.advisorIds.length === 0) {
      return { message: "No advisors assigned to this conversation" };
    }

    // Get recent conversation history
    const recentMessages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .collect();

    recentMessages.sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    // Format conversation history
    const conversationHistory = await Promise.all(
      recentMessages.slice(-10).map(async (msg: any) => {
        let senderName = "User";
        if (msg.role === "advisor" && msg.senderId) {
          const advisor = await ctx.db.get(msg.senderId);
          senderName = advisor?.name || "AI Advisor";
        }
        return {
          role: msg.role || "user",
          content: msg.content,
          senderName,
        };
      })
    );

    // Trigger responses from all assigned advisors
    const responsePromises = conversation.advisorIds.map(async (advisorId: any, index: number) => {
      try {
        await ctx.scheduler.runAfter(
          (index + 1) * 1500, // Stagger responses by 1.5 seconds
          api.aiResponses.generateAdvisorResponse,
          {
            conversationId,
            advisorId,
            userMessage,
            conversationHistory,
          }
        );
        return { advisorId, status: "scheduled" };
      } catch (error) {
        console.error(`Error scheduling response for advisor ${advisorId}:`, error);
        return { advisorId, status: "error", error: error.message };
      }
    });

    const results = await Promise.all(responsePromises);
    return {
      message: `Scheduled responses from ${results.filter(r => r.status === "scheduled").length} advisors`,
      results
    };
  },
});

