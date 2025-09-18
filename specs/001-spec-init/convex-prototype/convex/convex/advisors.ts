import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { requireUser } from "./_utils/auth";

/**
 * Upsert an advisor document by legacyId or create a new one.
 * Returns { action: 'created'|'updated', doc }
 */
export const upsertAdvisor = mutation({
  // Accept either { advisor } or the advisor object directly
  args: v.any(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const advisor = (args && typeof args === 'object' && 'advisor' in args) ? (args as any).advisor : args;

    // Try to find an existing advisor by legacyId if provided
    let existing: any = null;
    if (advisor?.legacyId != null) {
      existing = await ctx.db
        .query("advisors")
        .filter(q => q.eq(q.field("legacyId"), advisor.legacyId))
        .first();
    }

    if (existing) {
      // Patch existing advisor
      await ctx.db.patch(existing._id, {
        legacyId: (advisor.legacyId ?? advisor.advisorId ?? existing.legacyId ?? null),
        name: (advisor.name ?? advisor.persona?.name ?? existing.name ?? "Unnamed Advisor"),
        persona: advisor.persona ?? existing.persona ?? {},
        modelHint: advisor.modelHint ?? existing.modelHint ?? null,
        imageUrl: advisor.imageUrl ?? existing.imageUrl ?? null,
        sourceFile: advisor._sourceFile ?? existing.sourceFile ?? null,
        ownerId: advisor.ownerId ?? existing.ownerId ?? null,
        updatedAt: now,
      });
      const doc = await ctx.db.get(existing._id);
      return { action: "updated" as const, doc };
    }

    // Insert new advisor
    const _id = await ctx.db.insert("advisors", {
      legacyId: (advisor?.legacyId ?? advisor?.advisorId ?? null),
      ownerId: advisor?.ownerId ?? null,
      name: (advisor?.name ?? advisor?.persona?.name ?? "Unnamed Advisor"),
      persona: advisor?.persona ?? {},
      modelHint: advisor?.modelHint ?? null,
      imageUrl: advisor?.imageUrl ?? null,
      sourceFile: advisor?._sourceFile ?? null,
      createdAt: now,
      updatedAt: now,
    });
    const doc = await ctx.db.get(_id);
    return { action: "created" as const, doc };
  },
});

// List all advisors for verification
export const listAdvisors = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("advisors").collect();
    return docs.map((d: any) => ({
      _id: d._id,
      legacyId: d.legacyId ?? null,
      name: d.name ?? null,
      personaName: d?.persona?.name ?? null,
      createdAt: d.createdAt ?? null,
    }));
  },
});

export const listAdvisorsForUser = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    const docs = await ctx.db
      .query("advisors")
      .filter(q => q.eq(q.field("ownerId"), ownerId))
      .collect();
    return docs.map((d: any) => ({
      _id: d._id,
      legacyId: d.legacyId ?? null,
      name: d.name ?? null,
      personaName: d?.persona?.name ?? null,
      createdAt: d.createdAt ?? null,
    }));
  },
});


export const listMyAdvisors = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any);
    const docs = await ctx.db
      .query("advisors")
      .filter((q) => q.eq(q.field("ownerId"), user._id))
      .collect();
    return docs.map((d: any) => ({
      _id: d._id,
      legacyId: d.legacyId ?? null,
      name: d.name ?? null,
      personaName: d?.persona?.name ?? null,
      expertise: d?.persona?.expertise ?? null,
      description: d?.persona?.description ?? null,
      createdAt: d.createdAt ?? null,
    }));
  },
});

/**
 * Seed sample advisors for the authenticated user
 */
export const seedSampleAdvisors = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any);
    const now = Date.now();

    const sampleAdvisors = [
      {
        name: "Alex Chen",
        persona: {
          name: "Alex Chen",
          expertise: "Business Strategy",
          description: "Senior business strategist with 15+ years experience in scaling startups and enterprise transformation. Specializes in market analysis, competitive positioning, and growth strategy.",
        },
        imageUrl: null,
      },
      {
        name: "Dr. Sarah Kim",
        persona: {
          name: "Dr. Sarah Kim",
          expertise: "Technical Architecture",
          description: "Principal software architect and former CTO. Expert in system design, cloud infrastructure, and technical leadership. Helps teams build scalable, maintainable systems.",
        },
        imageUrl: null,
      },
      {
        name: "Marcus Rodriguez",
        persona: {
          name: "Marcus Rodriguez",
          expertise: "Marketing & Growth",
          description: "Growth marketing expert with proven track record in B2B and B2C. Specializes in digital marketing, customer acquisition, and brand positioning strategies.",
        },
        imageUrl: null,
      },
      {
        name: "Emma Thompson",
        persona: {
          name: "Emma Thompson",
          expertise: "Product Management",
          description: "Senior product manager with experience at top tech companies. Expert in product strategy, user research, and agile development methodologies.",
        },
        imageUrl: null,
      },
      {
        name: "David Park",
        persona: {
          name: "David Park",
          expertise: "Financial Planning",
          description: "Financial advisor and former investment banker. Specializes in startup funding, financial modeling, and investment strategy for growing businesses.",
        },
        imageUrl: null,
      },
    ];

    const results = [];
    for (const advisor of sampleAdvisors) {
      const _id = await ctx.db.insert("advisors", {
        legacyId: null,
        ownerId: user._id,
        name: advisor.name,
        persona: advisor.persona,
        modelHint: null,
        imageUrl: advisor.imageUrl,
        sourceFile: null,
        createdAt: now,
        updatedAt: now,
      });
      const doc = await ctx.db.get(_id);
      results.push(doc);
    }

    return { count: results.length, advisors: results };
  },
});

/**
 * Update an existing advisor (user must own it)
 */
export const updateAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
    name: v.optional(v.string()),
    expertise: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { advisorId, name, expertise, description, imageUrl }) => {
    const user = await requireUser(ctx as any);

    // Check if advisor exists and user owns it
    const advisor = await ctx.db.get(advisorId);
    if (!advisor) {
      throw new Error("Advisor not found");
    }
    if (advisor.ownerId !== user._id) {
      throw new Error("You can only update your own advisors");
    }

    const updates: any = { updatedAt: Date.now() };
    if (name !== undefined) updates.name = name;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    // Update persona fields
    if (expertise !== undefined || description !== undefined) {
      const currentPersona = advisor.persona || {};
      updates.persona = {
        ...currentPersona,
        name: name || currentPersona.name || advisor.name,
        ...(expertise !== undefined && { expertise }),
        ...(description !== undefined && { description }),
      };
    }

    await ctx.db.patch(advisorId, updates);
    return await ctx.db.get(advisorId);
  },
});

/**
 * Delete an advisor (user must own it)
 */
export const deleteAdvisor = mutation({
  args: { advisorId: v.id("advisors") },
  handler: async (ctx, { advisorId }) => {
    const user = await requireUser(ctx as any);

    // Check if advisor exists and user owns it
    const advisor = await ctx.db.get(advisorId);
    if (!advisor) {
      throw new Error("Advisor not found");
    }
    if (advisor.ownerId !== user._id) {
      throw new Error("You can only delete your own advisors");
    }

    await ctx.db.delete(advisorId);
    return { success: true };
  },
});

/**
 * Internal query to get advisor by ID (for actions)
 */
export const getAdvisorById = internalQuery({
  args: { advisorId: v.id("advisors") },
  handler: async (ctx, { advisorId }) => {
    const advisor = await ctx.db.get(advisorId);
    if (!advisor) return null;

    // Return full advisor data including persona
    return {
      _id: advisor._id,
      name: advisor.name,
      persona: advisor.persona,
      ownerId: advisor.ownerId,
      createdAt: advisor.createdAt,
    };
  },
});
