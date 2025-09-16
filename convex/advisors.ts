import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin } from "./middleware";

/**
 * Advisor Management Functions
 *
 * These functions handle advisor CRUD operations,
 * replacing the current /api/advisors endpoints.
 */

// Get all active advisors
export const getActiveAdvisors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("advisors")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Get all advisors (including inactive)
export const getAllAdvisors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("advisors").collect();
  },
});

// Get advisor by ID
export const getAdvisorById = query({
  args: { advisorId: v.id("advisors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.advisorId);
  },
});

// Get advisors by tags
export const getAdvisorsByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    const advisors = await ctx.db.query("advisors").collect();

    // Filter advisors that have any of the specified tags
    return advisors.filter(advisor =>
      advisor.tags.some(tag => args.tags.includes(tag))
    );
  },
});

// Create new advisor (for migration purposes)
export const create = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    schemaVersion: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("archived")),
    persona: v.object({
      name: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      personality: v.optional(v.array(v.string())),
      expertise: v.optional(v.array(v.string())),
    }),
    roleDefinition: v.optional(v.object({
      role: v.optional(v.string()),
      responsibilities: v.optional(v.array(v.string())),
      constraints: v.optional(v.array(v.string())),
    })),
    components: v.array(v.any()),
    metadata: v.optional(v.object({
      version: v.optional(v.string()),
      author: v.optional(v.string()),
      category: v.optional(v.string()),
    })),
    localization: v.optional(v.object({
      language: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    modelHint: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const advisorId = await ctx.db.insert("advisors", {
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      schemaVersion: args.schemaVersion,
      status: args.status,
      persona: args.persona,
      roleDefinition: args.roleDefinition,
      components: args.components,
      metadata: args.metadata,
      localization: args.localization,
      modelHint: args.modelHint,
      tags: args.tags,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    return advisorId;
  },
});

// Create new advisor
export const createAdvisor = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Accept full persona structure
    persona: v.any(),
    // Accept expanded optional objects
    roleDefinition: v.optional(v.any()),
    components: v.optional(v.array(v.any())),
    metadata: v.optional(v.any()),
    localization: v.optional(v.any()),
    modelHint: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    schemaVersion: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const resolvedImage = (args.persona as any)?.image || args.imageUrl;
    const resolvedTags = args.tags || (args.metadata?.tags as string[] | undefined) || [];
    const advisorId = await ctx.db.insert("advisors", {
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: resolvedImage,
      schemaVersion: args.schemaVersion || "1.1-base",
      status: args.status || "active",
      persona: args.persona as any,
      roleDefinition: args.roleDefinition as any,
      components: args.components || [],
      metadata: args.metadata as any,
      localization: args.localization as any,
      modelHint: args.modelHint,
      tags: resolvedTags,
      createdAt: now,
      updatedAt: now,
    });

    return advisorId;
  },
});

// Update advisor
export const updateAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"))),
    persona: v.optional(v.object({
      name: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      personality: v.optional(v.array(v.string())),
      expertise: v.optional(v.array(v.string())),
    })),
    roleDefinition: v.optional(v.object({
      role: v.optional(v.string()),
      responsibilities: v.optional(v.array(v.string())),
      constraints: v.optional(v.array(v.string())),
    })),
    components: v.optional(v.array(v.any())),
    metadata: v.optional(v.object({
      version: v.optional(v.string()),
      author: v.optional(v.string()),
      category: v.optional(v.string()),
    })),
    localization: v.optional(v.object({
      language: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    modelHint: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { advisorId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(advisorId, {
        ...filteredUpdates,
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete advisor (soft delete by setting status to archived)
export const archiveAdvisor = mutation({
  args: { advisorId: v.id("advisors") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.advisorId, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

// Hard delete advisor (use with caution)
export const deleteAdvisor = mutation({
  args: { advisorId: v.id("advisors") },
  handler: async (ctx, args) => {
    // Note: In a real app, you'd want to handle cascading deletes
    // or prevent deletion if advisor has conversations/messages
    await ctx.db.delete(args.advisorId);
  },
});

// List all advisors (for migration compatibility)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("advisors").collect();
  },
});

// Alias for getActiveAdvisors (for frontend compatibility)
export const getAdvisors = getActiveAdvisors;

// Admin-only one-off migration to backfill missing persona fields
export const backfillAdvisorPersonas = mutation({

  args: { secret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Allow one-time execution with secret or require admin
    const secretOk = args.secret && process.env.MIGRATION_SECRET && args.secret === process.env.MIGRATION_SECRET;
    if (!secretOk) {
      await requireAdmin(ctx);
    }

    const advisors = await ctx.db.query("advisors").collect();
    let processed = 0;
    let updated = 0;

    for (const adv of advisors) {
      processed++;
      const missingPersona = !adv.persona || typeof adv.persona !== "object";

      if (missingPersona) {
        const name = [adv.firstName, adv.lastName].filter(Boolean).join(" ") || "Advisor";
        const persona = {
          name,
          title: "Advisor",
          description: "",
          expertise: [],
          personality: [],
        };
        await ctx.db.patch(adv._id, { persona, updatedAt: Date.now() });
        updated++;
      }
    }

    console.log("backfillAdvisorPersonas: processed=", processed, "updated=", updated);
    return { processed, updated, skipped: processed - updated };
  },
});



// Admin-only one-off migration to backfill advisor photos
const PHOTO_MAP: Record<string, string> = {
  "Alex Reyes": "https://x6amvsxo6a.ufs.sh/f/CJkdgQbqr1ZpUPjRznklTQNBKhrVXcE0pWCyDLg1xavPo2q7",
  "Amara Johnson": "https://x6amvsxo6a.ufs.sh/f/CJkdgQbqr1ZpL9xkWD0E90rIWDgiFjOVklet5MbYsQKUvq1m",
};

export const backfillAdvisorPhotos = mutation({
  args: { secret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const secretOk = args.secret && process.env.MIGRATION_SECRET && args.secret === process.env.MIGRATION_SECRET;
    if (!secretOk) {
      await requireAdmin(ctx);
    }

    const advisors = await ctx.db.query("advisors").collect();
    let processed = 0;
    let updated = 0;

    for (const adv of advisors) {
      processed++;
      // If already has an imageUrl, skip
      if (adv.imageUrl && adv.imageUrl.length > 0) continue;

      const name = (adv.persona as any)?.name || [adv.firstName, adv.lastName].filter(Boolean).join(" ").trim();
      const seeded = name ? PHOTO_MAP[name] : undefined;
      const personaImage = (adv.persona as any)?.image as string | undefined;
      const imageUrl = personaImage || seeded;

      if (imageUrl) {
        await ctx.db.patch(adv._id, { imageUrl, updatedAt: Date.now() });
        updated++;
      }
    }

    console.log("backfillAdvisorPhotos:", { processed, updated, skipped: processed - updated });
    return { processed, updated, skipped: processed - updated };
  },
});


// Create or update advisor from full JSON structure
export const createAdvisorFromJSON = mutation({
  args: { advisor: v.any() },
  handler: async (ctx, { advisor }) => {
    const a = advisor as any;
    const persona = a.persona || {};
    const name: string | undefined = persona.name;
    const [firstName, ...rest] = (name || "").split(" ");
    const lastName = rest.join(" ") || undefined;

    // Try to find existing by persona.name
    const all = await ctx.db.query("advisors").collect();
    const existing = all.find(doc => (doc.persona as any)?.name === name);

    const now = Date.now();
    const doc = {
      firstName: firstName || undefined,
      lastName,
      imageUrl: persona.image as string | undefined,
      schemaVersion: (a.advisorSchemaVersion as string | undefined) || "1.1-base",
      status: (a.status as any) || "active",
      persona: persona,
      roleDefinition: a.roleDefinition || undefined,
      components: a.components || [],
      metadata: a.metadata || undefined,
      localization: a.localization || undefined,
      modelHint: a.modelHint || undefined,
      tags: (a.metadata?.tags as string[] | undefined) || a.tags || [],
      createdAt: now,
      updatedAt: now,
    } as const;

    if (existing) {
      await ctx.db.patch(existing._id, { ...doc, createdAt: existing.createdAt, updatedAt: now });
      return existing._id;
    } else {
      return await ctx.db.insert("advisors", doc as any);
    }
  },
});

// Backfill existing advisors with fields from provided JSONs (idempotent)
export const backfillAdvisorPersonaFieldsFromJSON = mutation({
  args: { advisors: v.array(v.any()), secret: v.optional(v.string()) },
  handler: async (ctx, { advisors, secret }) => {
    const secretOk = secret && process.env.MIGRATION_SECRET && secret === process.env.MIGRATION_SECRET;
    if (!secretOk) {
      await requireAdmin(ctx);
    }

    const all = await ctx.db.query("advisors").collect();
    let processed = 0, updated = 0;

    function mergeMissing(target: any, src: any) {
      const out = { ...target };
      for (const [k, v] of Object.entries(src || {})) {
        if (v === undefined || v === null) continue;
        if (out[k as keyof typeof out] === undefined) {
          out[k as keyof typeof out] = v as any;
        } else if (typeof v === "object" && !Array.isArray(v) && typeof out[k as any] === "object") {
          out[k as any] = mergeMissing(out[k as any], v);
        }
      }
      return out;
    }

    for (const a of advisors as any[]) {
      processed++;
      const name = a?.persona?.name as string | undefined;
      if (!name) continue;
      const existing = all.find(doc => (doc.persona as any)?.name === name);
      if (!existing) continue;

      const newPersona = mergeMissing(existing.persona, a.persona);
      const imageUrl = existing.imageUrl || a.persona?.image || undefined;

      await ctx.db.patch(existing._id, {
        persona: newPersona,
        imageUrl,
        updatedAt: Date.now(),
      });
      updated++;
    }

    return { processed, updated, skipped: processed - updated };
  },
});


// Public action: upload a single advisor JSON (string or object) and create/upsert
export const uploadAdvisorJSON = action({
  args: { jsonString: v.optional(v.string()), advisor: v.optional(v.any()) },
  handler: async (ctx, args): Promise<{ ok: boolean; advisorId?: string; error?: string }> => {
    try {
      let advisor: any | undefined = args.advisor;
      if (!advisor && args.jsonString) {
        advisor = JSON.parse(args.jsonString);
      }
      if (!advisor || typeof advisor !== "object") {
        return { ok: false, error: "Missing or invalid advisor JSON." } as const;
      }
      // Minimal validation
      const persona = advisor.persona;
      if (!persona || typeof persona.name !== "string" || typeof persona.title !== "string") {
        return { ok: false, error: "Invalid advisor persona. 'name' and 'title' are required." } as const;
      }

      return { ok: true, advisorId: await ctx.runMutation(api.advisors.createAdvisorFromJSON, { advisor }) } as const;
    } catch (e: any) {
      return { ok: false, error: e?.message || "Unknown error" } as const;
    }
  },
});

// Public action: enrich (backfill) existing advisors from provided JSONs (strings or objects)
export const enrichAdvisorsFromJSON = action({
  args: { jsonStrings: v.optional(v.array(v.string())), advisors: v.optional(v.array(v.any())), secret: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ ok: boolean; result?: any; error?: string }> => {
    try {
      let advisors: any[] = args.advisors || [];
      if ((!advisors || advisors.length === 0) && args.jsonStrings && args.jsonStrings.length > 0) {
        advisors = args.jsonStrings.map((s) => JSON.parse(s));
      }
      if (!advisors || advisors.length === 0) {
        return { ok: false, error: "No advisors provided." } as const;
      }

      return { ok: true, result: await ctx.runMutation(api.advisors.backfillAdvisorPersonaFieldsFromJSON, { advisors, secret: args.secret }) } as const;
    } catch (e: any) {
      return { ok: false, error: e?.message || "Unknown error" } as const;
    }
  },
});
