# Data model: Advisor Marketplace + Convex Schema

This document defines the Convex data model for the Advisor Marketplace system, including user advisor selections, team templates, and existing chat functionality.

## Key Convex collections

- users
- advisors
- **userAdvisors** (NEW - junction table for advisor selections)
- **teamTemplates** (NEW - predefined advisor teams)
- conversations
- messages
- advisorMemories
- threadSummaries

### users

Example document:

```json
{
  "id": "convex_user_<uuid>",
  "legacyId": "<prisma_user_id>",
  "email": "user@example.com",
  "name": "Jane Dev",
  "plan": "free",
  "clerkId": "clerk_abc123",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Index suggestions:

- clerkId (unique)
- legacyId (unique)

### advisors

Stores all advisor data. Advisors can be:
- User-created (ownerId set to creating user)
- Marketplace/public advisors (ownerId null or system user)
- Seeded advisors from migration

Example document:

```json
{
  "id": "convex_advisor_<uuid>",
  "legacyId": "<prisma_advisor_id>",
  "ownerId": "convex_user_<uuid>", // null for marketplace advisors
  "name": "Growth Advisor",
  "persona": { /* persona JSON */ },
  "modelHint": "gpt-4o-mini",
  "imageUrl": "https://...",
  "isPublic": true, // true for marketplace advisors
  "featured": false, // true for featured marketplace advisors
  "category": "business", // "business", "marketing", "technical", etc.
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Index suggestions:

- ownerId
- legacyId
- isPublic
- featured
- category
- name (text)

### userAdvisors (NEW)

Junction table tracking which advisors each user has selected for their personal advisory board. Only selected advisors appear in chat interface.

Example document:

```json
{
  "id": "convex_useradv_<uuid>",
  "userId": "convex_user_<uuid>",
  "advisorId": "convex_advisor_<uuid>",
  "selectedAt": "2024-01-01T00:00:00.000Z",
  "source": "marketplace|team|migration", // how advisor was selected
  "teamId": "startup-founding-team" // if selected via team creation
}
```

Index suggestions:

- userId (primary query pattern)
- advisorId (for advisor usage analytics)
- userId + advisorId (unique constraint)
- teamId (for team-based queries)

### teamTemplates (NEW)

Predefined advisor teams for one-click selection.

Example document:

```json
{
  "id": "startup-founding-team",
  "name": "Startup Founding Team",
  "description": "Complete advisory board for early-stage startups",
  "category": "startup",
  "advisorIds": ["ceo-advisor", "cto-advisor", "cmo-advisor", "cfo-advisor"],
  "icon": "https://...",
  "featured": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Index suggestions:

- category
- featured
- name (text)

### conversations

Example document:

```json
{
  "id": "convex_conv_<uuid>",
  "ownerId": "convex_user_<uuid>",
  "title": "Q2 planning",
  "advisorIds": ["convex_advisor_x","convex_advisor_y"], // must be subset of user's selected advisors
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Index suggestions:

- ownerId
- advisorIds (for filtering by advisor involvement)

### messages

Example document:

```json
{
  "id": "convex_msg_<uuid>",
  "conversationId": "convex_conv_<uuid>",
  "senderId": "convex_user_<uuid> | convex_advisor_<uuid>",
  "role": "user|assistant|system",
  "content": "...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "partial": false
}
```

Index suggestions:

- conversationId
- createdAt

### advisorMemories

Store per-advisor memory entries linked to conversations or global advisor context.

```json
{
  "id": "convex_mem_<uuid>",
  "advisorId": "convex_advisor_<uuid>",
  "userId": "convex_user_<uuid>",
  "source": "conversation|manual",
  "content": "...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### threadSummaries

Store precomputed summaries for conversation threads.

```json
{
  "id": "convex_sum_<uuid>",
  "conversationId": "convex_conv_<uuid>",
  "summary": "...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Migration Strategy

**Existing User Migration:**
- Auto-create userAdvisors entries for all advisors existing users have interacted with
- Preserve all existing chat functionality and conversation history
- Mark migrated selections with `source: "migration"`

**Advisor Data Migration:**
- Import seeded advisors from `prisma/advisors/*.json` with `legacyId` preservation
- Mark appropriate advisors as `isPublic: true` for marketplace visibility
- Set up featured advisors for marketplace homepage

**Team Template Setup:**
- Create initial team templates with references to migrated advisor IDs
- Validate team advisor references during deployment

## New Convex Functions

**Advisor Selection Management:**
- `getUserSelectedAdvisors(userId)` - Get user's selected advisors for chat interface
- `selectAdvisor(userId, advisorId, source?)` - Add advisor to user's selection
- `unselectAdvisor(userId, advisorId)` - Remove advisor from user's selection
- `selectTeam(userId, teamId)` - Bulk select all advisors from a team template

**Marketplace Queries:**
- `getMarketplaceAdvisors(category?, featured?)` - Get public advisors for marketplace
- `getTeamTemplates(category?, featured?)` - Get available team templates
- `searchAdvisors(query, filters)` - Search marketplace advisors

**Enhanced Existing Functions:**
- `listAdvisorsForUser(userId)` - Modified to return only selected advisors
- `createConversation(ownerId, advisorIds)` - Validate advisorIds are in user's selected advisors
- `getUserByClerkId(clerkId)` - Unchanged
- `appendMessage(conversationId, message)` - Unchanged
- `streamAssistantResponse(conversationId, advisorId, partialChunks)` - Unchanged
- `createThreadSummary(conversationId)` - Unchanged


## Updates for Wizard & One-Click Teams (Delta)

This section refines the advisor and team data to support the multi-step Advisor Wizard and One-Click Team Creation while remaining compatible with existing Convex collections and Clerk auth.

### Advisor document schema (expanded)

Example document (fields beyond prior example):

```json
{
  "id": "convex_advisor_<uuid>",
  "ownerId": "convex_user_<uuid>",
  "isPublic": true,
  "featured": false,
  "category": "business",
  "persona": {
    "name": "The Visionary",
    "title": "Big-Picture Strategist",
    "description": "Optimistic, product-obsessed...",
    "imageUrl": "https://...",
    "specialties": ["market disruption", "user love"],
    "expertise": ["product", "strategy"],
    "personality": ["optimistic", "bold"]
  },
  "roleDefinition": {
    "mission": "Ensure every idea disrupts the market and creates user love.",
    "scope": { "inScope": ["vision"], "outOfScope": ["daily ops"] },
    "kpis": ["retention", "activation"]
  },
  "adviceDelivery": {
    "mode": "coach → propose → refine",
    "formality": "casual",
    "voiceGuidelines": ["enthusiastic", "visionary tone"]
  },
  "tags": ["startup", "product"],
  "metadata": {
    "handle": "the-visionary",              // unique per owner
    "templateId": "startup-squad",           // if created from template
    "templateVersion": "1.0.0",
    "source": "marketplace|team|custom|migration"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Index suggestions (add):

- advisors.by_owner_handle (compound: ownerId + metadata.handle, unique)
- advisors.by_public (isPublic, featured, category)
- advisors.by_template (metadata.templateId)

### userAdvisors (clarified)

Add fields to improve auditability for team creation and wizard origin:

```json
{
  "id": "convex_useradv_<uuid>",
  "userId": "convex_user_<uuid>",
  "advisorId": "convex_advisor_<uuid>",
  "selectedAt": "2024-01-01T00:00:00.000Z",
  "source": "marketplace|team|migration|custom",
  "teamKey": "startup-squad",                 // replaces generic teamId for template-origin
  "createdFromTemplateId": "startup-squad",
  "createdFromTemplateVersion": "1.0.0"
}
```

Index suggestions (add):

- userAdvisors.by_user_advisor (unique: userId + advisorId)
- userAdvisors.by_user_team (userId + teamKey)

### teamTemplates (blueprint support)

In addition to referencing existing advisorIds, support “blueprint” templates that contain minimal Advisor JSON to spawn new advisors with one click.

Blueprint example:

```json
{
  "id": "startup-squad",
  "name": "The Startup Squad",
  "description": "Stress-test a business idea from every angle.",
  "category": "startup",
  "featured": true,
  "icon": "https://.../startup.png",
  "version": "1.0.0",
  "advisorsBlueprint": [
    {
      "persona": { "name": "The Visionary", "title": "Product & Mission" },
      "roleDefinition": { "mission": "Push toward category-defining future." },
      "tags": ["startup", "vision"]
    },
    { "persona": { "name": "The Analyst", "title": "Market & Economics" }, "tags": ["finance"] }
  ]
}
```

Notes:

- Start with code-defined templates; optionally mirror into Convex for admin management later.
- When spawning advisors from a blueprint, persist templateId/version in created advisors.metadata and in userAdvisors as shown above.

### Validation schemas (for Wizard + server)

Use shared Zod types for advisor JSON. Mirror client schemas in Convex actions for server-side validation consistency. Keep schemas under `src/features/advisors/forms/schemas.ts` and import into Convex via a lightweight validator (duplicate or generate types for server).
