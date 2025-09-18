import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * AI Advisor Chat - Convex Schema
 * 
 * This schema maps the existing Prisma PostgreSQL models to Convex tables:
 * - User → users
 * - Advisor → advisors  
 * - Conversation → conversations
 * - Message → messages
 * - AdvisorMemory → advisorMemories
 * - ThreadSummary → threadSummaries
 */

export default defineSchema({
  // Users table - Maps to Prisma User model
  users: defineTable({
    // Clerk user ID as primary identifier
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    plan: v.string(), // "free", "pro", "enterprise"
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_plan", ["plan"]),

  // Advisors table - Maps to Prisma Advisor model
  advisors: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    schemaVersion: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("archived")),
    // JSON fields from Prisma/seed - stored as objects in Convex
    persona: v.object({
      name: v.string(),
      title: v.string(),
      // Common
      image: v.optional(v.string()),
      description: v.optional(v.string()),
      oneLiner: v.optional(v.string()),
      archetype: v.optional(v.string()),
      temperament: v.optional(v.string()),
      bio: v.optional(v.string()),
      detailedBackground: v.optional(v.string()),
      experience: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      personalInterests: v.optional(v.array(v.string())),
      communicationStyle: v.optional(v.string()),
      personality: v.optional(v.array(v.string())),
      expertise: v.optional(v.array(v.string())),
      coreBeliefsOrPrinciples: v.optional(v.array(v.string())),
      // Education
      education: v.optional(v.object({
        degreeLevel: v.optional(v.string()),
        degreeName: v.optional(v.string()),
        major: v.optional(v.string()),
        institution: v.optional(v.string()),
        graduationYear: v.optional(v.number()),
      })),
      // Location
      location: v.optional(v.object({
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
        countryCode: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })),
      // Advice delivery
      adviceDelivery: v.optional(v.object({
        mode: v.optional(v.string()),
        formality: v.optional(v.string()),
        useEmojis: v.optional(v.boolean()),
        voiceGuidelines: v.optional(v.array(v.string())),
        signOff: v.optional(v.string()),
      })),
      maritalStatus: v.optional(v.string()),
    }),
    roleDefinition: v.optional(v.object({
      role: v.optional(v.string()),
      responsibilities: v.optional(v.array(v.string())),
      constraints: v.optional(v.array(v.string())),
      mission: v.optional(v.string()),
      scope: v.optional(v.object({
        inScope: v.optional(v.array(v.string())),
        outOfScope: v.optional(v.array(v.string())),
      })),
      keyPerformanceIndicators: v.optional(v.array(v.object({
        metric: v.string(),
        description: v.optional(v.string()),
        unit: v.optional(v.string()),
      }))),
    })),
    components: v.optional(v.array(v.any())), // Flexible array for advisor components
    metadata: v.optional(v.object({
      version: v.optional(v.string()),
      author: v.optional(v.string()),
      category: v.optional(v.string()),
      createdAt: v.optional(v.string()),
      updatedAt: v.optional(v.string()),
      owner: v.optional(v.object({
        org: v.optional(v.string()),
        contactEmail: v.optional(v.string()),
      })),
      tags: v.optional(v.array(v.string())),
    })),
    localization: v.optional(v.object({
      language: v.optional(v.string()),
      region: v.optional(v.string()),
      defaultLanguage: v.optional(v.string()),
      supportedLanguages: v.optional(v.array(v.string())),
    })),
    modelHint: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_tags", ["tags"])
    .index("by_created_at", ["createdAt"])
    .index("by_schema_version", ["schemaVersion"])
    .index("by_persona_name", ["persona.name"]),

  // Conversations table - Maps to Prisma Conversation model
  conversations: defineTable({
    userId: v.id("users"), // Reference to users table
    title: v.optional(v.string()),
    activeAdvisorId: v.optional(v.id("advisors")), // Reference to advisors table
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_advisor", ["activeAdvisorId"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // Messages table - Maps to Prisma Message model
  messages: defineTable({
    conversationId: v.id("conversations"), // Reference to conversations table
    sender: v.union(v.literal("user"), v.literal("advisor"), v.literal("system")),
    advisorId: v.optional(v.id("advisors")), // Reference to advisors table
    content: v.string(),
    contentJson: v.optional(v.any()), // Flexible JSON content
    mentions: v.array(v.string()), // Array of mentioned user/advisor IDs
    tokensUsed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId", "createdAt"])
    .index("by_advisor", ["advisorId"])
    .index("by_sender", ["sender"])
    .index("by_created_at", ["createdAt"]),

  // Advisor Memories table - Maps to Prisma AdvisorMemory model
  advisorMemories: defineTable({
    conversationId: v.id("conversations"), // Reference to conversations table
    advisorId: v.id("advisors"), // Reference to advisors table
    key: v.string(), // Memory key identifier
    value: v.any(), // Flexible JSON value
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_advisor", ["advisorId"])
    .index("by_conversation_advisor", ["conversationId", "advisorId"])
    .index("by_conversation_advisor_key", ["conversationId", "advisorId", "key"]),

  // Thread Summaries table - Maps to Prisma ThreadSummary model
  threadSummaries: defineTable({
    conversationId: v.id("conversations"), // Reference to conversations table
    content: v.string(), // Summary content
    startMessageId: v.optional(v.string()), // Start message reference (string for migration compatibility)
    endMessageId: v.optional(v.string()), // End message reference (string for migration compatibility)
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_created_at", ["createdAt"]),

  // Typing indicators for real-time chat (new feature)
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    lastTypingAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_conversation_typing", ["conversationId", "isTyping"]),

  // User presence for real-time features (new feature)
  userPresence: defineTable({
    userId: v.id("users"),
    isOnline: v.boolean(),
    lastSeenAt: v.number(),
    currentConversationId: v.optional(v.id("conversations")),
  })
    .index("by_user", ["userId"])
    .index("by_online", ["isOnline"])
    .index("by_conversation", ["currentConversationId"]),
});
