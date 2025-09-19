import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
import { SearchInput } from '~/components/ui/SearchInput';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('SearchInput Component', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders with default props', () => {
    render(<SearchInput />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search...');
    expect(screen.getByLabelText('Search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Search advisors..." />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Search advisors...');
  });

  it('shows search icon', () => {
    render(<SearchInput />);
    const searchIcon = screen.getByRole('textbox').parentElement?.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('handles controlled value', () => {
    const { rerender } = render(<SearchInput value="test" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test');

    rerender(<SearchInput value="updated" />);
    expect(input.value).toBe('updated');
  });

  it('calls onChange with debounce', async () => {
    const handleChange = jest.fn();
    const handleSearch = jest.fn();
    
    render(
      <SearchInput 
        onChange={handleChange} 
        onSearch={handleSearch}
        debounceMs={300}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Type quickly
    await user.type(input, 'test');
    
    // Should not call immediately
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleSearch).not.toHaveBeenCalled();
    
    // Fast-forward time
    jest.advanceTimersByTime(300);
    
    // Should call after debounce
    expect(handleChange).toHaveBeenCalledWith('test');
    expect(handleSearch).toHaveBeenCalledWith('test');
  });

  it('shows clear button when there is text', async () => {
    render(<SearchInput />);
    const input = screen.getByRole('textbox');
    
    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    
    // Type text
    await user.type(input, 'test');
    
    // Clear button should appear
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const handleChange = jest.fn();
    const handleClear = jest.fn();
    
    render(
      <SearchInput 
        onChange={handleChange}
        onClear={handleClear}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Type text
    await user.type(input, 'test');
    jest.advanceTimersByTime(300);
    
    // Click clear button
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    
    // Should clear input and call handlers
    expect((input as HTMLInputElement).value).toBe('');
    expect(handleChange).toHaveBeenCalledWith('');
    expect(handleClear).toHaveBeenCalled();
  });

  it('handles Enter key press', async () => {
    const handleSearch = jest.fn();
    
    render(<SearchInput onSearch={handleSearch} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    await user.keyboard('{Enter}');
    
    expect(handleSearch).toHaveBeenCalledWith('test');
  });

  it('handles Escape key press', async () => {
    const handleClear = jest.fn();
    
    render(<SearchInput onClear={handleClear} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    await user.keyboard('{Escape}');
    
    expect((input as HTMLInputElement).value).toBe('');
    expect(handleClear).toHaveBeenCalled();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<SearchInput size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-8', 'text-sm');

    rerender(<SearchInput size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-10', 'text-base');

    rerender(<SearchInput size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-12', 'text-lg');
  });

  it('handles fullWidth prop', () => {
    render(<SearchInput fullWidth />);
    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveClass('w-full');
  });

  it('handles disabled state', () => {
    render(<SearchInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:cursor-not-allowed');
    
    // Clear button should not appear when disabled
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<SearchInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<SearchInput className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('cleans up debounce timer on unmount', () => {
    const { unmount } = render(<SearchInput debounceMs={300} />);
    
    // Start typing
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Unmount before debounce completes
    unmount();
    
    // Should not throw or cause memory leaks
    jest.advanceTimersByTime(300);
  });
});
