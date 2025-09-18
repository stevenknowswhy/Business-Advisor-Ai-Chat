import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_utils/auth";

/**
 * Create a conversation document.
 * The convexClient calls this as client.mutation('conversations:createConversation', [{ ownerId, title, advisorIds }])
 */
export const createConversation = mutation({
  args: {
    ownerId: v.optional(v.string()),
    title: v.optional(v.string()),
    advisorIds: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Enforce auth and set ownerId from the authenticated user
    const user = await requireUser(ctx as any);

    const _id = await ctx.db.insert("conversations", {
      ownerId: user?._id ?? null,
      title: args.title ?? "",
      advisorIds: args.advisorIds ?? [],
      createdAt: now,
      lastMessageAt: null,
      updatedAt: now,
    });

    return await ctx.db.get(_id);
  },
});



export const listConversationsForUser = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    const convs = await ctx.db
      .query("conversations")
      .filter(q => q.eq(q.field("ownerId"), ownerId))
      .collect();
    convs.sort((a: any, b: any) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return convs;
  },
});


export const listMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any);
    const convs = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("ownerId"), user._id))
      .collect();
    convs.sort((a: any, b: any) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0) || (b.createdAt ?? 0) - (a.createdAt ?? 0));

    // Enrich with advisor details
    const enrichedConvs = await Promise.all(
      convs.map(async (conv: any) => {
        const advisorDetails = await Promise.all(
          (conv.advisorIds || []).map(async (advisorId: any) => {
            const advisor = await ctx.db.get(advisorId);
            return advisor ? { _id: advisor._id, name: advisor.name } : null;
          })
        );
        return {
          ...conv,
          advisors: advisorDetails.filter(Boolean),
        };
      })
    );

    return enrichedConvs;
  },
});

/**
 * Add advisors to a conversation
 */
export const addAdvisorsToConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorIds: v.array(v.id("advisors")),
  },
  handler: async (ctx, { conversationId, advisorIds }) => {
    const user = await requireUser(ctx as any);

    // Check if conversation exists and user owns it
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    if (conversation.ownerId !== user._id) {
      throw new Error("You can only modify your own conversations");
    }

    // Verify all advisors exist and are owned by the user
    for (const advisorId of advisorIds) {
      const advisor = await ctx.db.get(advisorId);
      if (!advisor || advisor.ownerId !== user._id) {
        throw new Error("One or more advisors not found or not owned by you");
      }
    }

    // Add advisors (avoid duplicates)
    const currentAdvisorIds = conversation.advisorIds || [];
    const newAdvisorIds = [...new Set([...currentAdvisorIds, ...advisorIds])];

    await ctx.db.patch(conversationId, {
      advisorIds: newAdvisorIds,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(conversationId);
  },
});

/**
 * Remove advisors from a conversation
 */
export const removeAdvisorsFromConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    advisorIds: v.array(v.id("advisors")),
  },
  handler: async (ctx, { conversationId, advisorIds }) => {
    const user = await requireUser(ctx as any);

    // Check if conversation exists and user owns it
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    if (conversation.ownerId !== user._id) {
      throw new Error("You can only modify your own conversations");
    }

    // Remove advisors
    const currentAdvisorIds = conversation.advisorIds || [];
    const newAdvisorIds = currentAdvisorIds.filter((id: any) => !advisorIds.includes(id));

    await ctx.db.patch(conversationId, {
      advisorIds: newAdvisorIds,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(conversationId);
  },
});
