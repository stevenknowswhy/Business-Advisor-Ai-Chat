"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterDropdownProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export const FilterDropdown = React.forwardRef<HTMLButtonElement, FilterDropdownProps>(
  ({ 
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    label,
    size = 'md',
    disabled = false,
    clearable = true,
    className,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    };

    const selectedOption = options.find(option => option.value === value);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleSelect = (optionValue: string) => {
      if (value === optionValue && clearable) {
        onChange?.(undefined);
      } else {
        onChange?.(optionValue);
      }
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(undefined);
      setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleToggle();
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          }
          break;
      }
    };

    return (
      <div className={clsx('relative', className)} ref={dropdownRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <button
          ref={ref}
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            'relative w-full bg-white border border-gray-300 rounded-md shadow-sm',
            'flex items-center justify-between',
            'text-left cursor-default',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'transition-colors',
            sizes[size],
            isOpen && 'ring-2 ring-blue-500 border-blue-500'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label || placeholder}
          {...props}
        >
          <span className={clsx(
            'block truncate',
            !selectedOption && 'text-gray-500'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <div className="flex items-center">
            {selectedOption && clearable && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Clear selection"
                title="Clear selection"
              >
                ×
              </button>
            )}
            <ChevronDownIcon 
              className={clsx(
                'w-5 h-5 text-gray-400 transition-transform',
                isOpen && 'transform rotate-180'
              )} 
              aria-hidden="true"
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={clsx(
                    'w-full text-left px-4 py-2 text-sm cursor-pointer',
                    'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                    'flex items-center justify-between',
                    value === option.value && 'bg-blue-50 text-blue-600'
                  )}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span className="flex items-center">
                    <span className="block truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-2 text-gray-500">({option.count})</span>
                    )}
                  </span>
                  {value === option.value && (
                    <CheckIcon className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
);

FilterDropdown.displayName = 'FilterDropdown';
