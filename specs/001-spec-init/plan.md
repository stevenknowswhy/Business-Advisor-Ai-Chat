# Implementation plan: Advisor Marketplace System

This plan implements the Advisor Marketplace feature in four phases, replacing sidebar-based advisor selection with a comprehensive marketplace system.

## Phase 1 — Foundation & Data Model (Week 1-2)

**Backend Infrastructure:**
- Add `userAdvisors` junction table to Convex schema for tracking user advisor selections
- Create team templates configuration (startup team, marketing team, etc.)
- Implement core Convex functions:
  - `getUserSelectedAdvisors(userId)` - Get user's selected advisors
  - `selectAdvisor(userId, advisorId)` - Add advisor to user's selection
  - `unselectAdvisor(userId, advisorId)` - Remove advisor from user's selection
  - `getMarketplaceAdvisors()` - Get public/featured advisors for marketplace
  - `selectTeam(userId, teamId)` - Bulk select team advisors
- Migration script to auto-select existing user advisors for backward compatibility

**Testing & Validation:**
- Unit tests for new Convex functions
- Data migration validation
- Performance testing for advisor selection queries

## Phase 2 — Marketplace UI Core (Week 3-4)

**Marketplace Components:**
- Create `/marketplace` route and main marketplace page
- Build `AdvisorMarketplace` container component with tab navigation
- Implement `MarketplaceTab` with three sections:
  - "Create Your Own Advisor" prominent CTA section
  - "One-Click Team Creation" with predefined team cards
  - "Individual Advisors" browseable grid with search/filter
- Build `MyAdvisorsTab` for managing selected advisors
- Create `AdvisorCard` component for marketplace display
- Implement advisor selection/deselection functionality

**Team Creation Feature:**
- Team template UI with preview and confirmation
- Bulk advisor selection with progress feedback
- Team customization (add/remove advisors before confirming)

## Phase 3 — Chat Integration (Week 5)

**Chat Interface Updates:**
- Modify `AdvisorRail` to show only selected advisors (remove "Add New Advisor" button)
- Update `ChatInterface` with marketplace navigation link/button
- Implement empty state handling when no advisors selected
- Add "Get Started" flow directing new users to marketplace
- Ensure real-time updates when advisors are selected/deselected

**Navigation & UX:**
- Seamless navigation between chat and marketplace
- Preserve chat state when switching to marketplace
- Mobile-responsive marketplace interface
- Loading states and error handling

## Phase 4 — Polish & Enhanced Features (Week 6)

**Enhanced Marketplace:**
- Advanced search and filtering (by tags, categories, expertise)
- Advisor recommendations based on user activity
- Advisor categories and organization
- Performance optimization for large advisor catalogs

**Analytics & Monitoring:**
- Track advisor selection patterns
- Monitor marketplace usage metrics
- A/B testing framework for marketplace features
- User onboarding analytics

## Migration & Rollout Strategy

**Feature Flag Approach:**
- Implement feature flag to toggle between legacy sidebar and new marketplace
- Gradual rollout to user segments (5%, 25%, 50%, 100%)
- A/B testing to measure engagement and user satisfaction

**Data Migration:**
- Auto-select existing advisors for current users during migration
- Preserve all existing chat functionality and data
- Backup strategy for rollback if needed

**Deployment Checklist:**

1. Deploy Phase 1 backend changes to staging
2. Run data migration script and validate user advisor selections
3. Deploy marketplace UI to staging with feature flag disabled
4. Internal testing and QA validation
5. Enable feature flag for internal users, then gradual public rollout
6. Monitor metrics: advisor selection rates, marketplace usage, chat engagement
7. Full production deployment with legacy fallback available

## Risk Mitigation & Rollback

**Rollback Plan:**
- Feature flag allows instant revert to legacy sidebar
- Database rollback script to remove userAdvisors data if needed
- Monitoring alerts for performance degradation or user issues

**Success Metrics:**
- User advisor selection rate (target: >80% of users select at least 1 advisor)
- Marketplace engagement (time spent, advisors browsed)
- Chat usage maintenance (ensure no drop in chat activity)
- Team creation adoption (target: >20% of users try team creation)

## Next Actions (Immediate)

1. **Week 1**: Begin Phase 1 - Update Convex schema and implement core functions
2. **Week 2**: Complete data migration strategy and testing framework
3. **Week 3**: Start Phase 2 - Build marketplace UI components
4. **Week 4**: Implement team creation and advisor selection features


## BMAD Method Implementation Plan: Wizard + One-Click Teams

This augments the original plan with a phase-based roadmap aligned to BMAD (Build, Modularize, Automate, Document) and explicitly covers the Advisor Wizard and One-Click Team Creation.

### Phase B — Build (Weeks 1–2)
Dependencies: Clerk configured with Convex JWT template "convex"; base Convex schema deployed.

- Backend foundations
  - Add/confirm Convex collections: advisors, userAdvisors, teamTemplates
  - New indexes: advisors.by_owner_handle, advisors.by_public, userAdvisors.by_user_advisor
  - Actions/queries:
    - advisors.uploadAdvisorJSON (action) with Zod validation
    - advisors.listMine (query) filtered by userAdvisors
    - teams.createFromTemplate (action) to spawn advisors from template blueprints
- Shared validation
  - Define Zod schemas under src/features/advisors/forms/schemas.ts and mirror on server
- Guardrails
  - Rate limits + idempotency keys for team creation (prevent double clicks)

Deliverables: working backend endpoints/actions; initial team templates registered in code.

### Phase M — Modularize (Weeks 3–4)
Dependencies: Phase B deployed to dev/staging.

- Advisor Wizard (multi-step, accessible)
  - Steps: Identity → Expertise → Role → Review
  - React Hook Form + Zod with per-step validation; persistent draft in localStorage
  - Live JSON preview; import/export JSON
  - A11y: aria-labelledby/aria-describedby, keyboard stepper, error summaries
- One-Click Team Creation
  - Team cards (Startup Squad, Life Coach, College Prep)
  - Bulk modal: checklist, optional rename/title, progress states
  - Uses teams.createFromTemplate; optimistic UI + toasts
- Navigation & Discoverability
  - Add entry points in Projects and Marketplace (Create Advisor / Add Team)

Deliverables: end-to-end UI for wizard and team creation integrated with Convex.

### Phase A — Automate (Week 5)
Dependencies: Phase M in staging.

- Tests
  - Unit: form mappers, Zod schemas, compose system prompt
  - Integration: wizard submit → Convex; team creation action
  - E2E (Playwright): Add Startup Squad → advisors appear; create advisor via wizard
  - Accessibility: axe-core scan of wizard and bulk modal; keyboard navigation tests
- CI checks
  - Typecheck, lint, test, e2e smoke on PR

Deliverables: green CI; test coverage on critical paths.

### Phase D — Document (Week 6)
Dependencies: Phase A complete.

- Developer docs
  - Update specs and data model deltas (this PR)
  - API references for actions/queries; feature flags
- User-facing docs
  - Quickstart: create custom advisor; spawn a team
  - Troubleshooting: validation errors, uploads, rate limits

Deliverables: updated docs; rollout guide.

### Timeline & Dependencies (summary)

- Week 1: Convex schema/indexes; advisors.uploadAdvisorJSON; code templates
- Week 2: teams.createFromTemplate; listMine; marketplace query hooks (with skip param)
- Week 3: Wizard UI + schemas; entry points
- Week 4: Bulk team modal; polish + a11y
- Week 5: Tests + CI
- Week 6: Documentation + rollout

Feature Flags & Rollout

- Add flag: marketplaceWizardEnabled and teamCreationEnabled
- Gradual enablement: internal → 25% → 50% → 100%; legacy fallback retained


## Technical Validation Checklist (Wizard + Teams)

- Clerk + Convex
  - [ ] Clerk JWT template named "convex" with audience "convex" and correct issuer
  - [ ] Server auth checks on all actions/queries
- Convex
  - [ ] advisors.uploadAdvisorJSON validates with Zod on server
  - [ ] teams.createFromTemplate enforces idempotency + rate limits
  - [ ] Indexes exist: advisors.by_owner_handle, advisors.by_public, userAdvisors.by_user_advisor
- Frontend
  - [ ] Wizard stepper is keyboard navigable; aria-current set; focus management works
  - [ ] Icon-only buttons have title attributes; inputs properly labeled
  - [ ] Convex React queries use skip parameter (no conditional hook calls)
  - [ ] Live JSON preview matches form state; import/export functional
- UX/Performance
  - [ ] Entry points visible in Projects and Marketplace
  - [ ] Team bulk modal shows progress and result summary
  - [ ] Marketplace lists paginated and performant (<2s first paint)
- Testing/CI
  - [ ] Unit, integration, E2E, and axe-core tests added and pass in CI
  - [ ] Feature flags: marketplaceWizardEnabled and teamCreationEnabled controlling exposure
