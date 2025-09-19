# Feature spec: Advisor Marketplace + Multi-advisor Chat

## Overview

This feature implements an Advisor Marketplace where users discover, select, and manage AI advisors, then chat with them in a Teams-like interface. The core architectural change replaces sidebar-based advisor selection with a comprehensive marketplace system featuring two main tabs: **Marketplace** (discover and add advisors) and **My Advisors** (manage selected advisors). Selected advisors become available for chat functionality. The project uses Convex for real-time data management and supports configurable LLM backends with per-advisor model selection.

## Primary goals

- **Advisor Marketplace System**: Replace sidebar-based advisor selection with a comprehensive marketplace featuring:
  - **Marketplace Tab**: Discover and add advisors with "Create Your Own Advisor" (top priority), "One-Click Team Creation", and "Individual Advisors" sections
  - **My Advisors Tab**: Manage selected advisors that become available for chat functionality

- **Enhanced Advisor Management**:
  - Create advisors via persona JSON upload or multi-step form
  - One-click team creation spawning complete advisor teams (3-5 advisors)
  - Advisor selection/deselection with persistent user preferences

- **Teams-like Chat Interface**: Multi-advisor conversations with selected advisors only, maintaining existing chat functionality while integrating with the new marketplace system.

- **Per-advisor LLM Configuration**: Configurable LLM selection with fallback to global models, supporting subscription-based model access gating.

- **Convex-powered Real-time Features**: Leverage Convex for real-time advisor selection, marketplace updates, and chat functionality with full feature parity from previous Prisma implementation.

## Users & Personas

- **End User**: Registers/logs in via Clerk (Google, Microsoft, email), discovers advisors in the marketplace, selects advisors for their personal advisory board, creates custom advisors, and chats with selected advisors in real-time. Manages subscription tiers affecting available features.

- **New User**: Starts with empty advisor selection, guided through marketplace to build their advisory board via individual selection or team creation.

- **Existing User**: Seamlessly migrated with current advisors auto-selected, can discover and add new advisors via marketplace.

- **Admin/Owner**: Manages marketplace content, moderates public advisors, and maintains team templates (optional).

## Main flows (happy path)

1. **Sign up & Onboarding**
   - User signs up via Clerk (Google / Microsoft / email)
   - User plan reflected in `User.plan` (free|base|premium)
   - New users directed to marketplace for advisor selection
   - Existing users see current advisors auto-selected in "My Advisors"

2. **Advisor Discovery & Selection (Marketplace Tab)**
   - **Create Your Own Advisor**: Prominent CTA leading to advisor creation (persona JSON upload or multi-step form)
   - **One-Click Team Creation**: Select predefined teams (Startup Founding Team, Marketing Dream Team, etc.) that bulk-add 3-5 related advisors
   - **Individual Advisors**: Browse marketplace of available advisors with search/filter, select individual advisors to add to personal advisory board

3. **Advisor Management (My Advisors Tab)**
   - View all selected advisors in grid/list format
   - Remove advisors from selection
   - These selected advisors become available in chat interface
   - Empty state guidance if no advisors selected

4. **Chat Experience**
   - Chat interface shows only selected advisors in sidebar
   - User creates conversations and selects from their chosen advisors
   - Multi-advisor conversations supported as before
   - Marketplace navigation available from chat interface

5. **Streaming & Persistence**
   - Chat functionality unchanged: streaming responses, message persistence, thread summaries
   - LLM model selection per advisor with subscription-based gating
   - Real-time updates via Convex subscriptions

## Non-goals / out of scope (initial)

- Full moderation & review workflows (post-launch enhancement).

- Advanced analytics and billing integration beyond basic Clerk plan gating.

## Acceptance criteria

1. **Marketplace System**: Users can access advisor marketplace with two functional tabs (Marketplace/My Advisors) and navigate between marketplace and chat interface.

2. **Advisor Selection**: Users can select/deselect individual advisors and use one-click team creation to bulk-add advisor teams to their personal advisory board.

3. **Create Your Own Advisor**: Prominent "Create Your Own Advisor" functionality accessible from marketplace with persona JSON upload and multi-step form options.

4. **Chat Integration**: Chat interface shows only user's selected advisors in sidebar, with empty state handling when no advisors selected.

5. **Data Persistence**: User advisor selections persist in Convex with proper user association, supporting multiple users selecting the same marketplace advisors.

6. **Team Templates**: Predefined team templates (Startup, Marketing, etc.) function correctly for one-click bulk advisor selection.

7. **Migration Compatibility**: Existing users seamlessly transition with current advisors auto-selected, maintaining all existing chat functionality.

8. **Real-time Updates**: Advisor selection/deselection reflects immediately in chat interface via Convex subscriptions.

## Technical constraints and notes

- **Advisor Selection Architecture**: Implement userAdvisors junction table in Convex to track user-advisor relationships, enabling multiple users to select the same marketplace advisors while maintaining individual selections.

- **Marketplace Data Model**: Distinguish between "marketplace advisors" (available for selection) and "selected advisors" (user's personal advisory board). Support team templates as predefined advisor groupings.

- **Migration Strategy**: Auto-select existing user advisors during migration to maintain backward compatibility. Implement feature flags for gradual marketplace rollout.

- **Real-time Updates**: Leverage Convex subscriptions for marketplace and advisor selection state changes. Maintain existing SSE streaming for chat where needed.

- **Component Architecture**: Create new marketplace components while preserving existing chat interface. Modify AdvisorRail to filter by selected advisors only.

- **LLM Integration**: Maintain existing model selection/fallbacks in `src/server/llm/openrouter.ts` with subscription-based access gating.

- **Image Storage**: Continue using UploadThing for advisor profile images and team template icons.

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


## Detailed Specs: Multi-step Advisor Wizard

Goals: Replace raw JSON modal with an accessible, guided creation flow.

- Steps and content
  - Step 1: Identity — name, title, one-liner, avatar (UploadThing), tags
  - Step 2: Expertise — specialties, expertise, personality traits (chips)
  - Step 3: Role — mission, scope (in/out), KPIs, advice style/voice
  - Step 4: Review — live JSON preview, import/export JSON, final validation
- Validation
  - Zod schemas shared with server; per-step validation and error summaries
  - On invalid submit, focus the first errored field; aria-live for errors
- UX & A11y
  - Stepper with progress indication; aria-current on active step
  - Keyboard navigation (Tab/Shift+Tab; Enter to continue); visible focus rings
  - All icon-only buttons include title attributes; form fields labeled via aria-label/title/placeholder per WCAG 2.1 AA
- Data persistence
  - Draft saved to localStorage with versioning; clear on success
- Integration
  - Submit calls advisors.uploadAdvisorJSON; on success navigate to advisor details

Acceptance criteria (Wizard)

- User can complete all steps with keyboard only
- Live JSON preview reflects form state; import validates and maps into form
- Server rejects invalid payloads with mirrored Zod messages
- Axe-core checks pass on Wizard (WCAG 2.1 AA)

## Detailed Specs: One-Click Team Creation

Goals: Enable users to spawn a complete advisor team in one click.

- Templates
  - Versioned team templates (startup-squad, life-coach, college-prep) defined in code; each includes advisorsBlueprint array
  - Created advisors persist templateId/version in metadata; userAdvisors records include teamKey
- UI/Flow
  - Team cards with name, description, icon, advisor count
  - Bulk modal lists advisors with checkboxes and optional rename/title fields
  - Progress and result summary; toast notifications on completion
- Backend
  - teams.createFromTemplate(templateId) action validates auth, spawns advisors, returns advisorIds
  - Idempotency key support and rate limiting; telemetry (count, duration)

Acceptance criteria (Teams)

- Clicking a team creates 3–5 advisors; success toast shows count
- Optional deselection respected; renamed titles persisted
- Created advisors appear in My Advisors immediately (real-time)
- userAdvisors entries contain source=team and teamKey

## Engineering Constraints & Best Practices (Wizard + Teams)

- Convex React: use built-in skip parameter rather than conditional hook calls to satisfy Rules of Hooks
- Shared validation: maintain single source of truth Zod schemas; keep server validation in lockstep
- Accessibility: ensure color contrast, focus management, and semantic landmarks
- Performance: paginate marketplace data; prefetch team templates; avoid blocking rendering during uploads
- Security: Clerk JWT template named "convex"; verify ownerId on all mutations
