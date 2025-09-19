# Tasks: Advisor Marketplace Implementation

This document provides a detailed task breakdown for implementing the Advisor Marketplace feature, organized by implementation phases.

## Phase 1: Foundation & Data Model (Week 1-2)

### Backend Infrastructure
- [ ] **Update Convex Schema**
  - Add `userAdvisors` junction table with indexes
  - Add `teamTemplates` collection with predefined teams
  - Update `advisors` table with `isPublic`, `featured`, `category` fields
  - Deploy schema changes to staging

- [ ] **Core Convex Functions**
  - Implement `getUserSelectedAdvisors(userId)` query
  - Implement `selectAdvisor(userId, advisorId, source?)` mutation
  - Implement `unselectAdvisor(userId, advisorId)` mutation
  - Implement `getMarketplaceAdvisors(category?, featured?)` query
  - Implement `selectTeam(userId, teamId)` mutation for bulk selection
  - Implement `getTeamTemplates(category?, featured?)` query

- [ ] **Migration & Data Setup**
  - Create migration script to auto-select existing user advisors
  - Mark appropriate seeded advisors as public/featured for marketplace
  - Create initial team templates (Startup, Marketing, Development, Sales teams)
  - Validate migration script with test data

- [ ] **Testing Foundation**
  - Unit tests for all new Convex functions
  - Integration tests for advisor selection workflows
  - Performance testing for advisor queries with large datasets
  - Migration script validation and rollback testing

## Phase 2: Marketplace UI Core (Week 3-4)

### Marketplace Components
- [ ] **Core Marketplace Structure**
  - Create `/marketplace` route and page component
  - Build `AdvisorMarketplace` container with responsive layout
  - Implement tab navigation between Marketplace and My Advisors
  - Add marketplace navigation to existing chat interface

- [ ] **Marketplace Tab Features**
  - Build "Create Your Own Advisor" prominent CTA section
  - Implement "One-Click Team Creation" with team preview cards
  - Create "Individual Advisors" browseable grid with pagination
  - Add basic search and category filtering
  - Implement advisor selection/deselection with optimistic updates

- [ ] **My Advisors Tab**
  - Build selected advisors management interface
  - Implement advisor removal with confirmation
  - Add empty state with guidance to marketplace
  - Show advisor selection source (marketplace, team, custom)

- [ ] **Team Creation Feature**
  - Team template cards with advisor previews
  - Team selection confirmation modal with customization options
  - Bulk advisor selection with progress feedback
  - Success state with navigation to My Advisors or Chat

### Component Library
- [ ] **Reusable Components**
  - `AdvisorCard` component for marketplace display
  - `TeamCard` component for team templates
  - `AdvisorGrid` component with loading states
  - `SearchFilters` component for marketplace filtering
  - Loading skeletons and error states for all components

## Phase 3: Chat Integration (Week 5)

### Chat Interface Updates
- [ ] **Sidebar Modifications**
  - Modify `AdvisorRail` to show only selected advisors
  - Remove "Add New Advisor" button from sidebar
  - Add marketplace navigation button/link
  - Implement real-time updates when advisors selected/deselected

- [ ] **Empty State Handling**
  - Detect when user has no selected advisors
  - Show "Get Started" flow directing to marketplace
  - Preserve chat interface for users with selected advisors
  - Handle edge cases (advisor deselection during active chat)

- [ ] **Navigation & UX**
  - Seamless navigation between chat and marketplace
  - Preserve chat state when switching to marketplace
  - Mobile-responsive marketplace interface
  - Breadcrumb navigation and back buttons

- [ ] **Integration Testing**
  - End-to-end tests for marketplace to chat flow
  - Test advisor selection/deselection during active chats
  - Validate conversation creation with selected advisors only
  - Test mobile responsive behavior

## Phase 4: Polish & Enhanced Features (Week 6)

### Enhanced Marketplace
- [ ] **Advanced Search & Filtering**
  - Full-text search across advisor names, descriptions, specialties
  - Filter by categories, tags, expertise areas
  - Sort options (popularity, newest, alphabetical)
  - Search result highlighting and pagination

- [ ] **Advisor Recommendations**
  - Recommend advisors based on user's selected advisors
  - Show "Users who selected X also selected Y" suggestions
  - Featured advisor rotation on marketplace homepage
  - Personalized advisor suggestions

- [ ] **Enhanced Team Features**
  - Team categories and better organization
  - Custom team creation (save advisor combinations)
  - Team sharing between users (future consideration)
  - Team usage analytics and popular teams

### Analytics & Monitoring
- [ ] **User Analytics**
  - Track advisor selection patterns and popular advisors
  - Monitor marketplace usage metrics (time spent, conversion rates)
  - A/B testing framework for marketplace features
  - User onboarding funnel analysis

- [ ] **Performance Optimization**
  - Optimize advisor queries for large catalogs
  - Implement caching for marketplace data
  - Image optimization for advisor avatars
  - Bundle size optimization for marketplace components

### Production Readiness
- [ ] **Feature Flags & Rollout**
  - Implement feature flag system for gradual rollout
  - A/B testing setup for marketplace vs legacy sidebar
  - Monitoring and alerting for marketplace performance
  - Rollback procedures and emergency switches

- [ ] **Documentation & Training**
  - User documentation for marketplace features
  - Admin documentation for team template management
  - Developer documentation for marketplace APIs
  - Support team training materials

## Success Metrics & Validation

### Key Performance Indicators
- [ ] **User Engagement Metrics**
  - Advisor selection rate (target: >80% of users select ≥1 advisor)
  - Marketplace engagement (time spent, advisors browsed)
  - Team creation adoption (target: >20% of users try teams)
  - Chat usage maintenance (no drop in chat activity)

- [ ] **Technical Metrics**
  - Marketplace page load time (<2s)
  - Advisor selection response time (<500ms)
  - Search query performance (<1s)
  - Mobile usability scores (>90)


## Augmented Task Breakdown: Wizard + One-Click Teams

Legend: Priority (P0 critical, P1 high, P2 normal), Estimate (E ~ hours), AC (acceptance criteria excerpt)

### Phase B (Build)

- [ ] P0 E:6h Backend action: advisors.uploadAdvisorJSON with Zod validation
  - AC: Invalid payload rejected with field errors; success returns advisorId
- [ ] P0 E:6h Backend action: teams.createFromTemplate(templateId) with idempotency + rate limit
  - AC: Creates 3–5 advisors for known templates; duplicate click creates once
- [ ] P0 E:4h Indexes: advisors.by_owner_handle; advisors.by_public; userAdvisors.by_user_advisor
  - AC: Queries use indexes; unique handle enforced per owner
- [ ] P1 E:4h Query: advisors.listMine filtered by userAdvisors
  - AC: Only user-selected advisors returned; realtime updates propagate

### Phase M (Modularize)

- [ ] P0 E:12h AdvisorWizardDialog (4 steps, RHF + Zod, draft save)
  - AC: Can keyboard-complete; validation blocks next; draft persists and clears on success
- [ ] P0 E:8h Wizard Review: live JSON preview; import/export JSON
  - AC: Import validates and maps fields; preview mirrors form state
- [ ] P0 E:8h One-Click Team UI: team cards + bulk modal with checkboxes/rename
  - AC: Deselected advisors not created; renamed titles persisted
- [ ] P1 E:4h Entry points: Projects + Marketplace (Create Advisor / Add Team)
  - AC: Buttons visible on desktop/mobile; routes wired

### Phase A (Automate)

- [ ] P0 E:6h Unit tests: schemas, mappers, handle generator
  - AC: 90%+ coverage on mapper paths; schema guards enforced
- [ ] P0 E:6h Integration tests: wizard submit → Convex; team creation action
  - AC: Happy paths green; common error paths covered
- [ ] P1 E:8h E2E (Playwright): Add Startup Squad; Create advisor via wizard
  - AC: Advisors appear in My Advisors; UI states verified
- [ ] P1 E:3h Accessibility tests: axe-core on wizard and bulk modal
  - AC: No critical violations; keyboard nav passes

### Phase D (Document)

- [ ] P1 E:4h Developer docs: API references, data deltas
  - AC: spec.md/data-model.md updated; examples compile
- [ ] P2 E:3h User docs: Quickstart for Wizard and Teams
  - AC: Step-by-step with screenshots/placeholders; troubleshooting included

### Rollout & Flags

- [ ] P0 E:2h Feature flags marketplaceWizardEnabled, teamCreationEnabled
  - AC: Flags toggle features at runtime; legacy fallback retained
