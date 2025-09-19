# AI Advisor Chat - API Routes

## 🌐 API Architecture Overview

The AI Advisor Chat application uses **Convex functions** for backend logic, with Next.js API routes handling specific integrations. The architecture supports real-time data synchronization, secure authentication, and AI model integration.

---

## 🏗️ API Structure

```
convex/                           # Convex serverless functions
├── advisors.ts                    # Advisor management functions
├── marketplace.ts                 # Marketplace operations
├── conversations.ts               # Conversation management
├── messages.ts                    # Message handling
├── users.ts                       # User management
├── migrations.ts                  # Data migration scripts
└── schema.ts                      # Database schema

src/app/api/                      # Next.js API routes
├── chat/                          # Chat-related endpoints
│   └── route.ts                   # Main chat endpoint
├── conversations/                 # Conversation endpoints
│   └── [id]/
│       ├── route.ts               # Conversation CRUD
│       └── set-active/            # Active advisor management
│           └── route.ts
├── health/                        # Health check
│   └── route.ts
└── auth/                          # Authentication hooks
    └── [...nextauth]/
        └── route.ts
```

---

## 🔧 Convex Functions

### 1. **advisors.ts** - Advisor Management

#### Get Marketplace Advisors
```typescript
export const getMarketplaceAdvisors = query({
  args: {
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      featured: v.optional(v.boolean()),
      search: v.optional(v.string()),
    })),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("advisors")
      .filter(q => q.eq(q.field("isPublic"), true))
      .filter(q => q.eq(q.field("status"), "active"));

    // Apply filters
    if (args.filters?.category) {
      query = query.filter(q => q.eq(q.field("category"), args.filters.category));
    }
    if (args.filters?.featured !== undefined) {
      query = query.filter(q => q.eq(q.field("featured"), args.filters.featured));
    }

    // Search functionality
    if (args.filters?.search) {
      const searchLower = args.filters.search.toLowerCase();
      query = query.filter(q =>
        q.or(
          q.contains(q.field("persona.name"), searchLower),
          q.contains(q.field("persona.title"), searchLower),
          q.contains(q.field("persona.bio"), searchLower),
          q.some(q.field("tags"), tag => q.contains(tag, searchLower))
        )
      );
    }

    // Apply pagination
    if (args.limit) {
      query = query.take(args.limit);
    }
    if (args.cursor) {
      query = query.after(args.cursor);
    }

    const advisors = await query.order("desc", q => q.field("createdAt")).collect();
    return advisors;
  },
});
```

#### Get User Advisors
```typescript
export const getUserAdvisors = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const userAdvisors = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();

    const advisorIds = userAdvisors.map(ua => ua.advisorId);

    if (advisorIds.length === 0) {
      return [];
    }

    const advisors = await ctx.db
      .query("advisors")
      .filter(q => q.or(...advisorIds.map(id => q.eq(q.field("_id"), id))))
      .collect();

    return advisors;
  },
});
```

#### Select Advisor
```typescript
export const selectAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
    source: v.union(
      v.literal("marketplace"),
      v.literal("team"),
      v.literal("migration"),
      v.literal("custom")
    ),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    // Check if advisor exists and is accessible
    const advisor = await ctx.db.get(args.advisorId);
    if (!advisor) throw new Error("Advisor not found");
    if (advisor.status !== "active") throw new Error("Advisor not active");
    if (advisor.ownerId && advisor.ownerId !== user._id) {
      throw new Error("Cannot access private advisor");
    }

    // Check if already selected
    const existing = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user_advisor", q =>
        q.eq("userId", user._id).eq("advisorId", args.advisorId)
      )
      .first();

    if (existing) {
      // Already selected, update source if needed
      await ctx.db.patch(existing._id, {
        source: args.source,
        teamId: args.teamId,
        updatedAt: Date.now(),
      });
      return existing;
    }

    // Add new selection
    const userAdvisor = await ctx.db.insert("userAdvisors", {
      userId: user._id,
      advisorId: args.advisorId,
      selectedAt: Date.now(),
      source: args.source,
      teamId: args.teamId,
    });

    return userAdvisor;
  },
});
```

### 2. **conversations.ts** - Conversation Management

#### Get User Conversations
```typescript
export const getUserConversations = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    let query = ctx.db
      .query("conversations")
      .withIndex("by_user_updated", q => q.eq("userId", user._id).order("desc"));

    if (args.limit) {
      query = query.take(args.limit);
    }
    if (args.cursor) {
      query = query.after(args.cursor);
    }

    const conversations = await query.collect();
    return conversations;
  },
});
```

#### Create Conversation
```typescript
export const createConversation = mutation({
  args: {
    title: v.optional(v.string()),
    advisorId: v.optional(v.id("advisors")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const conversation = await ctx.db.insert("conversations", {
      userId: user._id,
      title: args.title || "New Conversation",
      activeAdvisorId: args.advisorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return conversation;
  },
});
```

#### Delete Conversation
```typescript
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Delete related data
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", q => q.eq("conversationId", args.conversationId))
      .collect();

    // Delete messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete memories
    const memories = await ctx.db
      .query("advisorMemories")
      .withIndex("by_conversation", q => q.eq("conversationId", args.conversationId))
      .collect();

    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    // Delete summaries
    const summaries = await ctx.db
      .query("threadSummaries")
      .withIndex("by_conversation", q => q.eq("conversationId", args.conversationId))
      .collect();

    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }

    // Delete conversation
    await ctx.db.delete(args.conversationId);

    return { success: true };
  },
});
```

### 3. **messages.ts** - Message Handling

#### Get Conversation Messages
```typescript
export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    // Verify conversation access
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found or access denied");
    }

    let query = ctx.db
      .query("messages")
      .withIndex("by_conversation_created", q =>
        q.eq("conversationId", args.conversationId).order("asc")
      );

    if (args.limit) {
      query = query.take(args.limit);
    }
    if (args.cursor) {
      query = query.after(args.cursor);
    }

    const messages = await query.collect();
    return messages;
  },
});
```

#### Send Message
```typescript
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found or access denied");
    }

    // Parse mentions and handle advisor switching
    const { mentions, startsWithSwitch } = parseMentions({
      text: args.content,
      advisors: await getAvailableAdvisors(ctx, user._id),
    });

    let activeAdvisorId = conversation.activeAdvisorId;
    if (startsWithSwitch) {
      activeAdvisorId = startsWithSwitch;
      // Update conversation active advisor
      await ctx.db.patch(args.conversationId, {
        activeAdvisorId,
        updatedAt: Date.now(),
      });
    }

    // Create user message
    const message = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: "user",
      content: args.content,
      mentions: mentions || [],
      createdAt: Date.now(),
    });

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    // Generate AI response
    await generateAIResponse(ctx, {
      conversationId: args.conversationId,
      advisorId: activeAdvisorId,
      userMessageId: message._id,
    });

    return message;
  },
});
```

### 4. **marketplace.ts** - Marketplace Operations

#### Get Team Templates
```typescript
export const getTeamTemplates = query({
  args: {
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("teamTemplates");

    if (args.category) {
      query = query.withIndex("by_category_sort", q =>
        q.eq("category", args.category).order("asc")
      );
    } else if (args.featured !== undefined) {
      query = query.withIndex("by_featured_sort", q =>
        q.eq("featured", args.featured).order("asc")
      );
    } else {
      query = query.withIndex("by_sort_order", q => q.order("asc"));
    }

    return await query.collect();
  },
});
```

#### Create Team from Template
```typescript
export const createTeamFromTemplate = mutation({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const template = await ctx.db
      .query("teamTemplates")
      .filter(q => q.eq(q.field("id"), args.templateId))
      .first();

    if (!template) throw new Error("Team template not found");

    // Add all advisors from template to user's advisors
    const selections = [];
    for (const advisorId of template.advisorIds) {
      try {
        const selection = await ctx.db.insert("userAdvisors", {
          userId: user._id,
          advisorId,
          selectedAt: Date.now(),
          source: "team",
          teamId: template.id,
        });
        selections.push(selection);
      } catch (error) {
        // Advisor might already be selected, continue
        console.warn(`Advisor ${advisorId} already selected for user ${user._id}`);
      }
    }

    return selections;
  },
});
```

---

## 🌐 Next.js API Routes

### 1. **Chat Route** (`/api/chat/route.ts`)

Main chat endpoint that handles message processing and AI integration.

```typescript
import { ConvexHttpClient } from "convex/browser";
import { openrouter } from "@/server/llm/openrouter";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId, messages: _, text } = body;

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get user authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Process message through Convex
    const result = await convex.mutation("messages/sendMessage", {
      conversationId,
      content: text,
    });

    // Stream AI response
    const advisor = await convex.query("advisors getById", {
      advisorId: result.activeAdvisorId,
    });

    const aiResponse = await streamText({
      model: openrouter(advisor.modelHint || "deepseek/deepseek-chat-v3.1"),
      messages: [
        { role: "system", content: buildSystemPrompt(advisor) },
        ...messages.slice(-10), // Context window
      ],
      temperature: 0.3,
      onFinish: async ({ text, usage }) => {
        // Save AI response to Convex
        await convex.mutation("messages/saveAIResponse", {
          conversationId,
          advisorId: advisor._id,
          content: text,
          usage,
        });
      },
    });

    return aiResponse.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

### 2. **Conversation Routes** (`/api/conversations/[id]/`)

#### Get Conversation
```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const user = await getUserFromRequest(req);

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversation = await convex.query("conversations getById", {
      conversationId: params.id,
      userId: user.id,
    });

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    return Response.json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

#### Set Active Advisor
```typescript
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const { advisorId } = body;

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    await convex.mutation("conversations/setActiveAdvisor", {
      conversationId: params.id,
      advisorId,
      userId: user.id,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Set active advisor error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

### 3. **Health Check** (`/api/health/route.ts`)

```typescript
export async function GET() {
  try {
    // Check Convex connection
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    await convex.query("health/check", {});

    // Check AI service
    const testResponse = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    const services = {
      convex: "healthy",
      openrouter: testResponse.ok ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
    };

    return Response.json(services);
  } catch (error) {
    return Response.json({
      convex: "unhealthy",
      openrouter: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
```

---

## 🔐 Authentication Integration

### User Authentication Helper
```typescript
import { auth } from "@clerk/nextjs/server";

export async function getUserFromRequest(req: Request) {
  const { userId } = await auth();
  if (!userId) return null;

  // Get user from Convex
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const user = await convex.query("users.getByClerkId", { clerkId: userId });

  return user;
}

export async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Get or create user
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    // Create new user
    user = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
      image: identity.pictureUrl,
      plan: "free",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return user;
}
```

---

## 🤖 AI Integration

### AI Response Generation
```typescript
export async function generateAIResponse(ctx: any, args: {
  conversationId: string;
  advisorId: string;
  userMessageId: string;
}) {
  const [conversation, advisor, recentMessages] = await Promise.all([
    ctx.db.get(args.conversationId),
    ctx.db.get(args.advisorId),
    ctx.db.query("messages")
      .withIndex("by_conversation_created", q =>
        q.eq("conversationId", args.conversationId).order("desc")
      )
      .take(10)
      .collect(),
  ]);

  // Build AI prompt
  const systemPrompt = buildAdvisorPrompt(advisor);
  const conversationHistory = recentMessages
    .reverse()
    .map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    }));

  // Get user model tier
  const user = await ctx.db.get(conversation.userId);
  const model = selectModelForUser(user?.plan || "free", advisor.modelHint);

  // Generate AI response
  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ],
    temperature: 0.3,
    stream: false,
  });

  // Save AI response
  const aiMessage = await ctx.db.insert("messages", {
    conversationId: args.conversationId,
    sender: "advisor",
    advisorId: args.advisorId,
    content: response.choices[0].message.content,
    contentJson: {
      model,
      usage: response.usage,
    },
    tokensUsed: response.usage?.total_tokens,
    createdAt: Date.now(),
  });

  return aiMessage;
}
```

### Model Selection Logic
```typescript
function selectModelForUser(userPlan: string, advisorHint?: string) {
  const modelMap = {
    free: process.env.OPENROUTER_FREE_MODEL || "nvidia/nemotron-nano-9b-v2:free",
    base: process.env.OPENROUTER_BASE_MODEL || "deepseek/deepseek-chat-v3-0324",
    premium: process.env.OPENROUTER_PREMIUM_MODEL || "deepseek/deepseek-chat-v3.1",
  };

  // Use advisor hint if user has premium plan
  if (userPlan === "premium" && advisorHint) {
    return advisorHint;
  }

  return modelMap[userPlan as keyof typeof modelMap] || modelMap.free;
}
```

---

## 📊 Real-time Features

### Typing Indicators
```typescript
export const setTypingIndicator = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    // Update or create typing indicator
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", q => q.eq("conversationId", args.conversationId))
      .filter(q => q.eq(q.field("userId"), user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        lastTypingAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: user._id,
        isTyping: args.isTyping,
        lastTypingAt: Date.now(),
      });
    }

    return { success: true };
  },
});
```

### User Presence
```typescript
export const updatePresence = mutation({
  args: {
    isOnline: v.boolean(),
    currentConversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: args.isOnline,
        lastSeenAt: Date.now(),
        currentConversationId: args.currentConversationId,
      });
    } else {
      await ctx.db.insert("userPresence", {
        userId: user._id,
        isOnline: args.isOnline,
        lastSeenAt: Date.now(),
        currentConversationId: args.currentConversationId,
      });
    }

    return { success: true };
  },
});
```

---

## 🛡️ Error Handling

### Standard Error Response
```typescript
export function handleAPIError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes("not found")) {
      return new Response("Resource not found", { status: 404 });
    }
    if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return new Response("Invalid request", { status: 400 });
    }
  }

  // Default error response
  return new Response("Internal server error", { status: 500 });
}
```

### Rate Limiting
```typescript
import { rateLimit } from "convex-helpers/server/rateLimit";

const rateLimitedMutation = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});

export const rateLimitedSendMessage = mutation({
  args: { /* ... */ },
  handler: rateLimitedMutation(async (ctx, args) => {
    // Your mutation logic here
  }),
});
```

---

## 📈 Performance Optimization

### Query Optimization
```typescript
// Use selective field queries
export const getConversationPreview = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .filter(q => q.eq(q.field("_id"), args.conversationId))
      .first()
      .then(conv => conv ? {
        id: conv._id,
        title: conv.title,
        updatedAt: conv.updatedAt,
        activeAdvisorId: conv.activeAdvisorId,
      } : null);
  },
});
```

### Batch Operations
```typescript
export const bulkUpdateConversations = mutation({
  args: {
    conversationIds: v.array(v.id("conversations")),
    updates: v.object({
      title: v.optional(v.string()),
      activeAdvisorId: v.optional(v.id("advisors")),
    }),
  },
  handler: async (ctx, args) => {
    const results = await Promise.allSettled(
      args.conversationIds.map(id =>
        ctx.db.patch(id, {
          ...args.updates,
          updatedAt: Date.now(),
        })
      )
    );

    return {
      success: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length,
    };
  },
});
```

The API architecture provides a robust, scalable, and secure foundation for the AI Advisor Chat application, with proper error handling, real-time capabilities, and comprehensive authentication integration.