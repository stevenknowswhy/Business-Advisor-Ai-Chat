# Phase 2: Frontend Components - Implementation Plan

## 🎯 Overview

This document outlines the comprehensive implementation plan for Phase 2 of the Advisor Marketplace feature, focusing on creating the frontend UI components that will integrate with the Convex backend infrastructure completed in Phase 1.

## 🏗️ Component Architecture

### 1. Main Marketplace Structure
- **Route**: `/marketplace` - New dedicated marketplace page
- **Layout**: Two-tab interface ("Marketplace" and "My Advisors")
- **Integration**: Seamless navigation with existing `/chat` interface

### 2. Core Component Hierarchy

```
MarketplacePage
├── MarketplaceLayout
│   ├── MarketplaceTab
│   │   ├── SearchAndFilters
│   │   ├── TeamTemplateGrid
│   │   │   └── TeamTemplateCard[]
│   │   └── AdvisorGrid
│   │       └── AdvisorCard[]
│   └── MyAdvisorsTab
│       ├── SelectedAdvisorsList
│       └── EmptyStateGuide
└── MarketplaceNavigation
```

## 📁 File Structure (Feature-Colocation Model)

```
src/
├── app/
│   └── marketplace/
│       └── page.tsx                 # Main marketplace route
├── components/
│   ├── marketplace/                 # Feature module
│   │   ├── components/
│   │   │   ├── MarketplaceLayout.tsx
│   │   │   ├── MarketplaceTab.tsx
│   │   │   ├── MyAdvisorsTab.tsx
│   │   │   ├── AdvisorCard.tsx
│   │   │   ├── AdvisorGrid.tsx
│   │   │   ├── SearchAndFilters.tsx
│   │   │   ├── TeamTemplateCard.tsx
│   │   │   ├── TeamTemplateGrid.tsx
│   │   │   ├── AdvisorSelectionButton.tsx
│   │   │   ├── SelectedAdvisorsList.tsx
│   │   │   └── EmptyStateGuide.tsx
│   │   ├── hooks/
│   │   │   ├── useMarketplaceAdvisors.ts
│   │   │   ├── useSelectedAdvisors.ts
│   │   │   ├── useAdvisorSelection.ts
│   │   │   ├── useTeamTemplates.ts
│   │   │   └── useMarketplaceSearch.ts
│   │   ├── types/
│   │   │   └── marketplace.ts
│   │   ├── utils/
│   │   │   └── marketplace-utils.ts
│   │   └── index.ts                 # Public API
│   ├── ui/                          # Enhanced shared components
│   │   ├── Button.tsx               # Enhanced with new variants
│   │   ├── Card.tsx                 # New component
│   │   ├── Badge.tsx                # New component
│   │   ├── SearchInput.tsx          # New component
│   │   ├── FilterDropdown.tsx       # New component
│   │   ├── LoadingSpinner.tsx       # New component
│   │   └── Modal.tsx                # Enhanced existing
│   └── navigation/
│       └── MarketplaceNavigation.tsx
```

## 🔧 Technical Specifications

### TypeScript Interfaces

```typescript
interface MarketplaceAdvisor extends Advisor {
  isPublic: boolean;
  featured: boolean;
  category: string;
  ownerId?: string;
}

interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  advisorIds: string[];
  featured: boolean;
  sortOrder: number;
}

interface MarketplaceFilters {
  category?: string;
  featured?: boolean;
  searchQuery?: string;
}
```

### Integration Strategy

**Convex Backend Integration:**
- Custom hooks wrapping Convex queries/mutations
- Real-time updates for advisor selections
- Optimistic updates for better UX

**Clerk Authentication:**
- `useUser()` hook for user context
- Protected routes and user-specific data
- Graceful handling of unauthenticated states

**State Management:**
- React hooks for local state
- Custom hooks for server state
- Context for marketplace-specific global state

**Responsive Design:**
- Mobile-first Tailwind approach
- Adaptive grids: 1 col (mobile) → 2-3 cols (tablet) → 4+ cols (desktop)
- Touch-friendly 44px minimum targets

## 📋 Task Breakdown

### Phase 2A: Foundation (Week 3)
**Priority: High | Estimated: 3 days**

1. **Shared UI Components**
   - Create Button, Card, Badge, SearchInput, FilterDropdown, LoadingSpinner
   - Dependencies: None
   - Testing: Unit tests for each component

2. **Marketplace Types & Hooks**
   - Define TypeScript interfaces
   - Create Convex integration hooks
   - Dependencies: Phase 1 backend
   - Testing: Hook testing with mock data

### Phase 2B: Core Components (Week 3-4)
**Priority: High | Estimated: 3 days**

3. **AdvisorCard Component**
   - Display advisor info, selection state, actions
   - Dependencies: UI components
   - Testing: Various advisor states

4. **SearchAndFilters Component**
   - Search input, category filters, featured toggle
   - Dependencies: UI components
   - Testing: Filter functionality

5. **AdvisorGrid Component**
   - Responsive grid, loading/empty states
   - Dependencies: AdvisorCard, SearchAndFilters
   - Testing: Responsive behavior

### Phase 2C: Marketplace Pages (Week 4)
**Priority: High | Estimated: 2 days**

6. **MarketplaceTab Component**
   - Main browsing interface
   - Dependencies: AdvisorGrid
   - Testing: Backend integration

7. **MyAdvisorsTab Component**
   - Selected advisors management
   - Dependencies: AdvisorGrid
   - Testing: Selection workflows

### Phase 2D: Integration & Polish (Week 4-5)
**Priority: High | Estimated: 4 days**

8. **MarketplaceLayout & Page**
   - Tab navigation, main route
   - Dependencies: Tab components
   - Testing: Navigation and auth

9. **Team Templates**
   - TeamTemplateCard and Grid components
   - Dependencies: UI components
   - Testing: Team selection

10. **Navigation Integration**
    - Update existing navigation
    - Modify AdvisorRail for selected advisors
    - Dependencies: Marketplace page
    - Testing: Cross-page navigation

11. **Empty States & Onboarding**
    - EmptyStateGuide component
    - First-time user experience
    - Dependencies: All components
    - Testing: New user workflows

### Phase 2E: Testing & Refinement (Week 5-6)
**Priority: Medium | Estimated: 3 days**

12. **Comprehensive Testing**
    - Integration tests, accessibility, performance
    - Dependencies: All components
    - Testing: Complete user flows

13. **Polish & Bug Fixes**
    - UI refinements, performance optimization
    - Dependencies: Testing feedback
    - Testing: Final validation

## 🎯 Success Metrics

**Technical:**
- TypeScript strict mode compliance
- WCAG 2.1 AA accessibility
- <2s marketplace load time
- Mobile responsive on all breakpoints

**User Experience:**
- >80% users select ≥1 advisor
- <3 clicks to select advisor
- <500ms search response time
- <5s team template selection

**Integration:**
- Seamless marketplace ↔ chat navigation
- Consistent advisor data across interfaces
- Proper error handling for all scenarios

## 🚀 Next Steps

1. Set up task management for Phase 2 implementation
2. Begin with Phase 2A: Foundation components
3. Implement components following modular development guide
4. Maintain continuous testing and accessibility compliance
5. Regular integration testing with Phase 1 backend

This plan ensures a systematic, well-tested implementation that integrates seamlessly with the existing ai-advisor-chat application while providing an excellent user experience for advisor discovery and selection.
