# AI Advisor Chat - Database Schema (Convex)

## 🗄️ Database Overview

The AI Advisor Chat application uses **Convex** as its primary database, providing real-time data synchronization, serverless functions, and automatic scalability. The schema supports marketplace functionality, multi-advisor conversations, and user management.

---

## 📋 Schema Architecture

### Core Design Principles
- **Real-time First**: All data syncs instantly across devices
- **User Isolation**: Row-level security ensures data privacy
- **Marketplace Support**: Advisor discovery and selection system
- **Scalable Structure**: Optimized for growth and performance

---

## 🏗️ Table Definitions

### 1. **users** - User Management
Stores user account information and authentication data.

```typescript
users: defineTable({
  // Authentication
  clerkId: v.string(),           // Clerk user ID (primary identifier)
  email: v.optional(v.string()),  // User email address
  name: v.optional(v.string()),   // User display name
  image: v.optional(v.string()),  // User profile image URL

  // Subscription & Access
  plan: v.string(),               // "free", "pro", "enterprise"

  // Timestamps
  createdAt: v.number(),          // Unix timestamp
  updatedAt: v.number(),          // Unix timestamp
})
.index("by_clerk_id", ["clerkId"])
.index("by_email", ["email"])
.index("by_plan", ["plan"])
```

**Key Relationships**:
- One-to-many with `conversations`
- One-to-many with `userAdvisors`
- One-to-many with `typingIndicators`
- One-to-many with `userPresence`

### 2. **advisors** - Advisor Profiles
Stores AI advisor configurations and marketplace information.

```typescript
advisors: defineTable({
  // Basic Info
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  schemaVersion: v.string(),
  status: v.union(v.literal("active"), v.literal("inactive"), v.literal("archived")),

  // Marketplace Fields
  ownerId: v.optional(v.id("users")),           // null for marketplace advisors
  isPublic: v.optional(v.boolean()),           // true for marketplace advisors
  featured: v.optional(v.boolean()),           // true for featured advisors
  category: v.optional(v.string()),            // "business", "marketing", "technical"

  // Complex JSON Objects
  persona: v.object({ ... }),                   // Advisor personality and background
  roleDefinition: v.optional(v.object({ ... })), // Role and responsibilities
  components: v.optional(v.array(v.any())),     // Advisor components/behaviors
  metadata: v.optional(v.object({ ... })),     // Metadata and tags
  localization: v.optional(v.object({ ... })),  // Localization settings

  // AI Configuration
  modelHint: v.optional(v.string()),          // Preferred AI model
  tags: v.array(v.string()),                   // Search and filter tags

  // Timestamps
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
.index("by_public_category", ["isPublic", "category"])
```

**Persona Object Structure**:
```typescript
persona: v.object({
  // Basic Information
  name: v.string(),
  title: v.string(),
  image: v.optional(v.string()),
  description: v.optional(v.string()),
  oneLiner: v.optional(v.string()),
  archetype: v.optional(v.string()),
  temperament: v.optional(v.string()),

  // Background
  bio: v.optional(v.string()),
  detailedBackground: v.optional(v.string()),
  experience: v.optional(v.string()),
  specialties: v.optional(v.array(v.string())),
  personalInterests: v.optional(v.array(v.string())),

  // Personality & Style
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

  // Communication Preferences
  adviceDelivery: v.optional(v.object({
    mode: v.optional(v.string()),
    formality: v.optional(v.string()),
    useEmojis: v.optional(v.boolean()),
    voiceGuidelines: v.optional(v.array(v.string())),
    signOff: v.optional(v.string()),
  })),

  maritalStatus: v.optional(v.string()),
})
```

### 3. **userAdvisors** - User-Advisor Junction Table
Tracks which advisors each user has selected for their advisory board.

```typescript
userAdvisors: defineTable({
  userId: v.id("users"),                     // Reference to users table
  advisorId: v.id("advisors"),                // Reference to advisors table
  selectedAt: v.number(),                     // Unix timestamp when selected
  source: v.union(                           // How the advisor was selected
    v.literal("marketplace"),
    v.literal("team"),
    v.literal("migration"),
    v.literal("custom")
  ),
  teamId: v.optional(v.string()),            // Team ID if selected via team
})
.index("by_user", ["userId"])                  // Primary query pattern
.index("by_advisor", ["advisorId"])            // For advisor analytics
.index("by_user_advisor", ["userId", "advisorId"]) // Unique constraint
.index("by_team", ["teamId"])                  // For team-based queries
.index("by_source", ["source"])                // For selection analytics
.index("by_selected_at", ["selectedAt"])      // For chronological queries
```

### 4. **teamTemplates** - Predefined Advisor Teams
Stores predefined advisor team configurations for quick setup.

```typescript
teamTemplates: defineTable({
  id: v.string(),                             // Human-readable ID
  name: v.string(),                           // Display name
  description: v.string(),                   // Team description
  category: v.string(),                       // "startup", "marketing", etc.
  advisorIds: v.array(v.id("advisors")),     // Array of advisor references
  icon: v.optional(v.string()),               // Team icon URL
  featured: v.optional(v.boolean()),          // Featured team status
  sortOrder: v.optional(v.number()),          // Custom ordering
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_category", ["category"])
.index("by_featured", ["featured"])
.index("by_sort_order", ["sortOrder"])
.index("by_featured_sort", ["featured", "sortOrder"])
.index("by_category_sort", ["category", "sortOrder"])
```

### 5. **conversations** - Conversation Management
Stores conversation metadata and active advisor information.

```typescript
conversations: defineTable({
  userId: v.id("users"),                     // Conversation owner
  title: v.optional(v.string()),             // Conversation title
  activeAdvisorId: v.optional(v.id("advisors")), // Currently active advisor
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_advisor", ["activeAdvisorId"])
.index("by_updated_at", ["updatedAt"])
.index("by_user_updated", ["userId", "updatedAt"])
```

### 6. **messages** - Message Storage
Stores individual messages with sender information and metadata.

```typescript
messages: defineTable({
  conversationId: v.id("conversations"),        // Parent conversation
  sender: v.union(                           // Message sender
    v.literal("user"),
    v.literal("advisor"),
    v.literal("system")
  ),
  advisorId: v.optional(v.id("advisors")),    // Which advisor sent this
  content: v.string(),                       // Message content
  contentJson: v.optional(v.any()),          // Structured content data
  mentions: v.array(v.string()),             // Mentioned user/advisor IDs
  tokensUsed: v.optional(v.number()),        // AI token usage
  createdAt: v.number(),
})
.index("by_conversation", ["conversationId"])
.index("by_conversation_created", ["conversationId", "createdAt"])
.index("by_advisor", ["advisorId"])
.index("by_sender", ["sender"])
.index("by_created_at", ["createdAt"])
```

### 7. **advisorMemories** - Advisor Context Memory
Stores advisor-specific memory and context for conversations.

```typescript
advisorMemories: defineTable({
  conversationId: v.id("conversations"),       // Associated conversation
  advisorId: v.id("advisors"),                // Associated advisor
  key: v.string(),                           // Memory key identifier
  value: v.any(),                            // Flexible JSON value
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_conversation", ["conversationId"])
.index("by_advisor", ["advisorId"])
.index("by_conversation_advisor", ["conversationId", "advisorId"])
.index("by_conversation_advisor_key", ["conversationId", "advisorId", "key"])
```

### 8. **threadSummaries** - Conversation Summaries
Stores conversation summaries for context management.

```typescript
threadSummaries: defineTable({
  conversationId: v.id("conversations"),       // Parent conversation
  content: v.string(),                       // Summary content
  startMessageId: v.optional(v.string()),     // Start message reference
  endMessageId: v.optional(v.string()),       // End message reference
  createdAt: v.number(),
})
.index("by_conversation", ["conversationId"])
.index("by_created_at", ["createdAt"])
```

### 9. **typingIndicators** - Real-time Typing Status
Tracks real-time typing indicators for chat users.

```typescript
typingIndicators: defineTable({
  conversationId: v.id("conversations"),       // Associated conversation
  userId: v.id("users"),                      // User who is typing
  isTyping: v.boolean(),                      // Typing status
  lastTypingAt: v.number(),                   // Last typing timestamp
})
.index("by_conversation", ["conversationId"])
.index("by_user", ["userId"])
.index("by_conversation_typing", ["conversationId", "isTyping"])
```

### 10. **userPresence** - User Presence Tracking
Tracks user online status and presence information.

```typescript
userPresence: defineTable({
  userId: v.id("users"),                      // User reference
  isOnline: v.boolean(),                      // Online status
  lastSeenAt: v.number(),                     // Last activity timestamp
  currentConversationId: v.optional(v.id("conversations")), // Active conversation
})
.index("by_user", ["userId"])
.index("by_online", ["isOnline"])
.index("by_conversation", ["currentConversationId"])
```

---

## 🔗 Relationship Diagram

```
users (1) ── (N) conversations
   │               │
   │               ├─ (N) messages
   │               ├─ (N) advisorMemories
   │               ├─ (N) threadSummaries
   │               └─ (N) typingIndicators
   │
   ├─ (N) userAdvisors ── (N) advisors
   │                     │
   └─ (N) teamTemplates ── (N) advisors
                           │
                           └─ (N) messages (as advisorId)
```

---

## 📊 Index Strategy

### Primary Query Patterns

1. **User Conversations**: `by_user_updated` on `conversations`
   ```typescript
   // Get user's conversations, most recent first
   ctx.db.query("conversations")
     .withIndex("by_user_updated", q => q.eq("userId", userId).order("desc"))
     .collect()
   ```

2. **Marketplace Advisors**: `by_public_featured` on `advisors`
   ```typescript
   // Get featured marketplace advisors
   ctx.db.query("advisors")
     .withIndex("by_public_featured", q => q.eq("isPublic", true).eq("featured", true))
     .collect()
   ```

3. **Conversation Messages**: `by_conversation_created` on `messages`
   ```typescript
   // Get messages in chronological order
   ctx.db.query("messages")
     .withIndex("by_conversation_created", q => q.eq("conversationId", conversationId).order("asc"))
     .collect()
   ```

4. **User Advisors**: `by_user` on `userAdvisors`
   ```typescript
   // Get user's selected advisors
   ctx.db.query("userAdvisors")
     .withIndex("by_user", q => q.eq("userId", userId))
     .collect()
   ```

### Performance Optimizations

1. **Composite Indexes**: Multi-field indexes for common query patterns
2. **Sorting Indexes**: Ordered indexes for chronological data
3. **Filtering Indexes**: Boolean and category-based filtering
4. **Unique Constraints**: Prevent duplicate data and ensure data integrity

---

## 🔐 Security Model

### Row-Level Security

1. **User Data Isolation**: All queries include user ID filters
2. **Access Control**: Server functions validate user permissions
3. **Data Ownership**: Users can only access their own data

### Example Security Pattern

```typescript
// Secure conversation access
export const getConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter(q => q.eq(q.field("_id"), args.conversationId))
      .filter(q => q.eq(q.field("userId"), user._id))
      .first();

    if (!conversation) {
      throw new Error("Conversation not found or access denied");
    }

    return conversation;
  },
});
```

---

## 🔄 Data Migration Strategy

### From Prisma to Convex

1. **Schema Mapping**: Direct mapping between Prisma and Convex schemas
2. **Data Transformation**: JSON field conversion and restructuring
3. **Relationship Preservation**: Maintaining foreign key relationships
4. **Timestamp Conversion**: Converting DateTime to Unix timestamps

### Migration Scripts

```typescript
// Example migration function
export const migrateUserData = mutation({
  handler: async (ctx) => {
    // Migrate users from Prisma format
    const prismaUsers = await getPrismaUsers();

    for (const user of prismaUsers) {
      await ctx.db.insert("users", {
        clerkId: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      });
    }
  },
});
```

---

## 📈 Scalability Considerations

### Database Scaling

1. **Automatic Scaling**: Convex handles database scaling automatically
2. **Index Optimization**: Proper indexing for query performance
3. **Data Partitioning**: Natural partitioning by user ID
4. **Caching Strategy**: Convex provides built-in caching

### Query Optimization

1. **Selective Queries**: Only request needed fields
2. **Batch Operations**: Combine multiple operations
3. **Real-time Subscriptions**: Efficient live data updates
4. **Pagination**: Limit result sets for large collections

---

## 🧪 Testing Strategy

### Schema Testing

1. **Type Validation**: Convex provides runtime type checking
2. **Query Testing**: Verify all query patterns work correctly
3. **Relationship Testing**: Ensure data integrity
4. **Security Testing**: Verify access controls

### Example Test

```typescript
test("user can only access their own conversations", async () => {
  const user1 = await createUser();
  const user2 = await createUser();
  const conversation = await createConversation(user1);

  // User1 should be able to access
  const result1 = await getConversation(user1, conversation._id);
  expect(result1).not.toBeNull();

  // User2 should not be able to access
  const result2 = await getConversation(user2, conversation._id);
  expect(result2).toBeNull();
});
```

---

## 🚀 Best Practices

### Schema Design

1. **Consistent Naming**: Use clear, descriptive field names
2. **Proper Indexing**: Index for common query patterns
3. **Type Safety**: Leverage Convex's type system
4. **Data Validation**: Use Convex's validation rules

### Query Patterns

1. **Filter First**: Apply filters before other operations
2. **Limit Results**: Use pagination for large datasets
3. **Batch Operations**: Combine related operations
4. **Error Handling**: Handle edge cases gracefully

### Security Practices

1. **Validate Input**: Never trust client-side data
2. **Check Permissions**: Verify user access on every operation
3. **Use Indexes**: Leverage indexes for efficient security checks
4. **Audit Logs**: Log important operations for debugging

The database schema provides a robust foundation for the AI Advisor Chat application, supporting real-time functionality, marketplace features, and secure user data management.