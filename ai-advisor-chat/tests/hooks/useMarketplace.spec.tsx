import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useQuery, useMutation } from 'convex/react';
import {
  useMarketplaceAdvisors,
  useSelectedAdvisors,
  useAdvisorSelection,
  useMarketplaceState,
} from '~/components/marketplace/hooks/useMarketplace';

// Mock Convex hooks
jest.mock('convex/react');

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

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
];

const mockSelectedAdvisors = [mockAdvisors[0]];

describe('useMarketplaceAdvisors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns advisors data correctly', () => {
    mockUseQuery.mockReturnValue(mockAdvisors);

    const { result } = renderHook(() => useMarketplaceAdvisors());

    expect(result.current.advisors).toEqual(mockAdvisors);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles loading state', () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useMarketplaceAdvisors());

    expect(result.current.advisors).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('passes filters to query', () => {
    const filters = { category: 'business', featured: true };
    mockUseQuery.mockReturnValue(mockAdvisors);

    renderHook(() => useMarketplaceAdvisors(filters));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.any(Object), // api.marketplace.getMarketplaceAdvisors
      filters
    );
  });

  it('provides refetch function', () => {
    mockUseQuery.mockReturnValue(mockAdvisors);

    const { result } = renderHook(() => useMarketplaceAdvisors());

    expect(typeof result.current.refetch).toBe('function');
    
    // Refetch should be a no-op for Convex (auto-refetching)
    act(() => {
      result.current.refetch();
    });
    
    // Should not throw or cause issues
  });
});

describe('useSelectedAdvisors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns selected advisors correctly', () => {
    mockUseQuery.mockReturnValue(mockSelectedAdvisors);

    const { result } = renderHook(() => useSelectedAdvisors());

    expect(result.current.selectedAdvisors).toEqual(mockSelectedAdvisors);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles loading state', () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useSelectedAdvisors());

    expect(result.current.selectedAdvisors).toEqual([]);
    expect(result.current.loading).toBe(true);
  });
});

describe('useAdvisorSelection', () => {
  const mockSelectMutation = jest.fn();
  const mockUnselectMutation = jest.fn();
  const mockSelectTeamMutation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation
      .mockReturnValueOnce(mockSelectMutation)
      .mockReturnValueOnce(mockUnselectMutation)
      .mockReturnValueOnce(mockSelectTeamMutation);
  });

  it('provides selection functions', () => {
    const { result } = renderHook(() => useAdvisorSelection());

    expect(typeof result.current.selectAdvisor).toBe('function');
    expect(typeof result.current.unselectAdvisor).toBe('function');
    expect(typeof result.current.selectTeam).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles successful advisor selection', async () => {
    const selectionId = 'selection-1';
    mockSelectMutation.mockResolvedValue(selectionId);

    const { result } = renderHook(() => useAdvisorSelection());

    const selectionResult = await act(async () => {
      return result.current.selectAdvisor('advisor-1' as any);
    });

    expect(mockSelectMutation).toHaveBeenCalledWith({
      advisorId: 'advisor-1',
      source: 'manual',
      teamId: undefined,
    });

    expect(selectionResult).toEqual({
      success: true,
      advisorId: 'advisor-1',
      selectionId,
      alreadySelected: false,
    });
  });

  it('handles advisor selection error', async () => {
    const error = new Error('Already selected');
    mockSelectMutation.mockRejectedValue(error);

    const { result } = renderHook(() => useAdvisorSelection());

    const selectionResult = await act(async () => {
      return result.current.selectAdvisor('advisor-1' as any);
    });

    expect(selectionResult).toEqual({
      success: false,
      advisorId: 'advisor-1',
      error: 'Already selected',
      alreadySelected: true,
    });
  });

  it('handles successful advisor unselection', async () => {
    mockUnselectMutation.mockResolvedValue(true);

    const { result } = renderHook(() => useAdvisorSelection());

    const unselectResult = await act(async () => {
      return result.current.unselectAdvisor('advisor-1' as any);
    });

    expect(mockUnselectMutation).toHaveBeenCalledWith({
      advisorId: 'advisor-1',
    });
    expect(unselectResult).toBe(true);
  });

  it('handles team selection', async () => {
    const teamResults = [
      { success: true, advisorId: 'advisor-1', selectionId: 'sel-1' },
      { success: false, advisorId: 'advisor-2', error: 'Already selected', alreadySelected: true },
    ];
    mockSelectTeamMutation.mockResolvedValue(teamResults);

    const { result } = renderHook(() => useAdvisorSelection());

    const teamResult = await act(async () => {
      return result.current.selectTeam('team-1');
    });

    expect(mockSelectTeamMutation).toHaveBeenCalledWith({
      teamId: 'team-1',
    });

    expect(teamResult).toEqual({
      success: true,
      teamId: 'team-1',
      results: teamResults,
      totalSelected: 1,
      totalFailed: 1,
    });
  });
});

describe('useMarketplaceState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseQuery
      .mockReturnValueOnce(mockAdvisors) // marketplace advisors
      .mockReturnValueOnce(mockSelectedAdvisors) // selected advisors
      .mockReturnValueOnce([]) // team templates
      .mockReturnValueOnce([]); // search results

    mockUseMutation
      .mockReturnValue(jest.fn()) // select advisor
      .mockReturnValue(jest.fn()) // unselect advisor
      .mockReturnValue(jest.fn()); // select team
  });

  it('provides comprehensive marketplace state', () => {
    const { result } = renderHook(() => useMarketplaceState());

    expect(result.current.advisors).toEqual(mockAdvisors);
    expect(result.current.selectedAdvisors).toEqual(mockSelectedAdvisors);
    expect(result.current.teamTemplates).toEqual([]);
    expect(result.current.searchResults).toEqual([]);

    expect(result.current.loading).toEqual({
      advisors: false,
      selectedAdvisors: false,
      teamTemplates: false,
      search: false,
      selection: false,
    });

    expect(result.current.error).toEqual({
      advisors: null,
      selectedAdvisors: null,
      teamTemplates: null,
      search: null,
      selection: null,
    });

    expect(result.current.filters).toEqual({});
    expect(typeof result.current.updateFilters).toBe('function');
    expect(typeof result.current.clearFilters).toBe('function');
    expect(typeof result.current.selectAdvisor).toBe('function');
    expect(typeof result.current.unselectAdvisor).toBe('function');
    expect(typeof result.current.selectTeam).toBe('function');
    expect(typeof result.current.search).toBe('function');
    expect(typeof result.current.clearSearch).toBe('function');
  });

  it('handles filter updates', () => {
    const { result } = renderHook(() => useMarketplaceState());

    act(() => {
      result.current.updateFilters({ category: 'business' });
    });

    expect(result.current.filters).toEqual({ category: 'business' });

    act(() => {
      result.current.updateFilters({ featured: true });
    });

    expect(result.current.filters).toEqual({ category: 'business', featured: true });
  });

  it('handles filter clearing', () => {
    const initialFilters = { category: 'business', featured: true };
    const { result } = renderHook(() => useMarketplaceState(initialFilters));

    expect(result.current.filters).toEqual(initialFilters);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it('provides refetch functions', () => {
    const { result } = renderHook(() => useMarketplaceState());

    expect(result.current.refetch).toEqual({
      advisors: expect.any(Function),
      selectedAdvisors: expect.any(Function),
      teamTemplates: expect.any(Function),
    });
  });
});
