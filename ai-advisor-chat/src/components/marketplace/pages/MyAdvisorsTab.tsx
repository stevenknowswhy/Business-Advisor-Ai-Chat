"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { 
  SelectedAdvisorsGrid,
  AdvisorGrid 
} from '../components';
import { Button, ConfirmationModal } from '../../ui';
import { useMarketplaceState } from '../hooks';
import type { 
  MarketplaceAdvisor, 
  AdvisorCardActions 
} from '../types/marketplace';

export interface MyAdvisorsTabProps {
  className?: string;
  onAdvisorUnselect?: (advisor: MarketplaceAdvisor) => void;
  onAdvisorViewProfile?: (advisor: MarketplaceAdvisor) => void;
  onNavigateToMarketplace?: () => void;
  onStartChat?: (advisors: MarketplaceAdvisor[]) => void;
  onStartChatWithAdvisor?: (advisor: MarketplaceAdvisor) => void;
  hideCtaInitially?: boolean;
}

export const MyAdvisorsTab: React.FC<MyAdvisorsTabProps> = ({
  className,
  onAdvisorUnselect,
  onAdvisorViewProfile,
  onNavigateToMarketplace,
  onStartChat,
  onStartChatWithAdvisor,
  hideCtaInitially,
}) => {
  const router = useRouter();
  const [confirmRemove, setConfirmRemove] = useState<MarketplaceAdvisor | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Use the marketplace state hook
  const {
    selectedAdvisors,
    loading,
    error,
    unselectAdvisor,
  } = useMarketplaceState();

  // Handle advisor removal
  const handleRemoveAdvisor = async (advisor: MarketplaceAdvisor) => {
    setConfirmRemove(advisor);
  };

  const confirmRemoveAdvisor = async () => {
    if (!confirmRemove) return;
    
    setIsRemoving(true);
    try {
      await unselectAdvisor(confirmRemove._id);
      onAdvisorUnselect?.(confirmRemove);
    } catch (error: any) {
      console.error('Failed to remove advisor:', error);

      // Check if it's an authentication error
      if (error?.message?.includes('sign in')) {
        // Redirect to sign-in page
        router.push('/sign-in');
      } else {
        // Handle other errors (could show a toast notification)
        console.error('Removal failed:', error?.message || 'Unknown error');
      }
    } finally {
      setIsRemoving(false);
      setConfirmRemove(null);
    }
  };

  // Create advisor card actions
  const advisorActions: AdvisorCardActions = {
    onSelect: () => {
      // Not used in this context since all advisors are already selected
    },
    onUnselect: async (advisor) => {
      try {
        await unselectAdvisor(advisor._id);
        onAdvisorUnselect?.(advisor);
      } catch (error: any) {
        console.error('Failed to remove advisor:', error);
      }
    },
    onViewProfile: (advisor) => {
      onAdvisorViewProfile?.(advisor);
    },
  };

  // Group advisors by category for better organization
  const advisorsByCategory = selectedAdvisors.reduce((acc, advisor) => {
    const category = advisor.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(advisor);
    return acc;
  }, {} as Record<string, MarketplaceAdvisor[]>);

  const categories = Object.keys(advisorsByCategory);

  const [ctaHidden, setCtaHidden] = useState<boolean>(!!hideCtaInitially);

  React.useEffect(() => {
    if (hideCtaInitially) {
      const t = setTimeout(() => setCtaHidden(false), 150);
      return () => clearTimeout(t);
    }
  }, [hideCtaInitially]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <UserGroupIcon className="w-8 h-8" />
            <span>Your Advisors</span>
            <span className="sr-only">My Advisors</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your selected advisors and start conversations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToMarketplace}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add More Advisors</span>
          </Button>
          
          {selectedAdvisors.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStartChat?.(selectedAdvisors)}
              className="flex items-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Start Group Chat</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {selectedAdvisors.length > 1 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedAdvisors.length}
              </div>
              <div className="text-sm text-gray-600">
                Selected Advisor{selectedAdvisors.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">
                Categor{categories.length !== 1 ? 'ies' : 'y'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedAdvisors.filter(a => a.featured).length}
              </div>
              <div className="text-sm text-gray-600">
                Featured Advisor{selectedAdvisors.filter(a => a.featured).length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advisors Grid */}
      {selectedAdvisors.length === 0 ? (
        // Empty state
        <div className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Advisors Selected
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't selected any advisors yet. Browse the marketplace to discover
            expert advisors and build your advisory board.
          </p>
          <Button
            variant="primary"
            aria-label="Browse Marketplace"
            aria-hidden={ctaHidden || undefined}
            tabIndex={ctaHidden ? -1 : undefined}
            onClick={onNavigateToMarketplace}
            className="flex items-center space-x-2 mx-auto"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Browse Advisors</span>
          </Button>
        </div>
      ) : (
        // Show advisors grouped by category
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryAdvisors = advisorsByCategory[category];

            if (!categoryAdvisors) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {category} ({categoryAdvisors.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStartChat?.(categoryAdvisors)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Chat with {category} team
                  </Button>
                </div>
                
                <AdvisorGrid
                  advisors={categoryAdvisors}
                  selectedAdvisorIds={categoryAdvisors.map(a => a._id)}
                  actions={{
                    ...advisorActions,
                    onSelect: (advisor) => onStartChatWithAdvisor?.(advisor),
                  }}
                  loading={loading.selectedAdvisors}
                  error={error.selectedAdvisors}
                  variant="default"
                  columns={3}
                  showCategory={false} // Don't show category since they're grouped
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {selectedAdvisors.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => onStartChat?.(selectedAdvisors)}
              className="flex items-center space-x-2 justify-center"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Start Group Discussion</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={onNavigateToMarketplace}
              className="flex items-center space-x-2 justify-center"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add More Advisors</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // This could open a modal to remove all advisors
                console.log('Manage all advisors');
              }}
              className="flex items-center space-x-2 justify-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Remove All</span>
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={confirmRemoveAdvisor}
        title="Remove Advisor"
        message={`Are you sure you want to remove ${confirmRemove?.name} from your advisory board? You can always add them back later.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        loading={isRemoving}
      />
    </div>
  );
};
