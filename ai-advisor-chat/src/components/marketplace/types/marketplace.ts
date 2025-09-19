import { type Advisor } from "~/lib/chat";
import { type Id } from "../../../../convex/_generated/dataModel";

// Extend the existing Advisor type with marketplace-specific fields
export interface MarketplaceAdvisor extends Advisor {
  _id: Id<"advisors">;
  isPublic: boolean;
  featured: boolean;
  category: string;
  ownerId?: Id<"users">;
  createdAt: number;
  updatedAt: number;
  teamAffiliations?: TeamAffiliation[];
}

// Team template for bulk advisor selection
export interface TeamTemplate {
  teamId: string;
  teamSchemaVersion: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  targetAudience: string[];
  useCases: string[];
  advisorRoles: Array<{
    roleId: string;
    roleName: string;
    roleDescription: string;
    advisorId: string;
    primaryFocus: string[];
    interactionStyle: string;
    sessionPriority: number;
    optional?: boolean;
  }>;
  interactionProtocol: {
    sessionFlow: string;
    crossAdvisorCommunication: boolean;
    contextSharing: string;
    decisionMaking: string;
    feedbackLoop: string;
  };
  onboarding: {
    estimatedTime: string;
    prerequisites: string[];
    welcomeMessage: string;
    firstSession: {
      type: string;
      duration: string;
      objectives: string[];
    };
  };
  customizationOptions: {
    removableAdvisors: string[];
    renameableRoles: boolean;
    adjustablePersonalities: boolean;
    configurableFocusAreas: boolean;
    teamSize: string;
  };
  pricing: {
    deploymentFee: {
      free: number;
      regular: number;
      pro: number;
    };
    monthlyFee: {
      free: number;
      regular: number;
      pro: number;
    };
    sessionPricing: {
      free: string;
      regular: string;
      pro: string;
    };
  };
  successMetrics: Array<{
    metric: string;
    description: string;
    unit: string;
  }>;
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      org: string;
      contactEmail: string;
    };
    tags: string[];
    featured: boolean;
    popularityScore: number;
  };
  deploymentEligibility?: {
    free: boolean;
    regular: boolean;
    pro: boolean;
  };
}

// User's advisor selection record
export interface AdvisorSelection {
  _id: Id<"userAdvisors">;
  userId: Id<"users">;
  advisorId: Id<"advisors">;
  selectedAt: number;
  source: 'manual' | 'team';
  teamId?: string;
}

// Team affiliation interface
export interface TeamAffiliation {
  teamId: string;
  teamName: string;
  roleName: string;
  isPrimary: boolean;
}

// Marketplace filtering options
export interface MarketplaceFilters {
  category?: string;
  featured?: boolean;
  searchQuery?: string;
  limit?: number;
  sortBy?: 'relevance' | 'rating' | 'experience' | 'newest' | 'name';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'expert';
  availability?: 'available' | 'busy' | 'offline';
  teamId?: string;
  tags?: string[];
}

// Search and filter state
export interface MarketplaceState {
  filters: MarketplaceFilters;
  loading: boolean;
  error: string | null;
  advisors: MarketplaceAdvisor[];
  selectedAdvisors: MarketplaceAdvisor[];
  teamTemplates: TeamTemplate[];
}

// Category definitions for consistent categorization
export const ADVISOR_CATEGORIES = {
  business: {
    label: 'Business',
    description: 'Strategy, operations, and general business guidance',
    color: 'blue',
  },
  marketing: {
    label: 'Marketing',
    description: 'Brand, digital marketing, and growth strategies',
    color: 'green',
  },
  technical: {
    label: 'Technical',
    description: 'Engineering, architecture, and technical leadership',
    color: 'indigo',
  },
  finance: {
    label: 'Finance',
    description: 'Financial planning, fundraising, and accounting',
    color: 'yellow',
  },
  product: {
    label: 'Product',
    description: 'Product management, design, and user experience',
    color: 'purple',
  },
  sales: {
    label: 'Sales',
    description: 'Sales strategy, business development, and customer success',
    color: 'red',
  },
  general: {
    label: 'General',
    description: 'Cross-functional expertise and general advisory',
    color: 'gray',
  },
} as const;

export type AdvisorCategory = keyof typeof ADVISOR_CATEGORIES;

// Selection source types
export type SelectionSource = 'marketplace' | 'team' | 'migration' | 'custom';

// Marketplace tab types
export type MarketplaceTabType = 'marketplace' | 'teams' | 'my-advisors';

// Component prop types for marketplace components
export interface MarketplaceComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
}

// Advisor card action types
export interface AdvisorCardActions {
  onSelect: (advisor: MarketplaceAdvisor) => void;
  onUnselect: (advisor: MarketplaceAdvisor) => void;
  onViewProfile: (advisor: MarketplaceAdvisor) => void;
}

// Team template actions
export interface TeamTemplateActions {
  onSelectTeam: (template: TeamTemplate) => void;
  onViewTemplate: (template: TeamTemplate) => void;
}

// Search and filter actions
export interface SearchFilterActions {
  onSearch: (query: string) => void;
  onFilterCategory: (category: string | undefined) => void;
  onToggleFeatured: (featured: boolean | undefined) => void;
  onSortChange: (sortBy: "relevance" | "rating" | "experience" | "newest" | "name" | undefined) => void;
  onExperienceLevelChange: (level: "entry" | "mid" | "senior" | "expert" | undefined) => void;
  onAvailabilityChange: (availability: "available" | "busy" | "offline" | undefined) => void;
  onFilterTeam: (teamId: string | undefined) => void;
  onFilterTags: (tags: string[] | undefined) => void;
  onClearFilters: () => void;
}

// Marketplace navigation actions
export interface MarketplaceNavActions {
  onNavigateToChat: () => void;
  onNavigateToMarketplace: () => void;
  onTabChange: (tab: MarketplaceTabType) => void;
}

// Error types for marketplace operations
export interface MarketplaceError {
  type: 'network' | 'auth' | 'validation' | 'server';
  message: string;
  details?: string;
}

// Success response types
export interface SelectionResult {
  success: boolean;
  advisorId: Id<"advisors">;
  selectionId?: Id<"userAdvisors">;
  error?: string;
  alreadySelected?: boolean;
}

export interface TeamSelectionResult {
  success: boolean;
  teamId: string;
  results: SelectionResult[];
  totalSelected: number;
  totalFailed: number;
}

// Utility types for component state
export interface LoadingState {
  advisors: boolean;
  selectedAdvisors: boolean;
  teamTemplates: boolean;
  selection: boolean;
}

export interface ErrorState {
  advisors: string | null;
  selectedAdvisors: string | null;
  teamTemplates: string | null;
  selection: string | null;
}

// Hook return types
export interface UseMarketplaceAdvisorsReturn {
  advisors: MarketplaceAdvisor[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseSelectedAdvisorsReturn {
  selectedAdvisors: MarketplaceAdvisor[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseAdvisorSelectionReturn {
  selectAdvisor: (advisorId: Id<"advisors">, source?: SelectionSource, teamId?: string) => Promise<SelectionResult>;
  unselectAdvisor: (advisorId: Id<"advisors">) => Promise<boolean>;
  selectTeam: (teamId: string) => Promise<TeamSelectionResult>;
  loading: boolean;
  error: string | null;
}

export interface UseTeamTemplatesReturn {
  teamTemplates: TeamTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseMarketplaceSearchReturn {
  searchResults: MarketplaceAdvisor[];
  loading: boolean;
  error: string | null;
  search: (query: string, filters?: MarketplaceFilters) => void;
  clearSearch: () => void;
}

// Marketplace statistics
export interface MarketplaceStats {
  totalAdvisors: number;
  featuredAdvisors: number;
  categoryCounts: Record<string, number>;
  averageRating: number;
  ratedAdvisors: number;
  experienceDistribution: {
    entry: number;
    mid: number;
    senior: number;
    expert: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

// Review type from Convex schema
export interface AdvisorReview {
  _id: Id<"advisorReviews">;
  advisorId: Id<"advisors">;
  userId: Id<"users">;
  rating: number;
  title?: string;
  content: string;
  helpful?: number;
  verified?: boolean;
  tags?: string[];
  response?: {
    content: string;
    respondedAt: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

// Portfolio item type from Convex schema
export interface PortfolioItem {
  _id: Id<"advisorPortfolios">;
  advisorId: Id<"advisors">;
  title: string;
  description: string;
  type: 'case_study' | 'project' | 'achievement' | 'publication' | 'other';
  content?: string;
  images?: string[];
  links?: Array<{
    title: string;
    url: string;
    type: 'website' | 'github' | 'linkedin' | 'other';
  }>;
  tags?: string[];
  featured?: boolean;
  order?: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: number;
  updatedAt: number;
}

// Availability status type from Convex schema
export type AvailabilityStatus = 'available' | 'busy' | 'offline' | 'away';

// Availability type from Convex schema
export interface Availability {
  _id: Id<"advisorAvailability">;
  advisorId: Id<"advisors">;
  timezone: string;
  status: AvailabilityStatus;
  schedule?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
  nextAvailable?: number;
  responseTime?: {
    average: number;
    min: number;
    max: number;
  };
  capacity?: {
    maxConcurrent: number;
    currentLoad: number;
  };
  statusMessage?: string;
  lastStatusUpdate: number;
  createdAt: number;
  updatedAt: number;
}

// Advisor suggestions
export interface AdvisorSuggestion {
  _id: Id<"advisors">;
  firstName: string;
  lastName: string;
  imageUrl: string;
  category: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
  experience: number;
  persona: {
    name: string;
    title: string;
    description: string;
    oneLiner: string;
    specialties: string[];
    expertise: string[];
  };
  tags: string[];
  createdAt: number;
  suggestionScore?: number;
}

// Search result with relevance score
export interface SearchResult extends MarketplaceAdvisor {
  relevanceScore: number;
}

// Popular advisor data
export interface PopularAdvisor extends MarketplaceAdvisor {
  popularityScore: number;
  selectionCount: number;
  recentSelectionCount: number;
}

// Adapter function to convert Convex advisor to MarketplaceAdvisor
export function adaptConvexAdvisorToMarketplaceAdvisor(convexAdvisor: any): MarketplaceAdvisor {
  return {
    id: convexAdvisor._id,
    name: convexAdvisor.persona?.name || `${convexAdvisor.firstName || ''} ${convexAdvisor.lastName || ''}`.trim() || 'Unknown Advisor',
    title: convexAdvisor.persona?.title || 'Advisor',
    image: convexAdvisor.persona?.image || convexAdvisor.imageUrl,
    oneLiner: convexAdvisor.persona?.oneLiner || '',
    archetype: convexAdvisor.persona?.archetype || '',
    bio: convexAdvisor.persona?.bio || '',
    detailedBackground: convexAdvisor.persona?.detailedBackground,
    experience: convexAdvisor.persona?.experience,
    specialties: convexAdvisor.persona?.specialties || [],
    personalInterests: convexAdvisor.persona?.personalInterests || [],
    communicationStyle: convexAdvisor.persona?.communicationStyle,
    location: convexAdvisor.persona?.location || { city: '', region: '' },
    adviceDelivery: convexAdvisor.persona?.adviceDelivery || { mode: '', formality: '', signOff: '' },
    mission: '', // Not in Convex schema
    tags: convexAdvisor.tags || [],
    modelHint: convexAdvisor.persona?.modelHint,
    _id: convexAdvisor._id,
    isPublic: convexAdvisor.isPublic || false,
    featured: convexAdvisor.featured || false,
    category: convexAdvisor.category || 'general',
    ownerId: convexAdvisor.ownerId,
    createdAt: convexAdvisor.createdAt,
    updatedAt: convexAdvisor.updatedAt,
  };
}
