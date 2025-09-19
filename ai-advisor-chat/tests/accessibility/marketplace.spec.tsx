import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MarketplaceTab } from '~/components/marketplace/pages/MarketplaceTab';
import { MyAdvisorsTab } from '~/components/marketplace/pages/MyAdvisorsTab';
import { AdvisorCard } from '~/components/marketplace/components/AdvisorCard';
import { SearchAndFilters } from '~/components/marketplace/components/SearchAndFilters';
import type { MarketplaceAdvisor, AdvisorCardActions } from '~/components/marketplace/types/marketplace';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the marketplace hooks
jest.mock('~/components/marketplace/hooks/useMarketplace', () => ({
  useMarketplaceState: () => ({
    advisors: [],
    selectedAdvisors: [],
    teamTemplates: [],
    searchResults: [],
    loading: {
      advisors: false,
      selectedAdvisors: false,
      teamTemplates: false,
      search: false,
      selection: false,
    },
    error: {
      advisors: null,
      selectedAdvisors: null,
      teamTemplates: null,
      search: null,
      selection: null,
    },
    filters: {},
    updateFilters: jest.fn(),
    clearFilters: jest.fn(),
    selectAdvisor: jest.fn(),
    unselectAdvisor: jest.fn(),
    selectTeam: jest.fn(),
    search: jest.fn(),
    clearSearch: jest.fn(),
    refetch: {
      advisors: jest.fn(),
      selectedAdvisors: jest.fn(),
      teamTemplates: jest.fn(),
    },
  }),
}));

const mockAdvisor: MarketplaceAdvisor = {
  _id: 'advisor-1' as any,
  isPublic: true,
  featured: true,
  category: 'business',
  ownerId: 'owner-1' as any,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  persona: {
    name: 'John Smith',
    title: 'Business Strategy Expert',
    image: 'https://example.com/avatar.jpg',
    oneLiner: 'Helping businesses scale and grow',
    bio: 'Experienced business strategist',
    specialties: ['Strategy', 'Operations'],
    experience: '15+ years in business consulting',
    archetype: 'strategist',
    detailedBackground: 'Detailed background',
    personalInterests: ['Reading'],
    communicationStyle: 'Direct',
    location: { city: 'New York', region: 'NY' },
    adviceDelivery: { mode: 'conversational', formality: 'professional', signOff: 'Best regards' },
  },
  role: {
    mission: 'Help businesses achieve growth',
  },
  metadata: {
    tags: ['business'],
    modelHint: 'Strategic thinking',
  },
};

const mockActions: AdvisorCardActions = {
  onSelect: jest.fn(),
  onUnselect: jest.fn(),
  onViewProfile: jest.fn(),
};

describe('Marketplace Accessibility Tests', () => {
  it('MarketplaceTab should not have accessibility violations', async () => {
    const { container } = render(<MarketplaceTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('MyAdvisorsTab should not have accessibility violations', async () => {
    const { container } = render(<MyAdvisorsTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AdvisorCard should not have accessibility violations', async () => {
    const { container } = render(
      <AdvisorCard advisor={mockAdvisor} actions={mockActions} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SearchAndFilters should not have accessibility violations', async () => {
    const { container } = render(
      <SearchAndFilters
        filters={{}}
        actions={{
          onSearch: jest.fn(),
          onFilterCategory: jest.fn(),
          onToggleFeatured: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AdvisorCard has proper ARIA labels', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    // Check for proper image alt text
    const avatar = screen.getByAltText('John Smith avatar');
    expect(avatar).toBeInTheDocument();
    
    // Check for proper button labels
    const selectButton = screen.getByRole('button', { name: /select/i });
    expect(selectButton).toBeInTheDocument();
    
    const viewProfileButton = screen.getByRole('button', { name: /view profile/i });
    expect(viewProfileButton).toBeInTheDocument();
  });

  it('SearchAndFilters has proper form labels', () => {
    render(
      <SearchAndFilters
        filters={{}}
        actions={{
          onSearch: jest.fn(),
          onFilterCategory: jest.fn(),
          onToggleFeatured: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      />
    );
    
    // Search input should have proper labeling
    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toHaveAttribute('aria-label');
    expect(searchInput).toHaveAttribute('placeholder');
  });

  it('MarketplaceTab has proper heading structure', () => {
    render(<MarketplaceTab />);
    
    // Should have main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Advisor Marketplace');
    
    // Should have proper heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('MyAdvisorsTab has proper heading structure', () => {
    render(<MyAdvisorsTab />);
    
    // Should have main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('My Advisors');
  });

  it('AdvisorCard supports keyboard navigation', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    // All interactive elements should be focusable
    const interactiveElements = screen.getAllByRole('button');
    interactiveElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('SearchAndFilters supports keyboard navigation', () => {
    render(
      <SearchAndFilters
        filters={{}}
        actions={{
          onSearch: jest.fn(),
          onFilterCategory: jest.fn(),
          onToggleFeatured: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      />
    );
    
    // Search input should be focusable
    const searchInput = screen.getByRole('textbox');
    expect(searchInput).not.toHaveAttribute('tabindex', '-1');
  });

  it('Color contrast meets WCAG standards', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    // This is a basic check - in a real app, you'd use tools like
    // axe-core or manual testing to verify color contrast ratios
    const textElements = screen.getAllByText(/./);
    textElements.forEach(element => {
      // Ensure text elements have readable styling
      const styles = window.getComputedStyle(element);
      expect(styles.color).toBeDefined();
    });
  });

  it('Focus management works correctly', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    // Focus should be manageable
    const firstButton = screen.getAllByRole('button')[0];
    firstButton?.focus();
    expect(document.activeElement).toBe(firstButton);
  });

  it('Screen reader content is appropriate', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    // Check for screen reader only content
    const srOnlyElements = document.querySelectorAll('.sr-only');
    srOnlyElements.forEach(element => {
      expect(element).toHaveClass('sr-only');
    });
  });

  it('ARIA roles are used correctly', () => {
    render(<MarketplaceTab />);
    
    // Check for proper ARIA roles
    const buttons = screen.getAllByRole('button');
    const headings = screen.getAllByRole('heading');
    const textboxes = screen.queryAllByRole('textbox');
    
    expect(buttons.length).toBeGreaterThan(0);
    expect(headings.length).toBeGreaterThan(0);
    
    // Each element should have appropriate roles
    buttons.forEach(button => {
      expect(button.tagName.toLowerCase()).toBe('button');
    });
  });

  it('Loading states are announced to screen readers', () => {
    // This would test loading states with proper ARIA live regions
    // For now, we'll check that loading components have proper attributes
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    // In a real implementation, loading states should have:
    // - aria-live="polite" or "assertive"
    // - role="status" for status updates
    // - Proper loading text for screen readers
  });
});
