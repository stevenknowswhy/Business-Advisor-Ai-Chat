# Data model: Prisma → Convex mapping

This document maps the current Prisma/Postgres models to Convex collections and suggests denormalization and indexes.

## Key Convex collections

- users
- advisors
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

Example document:

```json
{
  "id": "convex_advisor_<uuid>",
  "legacyId": "<prisma_advisor_id>",
  "ownerId": "convex_user_<uuid>",
  "name": "Growth Advisor",
  "persona": { /* persona JSON */ },
  "modelHint": "gpt-4o-mini",
  "imageUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Index suggestions:

- ownerId
- legacyId
- name (text)

### conversations

Example document:

```json
{
  "id": "convex_conv_<uuid>",
  "ownerId": "convex_user_<uuid>",
  "title": "Q2 planning",
  "advisorIds": ["convex_advisor_x","convex_advisor_y"],
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

## Migration notes

- For seeded advisors, import from `prisma/advisors/*.json` and write `legacyId` to Convex documents to preserve references.
- For user-generated data, plan a staged migration or write-through synchronization if a direct export/import is not feasible.

## Queries & Actions to implement

- getUserByClerkId(clerkId)
- listAdvisorsForUser(userId)
- createConversation(ownerId, advisorIds)
- appendMessage(conversationId, message)
- streamAssistantResponse(conversationId, advisorId, partialChunks)
- createThreadSummary(conversationId)
