# Implementation plan: Multi-advisor Chat + Convex Migration

This concise plan breaks the work into three phases and lists immediate next actions.

## Phase 0 — Research

- Confirm Convex suitability and whether LLM inference runs in Convex actions or a Node worker fallback.
- Confirm image upload provider (UploadThing recommended) and integration approach.
- Decide migration approach for seeded data (seed-from-JSON) and strategy for user-generated data.

## Phase 1 — Design & infra

- Map Prisma models to Convex collections and document indexes (see `data-model.md`).
- Implement Convex actions for queries and mutations used by the frontend (auth helpers, advisor CRUD, conversation CRUD, message append, thread summary builder).
- Implement an idempotent seed script that imports `prisma/advisors/*.json` and writes `legacyId`.

## Phase 2 — Implementation & rollout

- Wire Clerk sign-in to ensure Convex `users` documents are created/updated.
- Implement advisor CRUD UI and multi-step form.
- Update chat UI to allow selecting multiple advisors and support per-advisor streaming responses (Convex subscriptions preferred; Node SSE fallback supported).
- Add tests (unit + integration), stage deployment, run seed script in staging, verify behavior, and plan production cutover and rollback.

## Rollout checklist

1. Deploy Convex collections + actions to staging.
2. Run seed script in staging and run integration tests.
3. Switch frontend to Convex endpoints in staging and verify behavior.
4. Plan and run production migration during a low-traffic window; keep Prisma read-only snapshot until verified.

## Rollback

- If migration has issues, switch frontend back to Prisma endpoints (read-only snapshot) and revert traffic.

## Next actions (short-term)

1. Prototype Convex action for createConversation + appendMessage and confirm subscriptions.
2. Prototype UploadThing avatar upload + Convex document write.
3. Implement seed script interface and import `prisma/advisors/*.json` into Convex.
4. Generate `tasks.md` from Phase 1 artifacts and begin Phase 2 implementation.
