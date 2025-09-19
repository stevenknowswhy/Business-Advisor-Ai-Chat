import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvisorCard, AdvisorCardSkeleton } from '~/components/marketplace/components/AdvisorCard';
import type { MarketplaceAdvisor, AdvisorCardActions } from '~/components/marketplace/types/marketplace';

// Mock the chat utility functions
jest.mock('~/lib/chat', () => ({
  getAdvisorInitials: (advisor: any) => advisor.persona?.name?.split(' ').map((n: string) => n[0]).join('') || 'AA',
  getAdvisorColor: () => 'bg-blue-500',
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
    bio: 'Experienced business strategist with 15+ years in consulting',
    specialties: ['Strategy', 'Operations', 'Growth'],
    experience: '15+ years in business consulting',
    archetype: 'strategist',
    detailedBackground: 'Detailed background here',
    personalInterests: ['Reading', 'Golf'],
    communicationStyle: 'Direct and analytical',
    location: { city: 'New York', region: 'NY' },
    adviceDelivery: { mode: 'conversational', formality: 'professional', signOff: 'Best regards' },
  },
  role: {
    mission: 'Help businesses achieve sustainable growth',
  },
  metadata: {
    tags: ['business', 'strategy'],
    modelHint: 'Focus on strategic thinking',
  },
};

const mockActions: AdvisorCardActions = {
  onSelect: jest.fn(),
  onUnselect: jest.fn(),
  onViewProfile: jest.fn(),
};

describe('AdvisorCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders advisor information correctly', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Business Strategy Expert')).toBeInTheDocument();
    expect(screen.getByText('Helping businesses scale and grow')).toBeInTheDocument();
    expect(screen.getByAltText('John Smith avatar')).toBeInTheDocument();
  });

  it('shows featured badge when advisor is featured', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} showFeatured />);
    expect(screen.getByText('⭐ Featured')).toBeInTheDocument();
  });

  it('hides featured badge when showFeatured is false', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} showFeatured={false} />);
    expect(screen.queryByText('⭐ Featured')).not.toBeInTheDocument();
  });

  it('shows category badge when showCategory is true', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} showCategory />);
    expect(screen.getByText('business')).toBeInTheDocument();
  });

  it('hides category badge when showCategory is false', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} showCategory={false} />);
    expect(screen.queryByText('business')).not.toBeInTheDocument();
  });

  it('shows selected state correctly', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} isSelected />);

    // Should show selected button text and icon
    expect(screen.getByText('Selected')).toBeInTheDocument();
    // Check for the CheckCircleIcon by finding the selected button specifically
    const selectedButton = screen.getByRole('button', { name: /selected/i });
    const selectedIcon = selectedButton.querySelector('svg');
    expect(selectedIcon).toBeInTheDocument();
  });

  it('shows unselected state correctly', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} isSelected={false} />);

    expect(screen.getByText('Select')).toBeInTheDocument();
    // Should show plus icon for unselected state
    const selectButton = screen.getByRole('button', { name: /select/i });
    const plusIcon = selectButton.querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  it('calls onSelect when clicking unselected advisor', async () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} isSelected={false} />);
    
    const card = screen.getByRole('button', { name: /select/i }).closest('[role="button"]') || 
                 screen.getByText('John Smith').closest('div');
    
    if (card) {
      await userEvent.click(card);
      expect(mockActions.onSelect).toHaveBeenCalledWith(mockAdvisor);
    }
  });

  it('calls onUnselect when clicking selected advisor', async () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} isSelected />);
    
    const card = screen.getByText('John Smith').closest('div');
    if (card) {
      await userEvent.click(card);
      expect(mockActions.onUnselect).toHaveBeenCalledWith(mockAdvisor);
    }
  });

  it('calls onViewProfile when clicking view profile button', async () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    const viewProfileButton = screen.getByText('View Profile');
    await userEvent.click(viewProfileButton);
    
    expect(mockActions.onViewProfile).toHaveBeenCalledWith(mockAdvisor);
  });

  it('renders compact variant correctly', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} variant="compact" />);
    
    // Compact variant should still show name and title
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Business Strategy Expert')).toBeInTheDocument();
    
    // But should not show the full bio/description
    expect(screen.queryByText('Helping businesses scale and grow')).not.toBeInTheDocument();
  });

  it('renders detailed variant correctly', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} variant="detailed" />);
    
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Business Strategy Expert')).toBeInTheDocument();
    expect(screen.getByText('Helping businesses scale and grow')).toBeInTheDocument();
    expect(screen.getByText('Experienced business strategist with 15+ years in consulting')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('15+ years in business consulting')).toBeInTheDocument();
  });

  it('shows advisor initials when no image is provided', () => {
    const advisorWithoutImage = {
      ...mockAdvisor,
      persona: {
        ...mockAdvisor.persona,
        image: undefined,
      },
    };
    
    render(<AdvisorCard advisor={advisorWithoutImage} actions={mockActions} />);
    
    // Should show initials (JS for John Smith)
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('displays specialties as badges', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} />);
    
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    // Third specialty might be truncated in default view
  });

  it('applies custom className', () => {
    render(<AdvisorCard advisor={mockAdvisor} actions={mockActions} className="custom-class" />);

    // Find the outermost card container
    const card = screen.getByText('John Smith').closest('[class*="custom-class"]');
    expect(card).toHaveClass('custom-class');
  });

  it('prevents event bubbling on action buttons', async () => {
    const cardClickSpy = jest.fn();
    
    render(
      <div onClick={cardClickSpy}>
        <AdvisorCard advisor={mockAdvisor} actions={mockActions} />
      </div>
    );
    
    const viewProfileButton = screen.getByText('View Profile');
    await userEvent.click(viewProfileButton);
    
    // Should call the action but not bubble to parent
    expect(mockActions.onViewProfile).toHaveBeenCalled();
    expect(cardClickSpy).not.toHaveBeenCalled();
  });
});

describe('AdvisorCardSkeleton Component', () => {
  it('renders default skeleton', () => {
    const { container } = render(<AdvisorCardSkeleton />);

    // Should have loading animation
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-64');
  });

  it('renders compact skeleton', () => {
    const { container } = render(<AdvisorCardSkeleton variant="compact" />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-20');
  });

  it('renders detailed skeleton', () => {
    const { container } = render(<AdvisorCardSkeleton variant="detailed" />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-80');
  });

  it('applies custom className', () => {
    const { container } = render(<AdvisorCardSkeleton className="custom-skeleton" />);

    const skeleton = container.querySelector('.custom-skeleton');
    expect(skeleton).toBeInTheDocument();
  });
});
