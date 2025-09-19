// Main marketplace module exports

// Layout and main components
export { 
  MarketplaceLayout, 
  MarketplaceLayoutWithProvider,
  type MarketplaceLayoutProps 
} from './MarketplaceLayout';

// Page components
export { 
  MarketplaceTab, 
  MyAdvisorsTab,
  type MarketplaceTabProps,
  type MyAdvisorsTabProps 
} from './pages';

// Core components
export { 
  AdvisorCard, 
  AdvisorCardSkeleton,
  SearchAndFilters, 
  QuickFilters, 
  SearchSuggestions,
  AdvisorGrid,
  FeaturedAdvisorsGrid,
  CategoryAdvisorsGrid,
  SelectedAdvisorsGrid,
  PaginatedAdvisorGrid,
  ResponsiveAdvisorGrid,
  type AdvisorCardProps,
  type SearchAndFiltersProps,
  type AdvisorGridProps,
  type PaginatedAdvisorGridProps
} from './components';

// Hooks
export {
  useMarketplaceAdvisors,
  useSelectedAdvisors,
  useAdvisorSelection,
  useTeamTemplates,
  useMarketplaceSearch,
  useMarketplaceState,
} from './hooks';

// Types
export type {
  MarketplaceAdvisor,
  TeamTemplate,
  AdvisorSelection,
  MarketplaceFilters,
  MarketplaceState,
  MarketplaceTabType,
  AdvisorCategory,
  SelectionSource,
  MarketplaceComponentProps,
  AdvisorCardActions,
  TeamTemplateActions,
  SearchFilterActions,
  MarketplaceNavActions,
  MarketplaceError,
  SelectionResult,
  TeamSelectionResult,
  LoadingState,
  ErrorState,
  UseMarketplaceAdvisorsReturn,
  UseSelectedAdvisorsReturn,
  UseAdvisorSelectionReturn,
  UseTeamTemplatesReturn,
  UseMarketplaceSearchReturn,
} from './types/marketplace';

// Constants
export { ADVISOR_CATEGORIES } from './types/marketplace';
