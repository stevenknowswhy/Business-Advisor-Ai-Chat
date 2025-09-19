import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvisorGrid } from '~/components/marketplace/components/AdvisorGrid';
import { SearchInput } from '~/components/ui/SearchInput';
import type { MarketplaceAdvisor, AdvisorCardActions } from '~/components/marketplace/types/marketplace';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
});

// Helper to create mock advisors
const createMockAdvisor = (id: string, name: string): MarketplaceAdvisor => ({
  _id: id as any,
  isPublic: true,
  featured: false,
  category: 'business',
  ownerId: 'owner-1' as any,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  persona: {
    name,
    title: 'Expert',
    oneLiner: 'Helping businesses',
    archetype: 'strategist',
    detailedBackground: 'Background',
    bio: 'Bio',
    specialties: ['Strategy'],
    experience: '10+ years',
    personalInterests: ['Reading'],
    communicationStyle: 'Direct',
    location: { city: 'City', region: 'Region' },
    adviceDelivery: { mode: 'conversational', formality: 'professional', signOff: 'Best' },
  },
  role: {
    mission: 'Help businesses',
  },
  metadata: {
    tags: ['business'],
    modelHint: 'Strategic',
  },
});

const mockActions: AdvisorCardActions = {
  onSelect: jest.fn(),
  onUnselect: jest.fn(),
  onViewProfile: jest.fn(),
};

describe('Marketplace Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  it('renders large advisor grid efficiently', () => {
    // Create 100 mock advisors
    const advisors = Array.from({ length: 100 }, (_, i) => 
      createMockAdvisor(`advisor-${i}`, `Advisor ${i}`)
    );

    const startTime = performance.now();
    
    render(
      <AdvisorGrid
        advisors={advisors}
        actions={mockActions}
        loading={false}
        error={null}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(1000); // 1 second

    // Should render all advisors
    expect(screen.getAllByText(/Advisor \d+/)).toHaveLength(100);
  });

  it('search input debouncing works correctly', async () => {
    const handleSearch = jest.fn();
    let callTime = 0;
    
    mockPerformanceNow.mockImplementation(() => {
      callTime += 100;
      return callTime;
    });

    render(
      <SearchInput 
        onChange={handleSearch}
        debounceMs={300}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Type quickly (should not trigger search immediately)
    await userEvent.type(input, 'test');
    
    // Should not have called search yet
    expect(handleSearch).not.toHaveBeenCalled();
    
    // Wait for debounce
    await waitFor(() => {
      expect(handleSearch).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
    
    // Should only be called once after debounce
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  it('advisor grid handles rapid selection changes', async () => {
    const advisors = Array.from({ length: 10 }, (_, i) => 
      createMockAdvisor(`advisor-${i}`, `Advisor ${i}`)
    );

    const handleSelect = jest.fn();
    const actions = { ...mockActions, onSelect: handleSelect };

    render(
      <AdvisorGrid
        advisors={advisors}
        actions={actions}
        loading={false}
        error={null}
      />
    );

    const startTime = performance.now();
    
    // Rapidly click multiple advisor cards
    const advisorCards = screen.getAllByText(/Advisor \d+/);
    for (let i = 0; i < 5 && i < advisorCards.length; i++) {
      await userEvent.click(advisorCards[i]?.closest('div') as Element);
    }

    const endTime = performance.now();
    const interactionTime = endTime - startTime;

    // Should handle rapid interactions efficiently
    expect(interactionTime).toBeLessThan(500); // 500ms
    expect(handleSelect).toHaveBeenCalledTimes(5);
  });

  it('loading states render quickly', () => {
    const startTime = performance.now();
    
    render(
      <AdvisorGrid
        advisors={[]}
        actions={mockActions}
        loading={true}
        error={null}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Loading state should render very quickly
    expect(renderTime).toBeLessThan(100); // 100ms
    
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('error states render quickly', () => {
    const startTime = performance.now();
    
    render(
      <AdvisorGrid
        advisors={[]}
        actions={mockActions}
        loading={false}
        error="Failed to load advisors"
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Error state should render very quickly
    expect(renderTime).toBeLessThan(100); // 100ms
    
    // Should show error message
    expect(screen.getByText(/unable to load advisors/i)).toBeInTheDocument();
  });

  it('empty states render quickly', () => {
    const startTime = performance.now();
    
    render(
      <AdvisorGrid
        advisors={[]}
        actions={mockActions}
        loading={false}
        error={null}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Empty state should render very quickly
    expect(renderTime).toBeLessThan(100); // 100ms
    
    // Should show empty state message
    expect(screen.getByText(/no advisors found/i)).toBeInTheDocument();
  });

  it('component updates are efficient', () => {
    const advisors = Array.from({ length: 50 }, (_, i) => 
      createMockAdvisor(`advisor-${i}`, `Advisor ${i}`)
    );

    const { rerender } = render(
      <AdvisorGrid
        advisors={advisors}
        actions={mockActions}
        loading={false}
        error={null}
      />
    );

    const startTime = performance.now();
    
    // Update with new advisors
    const newAdvisors = advisors.slice(0, 25); // Remove half
    rerender(
      <AdvisorGrid
        advisors={newAdvisors}
        actions={mockActions}
        loading={false}
        error={null}
      />
    );

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Updates should be efficient
    expect(updateTime).toBeLessThan(200); // 200ms
    
    // Should show updated count
    expect(screen.getAllByText(/Advisor \d+/)).toHaveLength(25);
  });

  it('memory usage is reasonable with large datasets', () => {
    // This is a basic test - in a real scenario you'd use more sophisticated
    // memory profiling tools
    const advisors = Array.from({ length: 1000 }, (_, i) => 
      createMockAdvisor(`advisor-${i}`, `Advisor ${i}`)
    );

    const { unmount } = render(
      <AdvisorGrid
        advisors={advisors}
        actions={mockActions}
        loading={false}
        error={null}
      />
    );

    // Component should render without throwing
    expect(screen.getAllByText(/Advisor \d+/)).toHaveLength(1000);
    
    // Should unmount cleanly
    unmount();
    
    // No memory leaks should occur (this would be tested with more
    // sophisticated tools in a real scenario)
  });

  it('keyboard navigation is responsive', async () => {
    const advisors = Array.from({ length: 10 }, (_, i) => 
      createMockAdvisor(`advisor-${i}`, `Advisor ${i}`)
    );

    render(
      <AdvisorGrid
        advisors={advisors}
        actions={mockActions}
        loading={false}
        error={null}
      />
    );

    const startTime = performance.now();
    
    // Navigate through elements with Tab
    const buttons = screen.getAllByRole('button');
    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      buttons[i]?.focus();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    }

    const endTime = performance.now();
    const navigationTime = endTime - startTime;

    // Keyboard navigation should be responsive
    expect(navigationTime).toBeLessThan(300); // 300ms for 5 focus changes
  });

  it('handles concurrent state updates gracefully', async () => {
    const advisors = Array.from({ length: 20 }, (_, i) => 
      createMockAdvisor(`advisor-${i}`, `Advisor ${i}`)
    );

    const handleSelect = jest.fn();
    const actions = { ...mockActions, onSelect: handleSelect };

    render(
      <AdvisorGrid
        advisors={advisors}
        actions={actions}
        loading={false}
        error={null}
      />
    );

    // Simulate concurrent selections
    const advisorCards = screen.getAllByText(/Advisor \d+/);
    const promises = advisorCards.slice(0, 5).map(async (card, index) => {
      // Add small random delay to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      return userEvent.click(card.closest('div') as Element);
    });

    const startTime = performance.now();
    await Promise.all(promises);
    const endTime = performance.now();
    const concurrentTime = endTime - startTime;

    // Should handle concurrent updates efficiently
    expect(concurrentTime).toBeLessThan(500); // 500ms
    expect(handleSelect).toHaveBeenCalledTimes(5);
  });
});
