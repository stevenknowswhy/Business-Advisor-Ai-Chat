Deploying Convex functions (guidance)

This document explains how to deploy the server-side functions used by the seed and runtime.

Recommended functions to add to your Convex project (names used by `convexClient`/seed):

- upsertAdvisor
- createConversation
- appendMessage
- listMessagesForConversation

Example server-side function (Convex v1+ pseudocode) — adapt to your Convex SDK:

```js
// functions/upsertAdvisor.js
import { v4 as uuidv4 } from 'uuid';

export default async function upsertAdvisor(ctx, advisor) {
  const db = ctx.db; // depends on SDK
  if (advisor.legacyId) {
    const found = await db.table('advisors').getIndex('legacyId').get(advisor.legacyId);
    if (found) {
      return db.table('advisors').update(found._id, { ...advisor, updatedAt: new Date().toISOString() });
    }
  }
  const id = uuidv4();
  return db.table('advisors').insert({ ...advisor, id, createdAt: new Date().toISOString() });
}
```

Index setup

- Create indexes as described in `indexes.md`.

How to deploy

1. Create a Convex project (follow Convex docs).
2. Add the functions above into the project functions directory.
3. Deploy using the Convex CLI (see Convex docs for exact commands).
4. Obtain `CONVEX_URL` and `CONVEX_KEY` for the HTTP client and set them in the environment where you run `seed.js`.

Once deployed and credentials are set, `convexClient` will use the real Convex HTTP client and `seed.js` will call `upsertAdvisor` mutations.
