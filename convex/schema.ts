import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Convex schema for Advisor Marketplace
// Indexes are added for performance and to support code-enforced uniqueness where noted

export default defineSchema({
  advisors: defineTable({
    ownerId: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    oneLiner: v.string(),
    avatarUrl: v.optional(v.string()),
    handle: v.string(),
    tags: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),
    expertise: v.optional(v.array(v.string())),
    traits: v.optional(v.array(v.string())),
    mission: v.string(),
    scopeIn: v.optional(v.array(v.string())),
    scopeOut: v.optional(v.array(v.string())),
    kpis: v.optional(v.array(v.string())),
    adviceStyle: v.optional(
      v.object({
        voice: v.string(),
        tone: v.optional(v.string()),
      })
    ),
    metadata: v.optional(
      v.object({
        templateId: v.optional(v.string()),
        templateVersion: v.optional(v.string()),
        source: v.optional(v.string()),
      })
    ),
    // Marketplace fields (for advisors.by_public)
    isPublic: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),

    createdAt: v.number(),
  })
    // Unique constraint is enforced at application level (Convex does not enforce uniqueness)
    .index("by_owner_handle", ["ownerId", "handle"]) // advisors.by_owner_handle
    .index("by_public", ["isPublic", "featured", "category"]), // advisors.by_public

  userAdvisors: defineTable({
    userId: v.string(),
    advisorId: v.id("advisors"),
    source: v.optional(v.string()),
    teamKey: v.optional(v.string()),
    createdAt: v.number(),
  })
    // Intended to be unique (userId + advisorId); enforce via code-paths
    .index("by_user_advisor", ["userId", "advisorId"]),

  idempotencyKeys: defineTable({
    key: v.string(),
    result: v.any(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_key", ["key"]),

  rateLimits: defineTable({
    userId: v.string(),
    action: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_user_action", ["userId", "action"]),
});

