Convex functions for AI Advisor prototype

Indexes to create (Convex UI or CLI):

- advisors: index on `legacyId` (unique-ish) -> name: `legacyId`
- messages: index on `conversationId` -> name: `byConversation`
- conversations: optional index on `ownerId` for listing by user

Deployment:

1. Ensure `CONVEX_URL` and `CONVEX_KEY` are exported in your shell.
2. In this folder run `npm install` to install `@convex-dev/convex`.
3. Run `npm run deploy` to publish functions from `./functions`.

After deploy, run the seed script from the prototype to upsert advisors into the Convex project.
