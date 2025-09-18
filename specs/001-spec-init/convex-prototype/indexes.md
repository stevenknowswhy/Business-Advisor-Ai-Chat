Convex indexes and collection instructions

Recommended collections and indexes (create in Convex admin or via migration tooling):

- Collection: users
  - Index: clerkId (unique)
  - Index: legacyId (optional)

- Collection: advisors
  - Index: legacyId (unique)
  - Index: ownerId
  - Index: name (text search)

- Collection: conversations
  - Index: ownerId
  - Index: advisorIds (multi-value)

- Collection: messages
  - Index: conversationId
  - Index: createdAt

- Collection: advisorMemories
  - Index: advisorId

- Collection: threadSummaries
  - Index: conversationId


Notes:

- Convex indexing and admin UI may differ by version; adapt names/types accordingly.
- Create compound indexes if you need combined filters (e.g., conversationId + createdAt).
