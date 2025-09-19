import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketplaceLayout } from '~/components/marketplace/MarketplaceLayout';

// Mock the marketplace hooks with more realistic behavior
const mockAdvisors = [
  {
    _id: 'advisor-1',
    persona: { name: 'John Smith', title: 'Business Expert' },
    isPublic: true,
    featured: true,
    category: 'business',
  },
  {
    _id: 'advisor-2',
    persona: { name: 'Jane Doe', title: 'Marketing Expert' },
    isPublic: true,
    featured: false,
    category: 'marketing',
  },
  {
    _id: 'advisor-3',
    persona: { name: 'Bob Wilson', title: 'Tech Lead' },
    isPublic: true,
    featured: true,
    category: 'technical',
  },
];

let selectedAdvisors: any[] = [];
const mockSelectAdvisor = jest.fn().mockImplementation((advisorId) => {
  const advisor = mockAdvisors.find(a => a._id === advisorId);
  if (advisor && !selectedAdvisors.find(a => a._id === advisorId)) {
    selectedAdvisors.push(advisor);
  }
  return Promise.resolve({ success: true, advisorId });
});

const mockUnselectAdvisor = jest.fn().mockImplementation((advisorId) => {
  selectedAdvisors = selectedAdvisors.filter(a => a._id !== advisorId);
  return Promise.resolve(true);
});

jest.mock('~/components/marketplace/hooks/useMarketplace', () => ({
  useMarketplaceState: () => ({
    advisors: mockAdvisors,
    selectedAdvisors,
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
    selectAdvisor: mockSelectAdvisor,
    unselectAdvisor: mockUnselectAdvisor,
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

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/marketplace',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Marketplace Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    selectedAdvisors = []; // Reset selected advisors
  });

  it('completes full advisor selection workflow', async () => {
    render(<MarketplaceLayout initialTab="marketplace" />);

    // Should start on marketplace tab
    expect(screen.getByText('Advisor Marketplace')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

    // Select first advisor
    const johnCard = screen.getByText('John Smith').closest('div');
    await userEvent.click(johnCard as Element);

    // Should call select function
    expect(mockSelectAdvisor).toHaveBeenCalledWith('advisor-1');

    // Switch to My Advisors tab
    const myAdvisorsTab = screen.getByRole('button', { name: /my advisors/i });
    await userEvent.click(myAdvisorsTab);

    // Should show selected advisor
    await waitFor(() => {
      expect(screen.getByText('My Advisors')).toBeInTheDocument();
    });

    // Should show advisor count in tab
    expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
  });

  it('handles search and filtering workflow', async () => {
    render(<MarketplaceLayout initialTab="marketplace" />);

    // Search for specific advisor
    const searchInput = screen.getByRole('textbox');
    await userEvent.type(searchInput, 'marketing');

    // Should filter results (in real implementation)
    expect(searchInput).toHaveValue('marketing');

    // Clear search
    const clearButton = screen.getByLabelText('Clear search');
    await userEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('handles tab navigation correctly', async () => {
    render(<MarketplaceLayout initialTab="marketplace" />);

    // Should start on marketplace tab
    expect(screen.getByText('Advisor Marketplace')).toBeInTheDocument();

    // Switch to My Advisors tab
    const myAdvisorsTab = screen.getByRole('button', { name: /my advisors/i });
    await userEvent.click(myAdvisorsTab);

    // Should show My Advisors content
    await waitFor(() => {
      expect(screen.getByText('My Advisors')).toBeInTheDocument();
    });

    // Switch back to Marketplace tab
    const marketplaceTab = screen.getByRole('button', { name: /marketplace/i });
    await userEvent.click(marketplaceTab);

    // Should show Marketplace content
    await waitFor(() => {
      expect(screen.getByText('Advisor Marketplace')).toBeInTheDocument();
    });
  });

  it('handles advisor unselection workflow', async () => {
    // Pre-select an advisor
    selectedAdvisors = [mockAdvisors[0]];

    render(<MarketplaceLayout initialTab="my-advisors" />);

    // Should show selected advisor
    expect(screen.getByText('John Smith')).toBeInTheDocument();

    // Unselect advisor (click on card or unselect button)
    const advisorCard = screen.getByText('John Smith').closest('div');
    await userEvent.click(advisorCard as Element);

    // Should call unselect function
    expect(mockUnselectAdvisor).toHaveBeenCalledWith('advisor-1');
  });

  it('handles empty states correctly', async () => {
    render(<MarketplaceLayout initialTab="my-advisors" />);

    // Should show empty state for My Advisors
    expect(screen.getByText('No Advisors Selected')).toBeInTheDocument();
    expect(screen.getByText(/haven't selected any advisors yet/i)).toBeInTheDocument();

    // Should have button to browse marketplace
    const browseButton = screen.getByRole('button', { name: /browse marketplace/i });
    expect(browseButton).toBeInTheDocument();

    // Click browse button should switch tabs
    await userEvent.click(browseButton);

    // Should switch to marketplace tab
    await waitFor(() => {
      expect(screen.getByText('Advisor Marketplace')).toBeInTheDocument();
    });
  });

  it('handles navigation to chat correctly', async () => {
    // Pre-select an advisor
    selectedAdvisors = [mockAdvisors[0]];

    render(<MarketplaceLayout initialTab="marketplace" />);

    // Should show "Go to Chat" button when advisors are selected
    const chatButton = screen.getByRole('button', { name: /go to chat/i });
    expect(chatButton).toBeInTheDocument();

    // Click should navigate to chat
    await userEvent.click(chatButton);

    // Should call router.push (mocked)
    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('handles back navigation correctly', async () => {
    render(<MarketplaceLayout showBackButton />);

    // Should show back button
    const backButton = screen.getByRole('button', { name: /back to app/i });
    expect(backButton).toBeInTheDocument();

    // Click should navigate back
    await userEvent.click(backButton);

    // Should call router.push to home
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles featured advisors toggle', async () => {
    render(<MarketplaceLayout initialTab="marketplace" />);

    // Should show all advisors initially
    expect(screen.getByText('All Advisors')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();

    // Click featured toggle
    const featuredButton = screen.getByRole('button', { name: /featured/i });
    await userEvent.click(featuredButton);

    // Should show featured advisors view
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('maintains state across tab switches', async () => {
    render(<MarketplaceLayout initialTab="marketplace" />);

    // Select an advisor
    const johnCard = screen.getByText('John Smith').closest('div');
    await userEvent.click(johnCard as Element);

    // Switch to My Advisors tab
    const myAdvisorsTab = screen.getByRole('button', { name: /my advisors/i });
    await userEvent.click(myAdvisorsTab);

    // Should show selected advisor
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    // Switch back to Marketplace
    const marketplaceTab = screen.getByRole('button', { name: /marketplace/i });
    await userEvent.click(marketplaceTab);

    // Should still show selection state
    await waitFor(() => {
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock error state
    jest.mocked(mockSelectAdvisor).mockRejectedValueOnce(new Error('Network error'));

    render(<MarketplaceLayout initialTab="marketplace" />);

    // Try to select advisor
    const johnCard = screen.getByText('John Smith').closest('div');
    await userEvent.click(johnCard as Element);

    // Should handle error gracefully (not crash)
    expect(mockSelectAdvisor).toHaveBeenCalled();
    
    // In a real implementation, this would show an error message
    // For now, we just verify it doesn't crash
  });

  it('handles keyboard navigation across components', async () => {
    render(<MarketplaceLayout initialTab="marketplace" />);

    // Tab through interactive elements
    await userEvent.tab();
    
    // Should be able to navigate through all focusable elements
    const focusableElements = screen.getAllByRole('button').concat(
      screen.getAllByRole('textbox')
    );

    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Each element should be focusable
    focusableElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
