# Feature spec: Multi-advisor Chat + Convex Migration

## Overview

This feature implements an Advisor Chat product where users can create and manage multiple AI advisors and chat with them in a Teams-like interface. Advisors are configurable (persona JSON or multi-step form), have an optional profile image, and each advisor is backed by a configurable LLM with a per-advisor model fallback to a global model. The project is currently migrating the database from PostgreSQL/Prisma to Convex; this spec covers the product-level behavior and the migration context.

## Primary goals

- Provide a Teams-like chat interface where a user can have multiple advisors concurrently available and can chat with one or multiple advisors in the same conversation.

- Allow users to create and manage advisors via:
  - Uploading a persona JSON file
  - A multi-step form (not yet implemented) that collects persona, roleDefinition, components, localization, tags, and an optional image

- Per-advisor LLM selection with fallback to a global model if the advisor model is unavailable.

- Support subscription tiers reflected via Clerk (free/base/premium), gating model access.

- Complete Convex migration: replace Prisma-based persistence with Convex tables/functions while maintaining feature parity (conversations, messages, advisors, memories, summaries, user plan sync).

- Provide a marketing website (separate) that includes standard pages (Home, Features, FAQ, Contact, Blog) and links to the app.

## Users & Personas

- End user: can register/login (Google, Microsoft, email) and manage subscription via Clerk. They can create advisors, start conversations, and chat in real-time.

- Admin/Owner: manages site content on the marketing site and may moderate advisors (optional).

## Main flows (happy path)

1. Sign up & Login

   - User signs up via Clerk (Google / Microsoft / email).
   - User plan is reflected in `User.plan` (free|base|premium).

2. Create Advisor (two options)

   - Upload persona JSON: user chooses a JSON file (validated against example persona shape) and uploads; server seeds the advisor into the DB.
   - Multi-step form: user walks through steps to supply advisor name, persona prompts, roleDefinition, capabilities, tags, and upload an image. On submit, the advisor is created.

3. Start Conversation

   - User creates a conversation (title optional).
   - User selects active advisors (one or multiple). UI shows advisor rail like Teams where multiple advisors are present.

4. Chat & Streaming

   - User sends message. The message is saved as a `Message` with sender=user and includes mentions and metadata.

   - For each selected advisor, server chooses advisor model (getModelForTier + advisor.modelHint) and streams the LLM response back (SSE). Each token chunk is saved incrementally as a `Message` from advisor with partial content updates.

   - If advisor model fails/unavailable, fallback to global model list (as configured in OpenRouter fallbacks).

5. Persist & Summarize

   - Messages, memories, and thread summaries persist. ThreadSummary creation may run as a background job triggered after conversation length thresholds.

## Non-goals / out of scope (initial)

- Full moderation & review workflows (post-launch enhancement).

- Advanced analytics and billing integration beyond basic Clerk plan gating.

## Acceptance criteria

1. Users can sign up and log in via Clerk (Google/Microsoft/email) and have `User.plan` available in the DB.
2. Users can create advisors by uploading persona JSON; validation errors return useful messages.
3. The chat UI allows selecting multiple advisors and shows streaming responses per-advisor.
4. Messages, conversations, advisors, memories, and summaries persist in Convex tables once migration is complete.
5. Per-advisor LLM selection occurs and falls back to global models when needed.
6. Marketing site skeleton exists with pages: Home, Features, FAQ, Contact, Blog and links to the app.

## Technical constraints and notes

- Convex migration: we must map Prisma models to Convex tables and implement Convex functions for queries and mutations used by the frontend. Migration strategy should include a seed path using `prisma/advisors/*.json` as source.

- Streaming chat currently uses SSE (Node runtime required for Prisma). When on Convex, prefer Convex subscriptions where possible; otherwise keep Node streaming endpoints that read/write Convex functions/actions.

- LLM integration: centralize model selection/fallbacks in `src/server/llm/openrouter.ts` (or a Convex action wrapper). Use `OPENROUTER_*` env vars for model hints.

- Image uploads: UploadThing recommended for profile images (see `research.md` for rationale and integration notes).

## Deliverables

- `specs/001-spec-init/research.md` (Phase 0)
- `specs/001-spec-init/plan.md` (created)
- `specs/001-spec-init/data-model.md` (Phase 1)
- `specs/001-spec-init/tasks.md` (Phase 2)
- `specs/001-spec-init/quickstart.md`

## Open questions (for research.md)

1. Which image storage provider will we use for large assets (UploadThing, S3, Vercel Blob, Cloudinary)? Costs and signed URLs needed.
2. Should LLM inference be performed inside Convex actions or kept in Node functions that call Convex for persistence?
3. Migration approach: export Postgres data vs seed from JSON; how to preserve IDs and references?
4. What subscription fields in Clerk should map to `User.plan` (public metadata shape)?

## Next steps

1. Run Phase 0: finalize `research.md` and confirm UploadThing integration.
2. Run Phase 1: produce `data-model.md` mapping Prisma models → Convex tables.
3. Generate `tasks.md` (Phase 2) and begin implementation tasks (auth wiring, advisor CRUD, multi-step form, streaming chat).
