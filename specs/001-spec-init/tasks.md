# Tasks: Multi-advisor Chat + Convex Migration

This document lists prioritized tasks for the feature implementation. Tasks are grouped by phase.

## Phase 0 (research)

- Prototype Convex action for creating Conversations and writing Messages.
- Prototype UploadThing integration for avatar uploads.
- Prototype Node streaming fallback that writes partial messages to Convex.

## Phase 1 (data model & infra)

- Create Convex collections: users, advisors, conversations, messages, advisorMemories, threadSummaries.
- Implement Convex actions:
  - auth helpers (getUserByClerkId, ensureUser)
  - advisor CRUD (create/update/delete)
  - conversation CRUD (create/list)
  - message append/stream write
  - thread summary creator
- Implement seed script to import `prisma/advisors/*.json` into Convex (idempotent, writes legacyId).

## Phase 2 (app changes)

- Wire Clerk sign-in to ensure Convex `users` documents created/updated.
- Implement advisor CRUD UI and multi-step form.
- Implement chat UI changes to allow selecting multiple advisors per conversation.
- Implement streaming UI per-advisor (Convex subscriptions preferred; Node SSE fallback supported).
- Add thread summary triggers (background Convex action or scheduled job).

## Phase 3 (tests & rollout)

- Add unit + integration tests for Convex actions and streaming.
- Stage deployment and run seed script in staging.
- Verify UI behavior in staging and run integration tests.
- Plan production migration and rollback.

## Low-risk extras

- Add telemetry events for advisor creation, conversation creation, and model-fallback occurrences.
- Add admin dashboard to inspect Convex collections (read-only).
