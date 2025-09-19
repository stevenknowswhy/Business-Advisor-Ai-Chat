import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * AI Advisor Chat - Convex Schema
 *
 * This schema includes the Advisor Marketplace feature with the following tables:
 * - User → users
 * - Advisor → advisors (enhanced with marketplace fields)
 * - UserAdvisor → userAdvisors (NEW - junction table for advisor selections)
 * - TeamTemplate → teamTemplates (NEW - predefined advisor teams)
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

  // Advisors table - Maps to Prisma Advisor model (enhanced for marketplace)
  advisors: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    schemaVersion: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("archived")),
    // Marketplace fields
    ownerId: v.optional(v.id("users")), // null for marketplace/public advisors
    isPublic: v.optional(v.boolean()), // true for marketplace advisors
    featured: v.optional(v.boolean()), // true for featured marketplace advisors
    category: v.optional(v.string()), // "business", "marketing", "technical", etc.
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
      teamAffiliations: v.optional(v.array(v.object({
        teamId: v.string(),
        teamName: v.string(),
        roleName: v.string(),
        isPrimary: v.optional(v.boolean()),
      }))),
    })),
    localization: v.optional(v.object({
      language: v.optional(v.string()),
      region: v.optional(v.string()),
      defaultLanguage: v.optional(v.string()),
      supportedLanguages: v.optional(v.array(v.string())),
    })),
    modelHint: v.optional(v.union(v.literal("openrouter"), v.literal("glm"), v.literal("hybrid"))),
    glmConfig: v.optional(v.object({
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      enableFunctionCalling: v.optional(v.boolean()),
      languagePreference: v.optional(v.union(v.literal("en"), v.literal("zh"), v.literal("auto"))),
    })),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_tags", ["tags"])
    .index("by_created_at", ["createdAt"])
    .index("by_schema_version", ["schemaVersion"])
    .index("by_persona_name", ["persona.name"])
    // Marketplace indexes
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic"])
    .index("by_featured", ["featured"])
    .index("by_category", ["category"])
    .index("by_public_featured", ["isPublic", "featured"])
    .index("by_public_category", ["isPublic", "category"]),

  // User Advisors junction table - Tracks which advisors each user has selected
  userAdvisors: defineTable({
    userId: v.id("users"), // Reference to users table
    advisorId: v.id("advisors"), // Reference to advisors table
    selectedAt: v.number(), // Unix timestamp when advisor was selected
    source: v.union(
      v.literal("marketplace"),
      v.literal("team"),
      v.literal("migration"),
      v.literal("custom")
    ), // How the advisor was selected
    teamId: v.optional(v.string()), // Team ID if selected via team creation
  })
    .index("by_user", ["userId"]) // Primary query pattern - get user's selected advisors
    .index("by_advisor", ["advisorId"]) // For advisor usage analytics
    .index("by_user_advisor", ["userId", "advisorId"]) // Unique constraint enforcement
    .index("by_team", ["teamId"]) // For team-based queries
    .index("by_source", ["source"]) // For analytics on selection methods
    .index("by_selected_at", ["selectedAt"]), // For chronological queries

  // Team Templates - Predefined advisor teams for one-click selection
  teamTemplates: defineTable({
    id: v.string(), // Human-readable ID like "startup-founding-team"
    name: v.string(), // Display name like "Startup Founding Team"
    description: v.string(), // Description of the team's purpose
    category: v.string(), // "startup", "marketing", "development", "sales", etc.
    advisorIds: v.array(v.id("advisors")), // Array of advisor references
    icon: v.optional(v.string()), // URL to team icon/image
    featured: v.optional(v.boolean()), // true for featured teams
    sortOrder: v.optional(v.number()), // For custom ordering
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .index("by_sort_order", ["sortOrder"])
    .index("by_featured_sort", ["featured", "sortOrder"])
    .index("by_category_sort", ["category", "sortOrder"]),

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

  // Projects table - For organizing conversations into projects
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"), // Project owner
    status: v.union(v.literal("active"), v.literal("archived"), v.literal("completed")),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()), // For UI organization (hex color)
    icon: v.optional(v.string()), // Project emoji icon
    iconUrl: v.optional(v.string()), // Project custom icon URL
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created_at", ["createdAt"]),

  // Project Conversations junction table - Links conversations to projects
  projectConversations: defineTable({
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
    addedAt: v.number(),
    addedBy: v.id("users"), // Who added the conversation to the project
  })
    .index("by_project", ["projectId"])
    .index("by_conversation", ["conversationId"])
    .index("by_project_conversation", ["projectId", "conversationId"])
    .index("by_project_added", ["projectId", "addedAt"])
    .index("by_user_added", ["addedBy"]),

  // Advisor Reviews - User ratings and feedback for advisors
  advisorReviews: defineTable({
    advisorId: v.id("advisors"), // Reference to advisors table
    userId: v.id("users"), // Reference to users table
    rating: v.number(), // 1-5 star rating
    title: v.optional(v.string()), // Review title
    content: v.string(), // Review content
    helpful: v.optional(v.number()), // Number of "helpful" votes
    verified: v.optional(v.boolean()), // Whether the user actually used this advisor
    tags: v.optional(v.array(v.string())), // Review tags (e.g., "responsive", "knowledgeable")
    response: v.optional(v.object({
      content: v.string(), // Advisor's response to the review
      respondedAt: v.number(), // When the advisor responded
    })),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")), // Review moderation status
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_advisor", ["advisorId"])
    .index("by_user", ["userId"])
    .index("by_advisor_user", ["advisorId", "userId"])
    .index("by_rating", ["rating"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_advisor_rating", ["advisorId", "rating"])
    .index("by_advisor_created", ["advisorId", "createdAt"])
    .index("by_advisor_status", ["advisorId", "status"]),

  // Advisor Portfolios - Work samples and achievements
  advisorPortfolios: defineTable({
    advisorId: v.id("advisors"), // Reference to advisors table
    title: v.string(), // Portfolio item title
    description: v.string(), // Portfolio item description
    type: v.union(v.literal("case_study"), v.literal("project"), v.literal("achievement"), v.literal("publication"), v.literal("other")), // Portfolio item type
    content: v.optional(v.string()), // Detailed content/markdown
    images: v.optional(v.array(v.string())), // URLs to images
    links: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      type: v.union(v.literal("website"), v.literal("github"), v.literal("linkedin"), v.literal("other")),
    }))),
    tags: v.optional(v.array(v.string())), // Portfolio tags
    featured: v.optional(v.boolean()), // Whether this is a featured portfolio item
    order: v.optional(v.number()), // Display order
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")), // Portfolio item status
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_advisor", ["advisorId"])
    .index("by_advisor_status", ["advisorId", "status"])
    .index("by_advisor_featured", ["advisorId", "featured"])
    .index("by_advisor_order", ["advisorId", "order"])
    .index("by_type", ["type"])
    .index("by_featured", ["featured"])
    .index("by_created_at", ["createdAt"]),

  // Advisor Availability - Scheduling and availability status
  advisorAvailability: defineTable({
    advisorId: v.id("advisors"), // Reference to advisors table
    timezone: v.string(), // Advisor's timezone (e.g., "America/New_York")
    status: v.union(v.literal("available"), v.literal("busy"), v.literal("offline"), v.literal("away")), // Current availability status
    schedule: v.optional(v.array(v.object({
      dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
      startTime: v.string(), // HH:mm format
      endTime: v.string(), // HH:mm format
      available: v.boolean(), // Whether available during this time
    }))),
    nextAvailable: v.optional(v.number()), // Unix timestamp for next available time
    responseTime: v.optional(v.object({
      average: v.number(), // Average response time in minutes
      min: v.number(), // Minimum response time
      max: v.number(), // Maximum response time
    })),
    capacity: v.optional(v.object({
      maxConcurrent: v.number(), // Maximum concurrent conversations
      currentLoad: v.number(), // Current conversation load
    })),
    statusMessage: v.optional(v.string()), // Custom status message
    lastStatusUpdate: v.number(), // Unix timestamp for last status update
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_advisor", ["advisorId"])
    .index("by_status", ["status"])
    .index("by_advisor_status", ["advisorId", "status"])
    .index("by_next_available", ["nextAvailable"])
    .index("by_updated_at", ["updatedAt"]),

  // GLM Performance Tracking - Monitor GLM model performance metrics
  glmPerformance: defineTable({
    advisorId: v.id("advisors"),
    model: v.string(),
    responseTime: v.number(),
    tokenCount: v.object({
      prompt: v.number(),
      completion: v.number(),
      total: v.number(),
    }),
    userSatisfaction: v.optional(v.number()), // 1-5 rating from user feedback
    success: v.boolean(),
    error: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_advisor", ["advisorId"])
    .index("by_model", ["model"])
    .index("by_advisor_model", ["advisorId", "model"])
    .index("by_success", ["success"])
    .index("by_timestamp", ["timestamp"])
    .index("by_advisor_timestamp", ["advisorId", "timestamp"]),

  // AI Model Performance Comparison - Compare GLM vs OpenRouter performance
  modelComparison: defineTable({
    advisorId: v.id("advisors"),
    provider: v.union(v.literal("glm"), v.literal("openrouter")),
    model: v.string(),
    userTier: v.string(),
    conversationId: v.id("conversations"),
    metrics: v.object({
      responseTime: v.number(),
      totalTokens: v.number(),
      cost: v.number(),
      userRating: v.optional(v.number()),
      wasFollowedUp: v.optional(v.boolean()),
    }),
    context: v.object({
      language: v.optional(v.string()),
      complexity: v.optional(v.union(v.literal("simple"), v.literal("moderate"), v.literal("complex"))),
      category: v.optional(v.string()),
      requiredFunctionCalling: v.boolean(),
    }),
    timestamp: v.number(),
  })
    .index("by_advisor", ["advisorId"])
    .index("by_provider", ["provider"])
    .index("by_model", ["model"])
    .index("by_user_tier", ["userTier"])
    .index("by_conversation", ["conversationId"])
    .index("by_provider_model", ["provider", "model"])
    .index("by_timestamp", ["timestamp"]),
});
