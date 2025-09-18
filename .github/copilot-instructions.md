<!-- .github/copilot-instructions.md - guidance for AI coding agents working in this repo -->
# Quick orientation for AI coding agents

Read this before making code changes. It contains the small, repo-specific facts that let an AI agent make useful, low-risk edits.

- Project layout: this workspace contains multiple related apps. The most active app is `ai-advisor-chat/` (Next.js + Prisma). There's also `ai-advisor-app/` and a `ai-advisor-monorepo/` containing shared packages. Work in the `ai-advisor-chat/` folder unless the task explicitly targets another subproject.

- Big picture: `ai-advisor-chat` is a Next.js (App Router) frontend with a Node runtime backend using Prisma + Neon Postgres. Chat streaming uses Server-Sent Events and OpenRouter as the LLM provider. Authentication uses Clerk. Key data models live in `prisma/schema.prisma` (User, Advisor, Conversation, Message, AdvisorMemory, ThreadSummary).

- DB client pattern: use the singleton exported from `ai-advisor-chat/src/server/db.ts` (named `db` / `prisma` in other apps). In dev the repo keeps the Prisma client on `globalThis` to avoid duplicated connections.

- Seeding / personas: advisors are seeded from JSON files in `prisma/advisors/` via `prisma/seed.ts`. Typical developer flow: `npm run db:push` then `npm run db:seed` (or `npx prisma db push` / `npx prisma db seed`). When adding/adapting personas, add/update JSON files under `prisma/advisors/` and update the seed file if needed.

- LLM integration: model routing and fallbacks are implemented in `ai-advisor-chat/src/server/llm/openrouter.ts`. Prefer changing tier logic here for model selection (functions: `getModelForTier`, `getModelWithFallback`, and `MODEL_FALLBACKS`). Do not hardcode API keys—read from `env` via `~/env`.

- Runtime constraints: Prisma requires a Node runtime; streaming chat endpoints may be Node-only (see notes in `Predevelopment.md`). If converting handlers to the Edge runtime, adjust DB usage (Drizzle or a HTTP-capable Neon driver is suggested) and move Prisma operations out of edge functions.

- Scripts & quick commands (ai-advisor-chat):
  - dev: `npm run dev` — start Next.js dev server (Turbopack)
  - seed DB: `npm run db:push` then `npm run db:seed` (or `npx prisma db push && npx prisma db seed`)
  - tests: `npm test` (Jest) and `npm run test:ci` for CI
  - lint & typecheck: `npm run check`

- Testing notes: unit/e2e tests live under `tests/` in some apps and use Jest. The project uses `cross-env NODE_OPTIONS=--experimental-vm-modules` for tests; preserve that environment when running tests.

- Conventions and patterns observed:
  - TypeScript strict mode is enforced; prefer explicit types when touching public APIs.
  - Zod is used for input validation near API boundaries; keep validations colocated with route handlers.
  - Persona/advisor objects are stored as JSON in Prisma `Advisor.persona`. When editing advisor shapes, update seed JSON and any schema versioning logic.
  - Server-side LLM calls centralize through `src/server/llm/*`. Add retries/fallbacks there rather than in the UI.

- Integration points to be careful with:
  - Clerk authentication: user plan is read from Clerk public metadata and mirrored in Prisma `User.plan` (see `Predevelopment.md`). Changing auth flow requires updating sync points.
  - Streaming chat: SSE endpoints write messages to the database as they stream. Keep message creation and conversation updates consistent to avoid UI desync.

- Small rules for low-risk contributions:
  1. Update or run `npm run format:write` if you modify code formatting.
  2. Run `npm run check` locally before pushing to ensure lint/type safety.
  3. When modifying database models, update `prisma/schema.prisma`, run `npx prisma db push`, and update `prisma/seed.ts` and `prisma/advisors/*` if relevant.
  4. Put changes in the appropriate package/app folder and don't modify other apps unless needed.

- Files worth referencing when changing behavior:
  - `ai-advisor-chat/prisma/schema.prisma` (data model)
  - `ai-advisor-chat/prisma/seed.ts` + `prisma/advisors/*.json` (seed/persona)
  - `ai-advisor-chat/src/server/db.ts` (Prisma client singleton)
  - `ai-advisor-chat/src/server/llm/openrouter.ts` (model selection / fallbacks)
  - `ai-advisor-chat/src/app` and `src/components` for UI patterns and accessibility-first approach

If anything here is unclear or you'd like more details about a particular subsystem (streaming chat, persona JSON shape, or the Clerk sync), tell me which area and I'll expand this file.
