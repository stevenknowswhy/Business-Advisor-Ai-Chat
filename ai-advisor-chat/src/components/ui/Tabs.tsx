"use client";

import React from 'react';

export interface TabType {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabType[];
  activeTab: TabType | string;
  onTabChange: (tab: TabType | string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'default'
}) => {
  const getTabClasses = (tab: TabType) => {
    const isActive = activeTab === tab.id || activeTab === tab;

    switch (variant) {
      case 'pills':
        return `
          px-4 py-2 text-sm font-medium rounded-md transition-colors
          ${isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
          ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `;

      case 'underline':
        return `
          px-1 py-2 text-sm font-medium border-b-2 transition-colors
          ${isActive
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }
          ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `;

      default:
        return `
          px-4 py-2 text-sm font-medium border-b-2 transition-colors
          ${isActive
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }
          ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `;
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'pills':
        return 'flex space-x-1 bg-gray-100 rounded-lg p-1';
      case 'underline':
        return 'flex space-x-8 border-b border-gray-200';
      default:
        return 'flex space-x-8 border-b border-gray-200';
    }
  };

  return (
    <div className={getContainerClasses()}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={getTabClasses(tab)}
          onClick={() => !tab.disabled && onTabChange(tab.id || tab)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id || activeTab === tab}
          role="tab"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};