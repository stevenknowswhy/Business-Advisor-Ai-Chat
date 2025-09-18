import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    legacyId: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.union(v.string(), v.null())),
    name: v.optional(v.union(v.string(), v.null())),
    image: v.optional(v.union(v.string(), v.null())),
    plan: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"]) // expected unique
    .index("by_legacyId", ["legacyId"]), // expected unique

  advisors: defineTable({
    legacyId: v.optional(v.union(v.string(), v.null())),
    ownerId: v.optional(v.union(v.id("users"), v.null())),
    name: v.optional(v.union(v.string(), v.null())),
    firstName: v.optional(v.union(v.string(), v.null())),
    lastName: v.optional(v.union(v.string(), v.null())),
    persona: v.any(),
    localization: v.optional(v.any()),
    metadata: v.optional(v.any()),
    roleDefinition: v.optional(v.any()),
    components: v.optional(v.array(v.any())),
    schemaVersion: v.optional(v.union(v.string(), v.null())),
    status: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string())),
    modelHint: v.optional(v.union(v.string(), v.null())),
    imageUrl: v.optional(v.union(v.string(), v.null())),
    sourceFile: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_legacyId", ["legacyId"]) // for upserts
    .index("by_ownerId", ["ownerId"]) 
    .index("by_name", ["name"]),

  conversations: defineTable({
    ownerId: v.optional(v.union(v.id("users"), v.null())),
    userId: v.optional(v.any()),
    title: v.optional(v.union(v.string(), v.null())),
    advisorIds: v.optional(v.array(v.id("advisors"))),
    activeAdvisorId: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastMessageAt: v.optional(v.union(v.number(), v.null())),
  })
    .index("by_ownerId", ["ownerId"]) 
    .index("by_owner_lastMessage", ["ownerId", "lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.optional(v.union(v.string(), v.null())), // could be user/advisor id string
    advisorId: v.optional(v.any()),
    sender: v.optional(v.union(v.string(), v.null())),
    role: v.optional(v.union(v.string(), v.null())),
    mentions: v.optional(v.array(v.string())),
    content: v.string(),
    contentJson: v.optional(v.any()),
    tokensUsed: v.optional(v.number()),
    partial: v.optional(v.union(v.boolean(), v.null())),
    createdAt: v.number(),
  })
    .index("by_conversation_createdAt", ["conversationId", "createdAt"]),

  advisorMemories: defineTable({
    advisorId: v.id("advisors"),
    userId: v.id("users"),
    source: v.string(), // conversation|manual
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_advisorId", ["advisorId"]) 
    .index("by_userId", ["userId"]),

  threadSummaries: defineTable({
    conversationId: v.id("conversations"),
    summary: v.string(),
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"]),
});

