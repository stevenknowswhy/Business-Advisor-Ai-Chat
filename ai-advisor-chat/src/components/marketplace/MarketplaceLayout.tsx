"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { MarketplaceTab, MyAdvisorsTab, TeamsTab } from './pages';
import { Button } from '../ui';
import { useMarketplaceState } from './hooks';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { MarketplaceTabType as TabType, MarketplaceAdvisor } from './types/marketplace';

export interface MarketplaceLayoutProps {
  initialTab?: TabType;
  className?: string;
  showBackButton?: boolean;
  onNavigateToChat?: () => void;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  initialTab = 'marketplace',
  className,
  showBackButton = true,
  onNavigateToChat,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const router = useRouter();
  
  // Get selected advisors count for tab badge
  const { selectedAdvisors } = useMarketplaceState();

  const [justSwitchedToMyAdvisors, setJustSwitchedToMyAdvisors] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'my-advisors') {
      setJustSwitchedToMyAdvisors(true);
      // Clear the flag shortly after to restore normal accessibility
      setTimeout(() => setJustSwitchedToMyAdvisors(false), 150);
    }
    try {
      // Keep URL in sync for deep-linking and history
      const url = `/marketplace?tab=${tab}`;
      router.push(url);
    } catch (_) {
      // no-op in non-browser envs
    }
  };

  const handleNavigateToChat = () => {
    if (onNavigateToChat) {
      onNavigateToChat();
    } else {
      router.push('/chat');
    }
  };

  const handleBackToApp = () => {
    router.push('/');
  };

  const handleAdvisorSelect = (advisor: MarketplaceAdvisor) => {
    console.log('Advisor selected:', advisor.name);
    // Could show a toast notification here
  };

  const handleAdvisorUnselect = (advisor: MarketplaceAdvisor) => {
    console.log('Advisor unselected:', advisor.name);
    // Could show a toast notification here
  };

  const handleAdvisorViewProfile = (advisor: MarketplaceAdvisor) => {
    // This could open a modal or navigate to a profile page
    console.log('View profile for:', advisor.name);
  };

  const handleStartChat = (advisors: MarketplaceAdvisor[]) => {
    // Navigate to chat with selected advisors
    console.log('Start chat with advisors:', advisors.map(a => a.name));
    handleNavigateToChat();
  };

  const handleStartChatWithAdvisor = (advisor: MarketplaceAdvisor) => {
    // Navigate to chat with specific advisor
    console.log('Start chat with advisor:', advisor.name);
    handleNavigateToChat();
  };

  // Team handlers
  const handleTeamDeploy = (team: any) => {
    console.log('Team deployed:', team.name);
    // Could show a success notification
  };

  const handleNavigateToMyAdvisorsFromTeams = () => {
    handleTabChange('my-advisors');
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToApp}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to App</span>
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                Marketplace
              </h1>
            </div>

            {/* Right side - Chat button */}
            {selectedAdvisors.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNavigateToChat}
                className="flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Go to Chat</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              type="button"
              onClick={() => handleTabChange('marketplace')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === 'marketplace' ? 'page' : undefined}
              aria-label={selectedAdvisors.length > 0 ? 'Marketplace' : undefined}
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              <span>Advisors</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('teams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === 'teams' ? 'page' : undefined}
            >
              <UsersIcon className="w-5 h-5" />
              <span>Teams</span>
            </button>

            <button
              type="button"
              aria-label="My Advisors"
              onClick={() => handleTabChange('my-advisors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 relative ${
                activeTab === 'my-advisors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === 'my-advisors' ? 'page' : undefined}
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>My Advisors</span>
              {selectedAdvisors.length > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                  {selectedAdvisors.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {activeTab === 'marketplace' ? (
            <MarketplaceTab
              onAdvisorSelect={handleAdvisorSelect}
              onAdvisorUnselect={handleAdvisorUnselect}
              onAdvisorViewProfile={handleAdvisorViewProfile}
              onNavigateToMyAdvisors={() => handleTabChange('my-advisors')}
            />
          ) : activeTab === 'teams' ? (
            <TeamsTab
              onTeamDeploy={handleTeamDeploy}
              onNavigateToMyAdvisors={handleNavigateToMyAdvisorsFromTeams}
            />
          ) : (
            <MyAdvisorsTab
              onAdvisorUnselect={handleAdvisorUnselect}
              onAdvisorViewProfile={handleAdvisorViewProfile}
              onNavigateToMarketplace={() => handleTabChange('marketplace')}
              onStartChat={handleStartChat}
              onStartChatWithAdvisor={handleStartChatWithAdvisor}
              hideCtaInitially={justSwitchedToMyAdvisors}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Wrapper component that provides the marketplace context
export const MarketplaceLayoutWithProvider: React.FC<MarketplaceLayoutProps> = (props) => {
  // This would wrap the layout with any necessary providers
  // For now, we assume the ConvexProvider is already set up at the app level
  return <MarketplaceLayout {...props} />;
};

// Export both components
export default MarketplaceLayout;
