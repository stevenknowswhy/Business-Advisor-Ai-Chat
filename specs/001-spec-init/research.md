# Research: Multi-advisor Chat + Convex Migration

This research document captures decisions and trade-offs for Phase 0: choosing Convex for persistence and realtime, selecting an image upload provider, and deciding where LLM inference should run.

## Convex evaluation

- Convex offers document-style persistence, actions (server-side functions), and realtime subscriptions. It fits the chat app model where conversations, messages, and advisor documents map naturally to collections.

- Pros:
  - Built-in realtime subscriptions for streaming UI.
  - Simpler developer UX for serverless actions.
  - Lower operational overhead vs managing Postgres for realtime workloads.

- Cons / Caveats:
  - Convex has different indexing and query semantics than Postgres; some queries will need redesign or denormalization.
  - Long-running streaming or very large LLM responses may require a Node worker fallback (for token-by-token SSE) because Convex action time limits exist.

## LLM inference placement

- Option A: Run inference inside Convex actions.
  - Simpler end-to-end: a Convex action receives user input, calls the LLM provider, saves messages, and returns streaming updates via subscriptions.
  - Risk: action time limits and execution environment constraints. Not ideal for long-lived streams.

- Option B: Run inference in a Node worker (current app runtime) and write results to Convex.
  - Pros: can handle long-lived SSE streams and external SDKs not available in Convex.
  - Cons: adds operational complexity and requires bridging writes to Convex.

- Recommendation: Prefer Convex actions for quick/short responses; provide a Node streaming fallback for long-running streams or when using streaming SDKs that require Node.

## Image upload provider

- Evaluated options: UploadThing, S3 (presigned), Vercel Blob, Cloudinary.

- Recommendation: Use UploadThing for user profile images and advisor avatar uploads.
  - Rationale: UploadThing offers secure signed uploads, integrates well with Next.js, and reduces server-side upload handling. It also supports direct-to-cloud uploads and signed callback webhooks.

## Migration approach

- Two viable migration strategies:
  1. Seed-from-JSON: Reuse `prisma/advisors/*.json` as the canonical source for advisors. Create a Convex seed script that imports JSON files and writes `legacyId` (Prisma/UUID) to each Convex document.
  2. Export/import: Export Postgres tables and import into Convex using a transform script. This preserves exact IDs and relationships but is more complex.

- Recommendation: Start with Seed-from-JSON for advisors and critical seeded data (safe, idempotent). For user-generated data, consider a staged migration (read-only fallback) or write-through synchronization during cutover.

## Clerk & plan mapping

- Keep Clerk as the auth provider. Mirror `User.plan` into Convex user documents on sign-in and via webhook sync.

- Ensure plan gating logic uses the Convex `User.plan` value for model tier selection and feature access.

## UploadThing integration notes

- Use UploadThing client on the frontend to upload advisor avatars directly to the storage provider.
- After upload, store the returned file URL/metadata in the advisor document in Convex.
- Consider thumbnailing or size limits on upload to reduce storage costs.

## Next research steps

1. Prototype a Convex action that creates a Conversation and writes messages; confirm subscription behavior.
2. Prototype UploadThing avatar upload + Convex document write.
3. Prototype a Node streaming fallback that writes partial messages to Convex for long responses.
