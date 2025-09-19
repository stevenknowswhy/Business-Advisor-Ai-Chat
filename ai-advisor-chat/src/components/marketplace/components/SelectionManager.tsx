"use client";

import React, { useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Button, Badge } from '../../ui';
import type { MarketplaceAdvisor } from '../types/marketplace';

export interface SelectionManagerProps {
  selectedAdvisors: MarketplaceAdvisor[];
  maxSelections?: number;
  onSelectionChange?: (advisors: MarketplaceAdvisor[]) => void;
  onStartChat?: (advisors: MarketplaceAdvisor[]) => void;
  onManageAdvisors?: () => void;
  onClearSelection?: () => void;
  className?: string;
}

export const SelectionManager: React.FC<SelectionManagerProps> = ({
  selectedAdvisors,
  maxSelections = 10,
  onSelectionChange,
  onStartChat,
  onManageAdvisors,
  onClearSelection,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStartChat = useCallback(() => {
    if (selectedAdvisors.length > 0) {
      onStartChat?.(selectedAdvisors);
    }
  }, [selectedAdvisors, onStartChat]);

  const handleClearSelection = useCallback(() => {
    onClearSelection?.();
    onSelectionChange?.([]);
  }, [onClearSelection, onSelectionChange]);

  const handleRemoveAdvisor = useCallback((advisorToRemove: MarketplaceAdvisor) => {
    const updatedSelection = selectedAdvisors.filter(
      advisor => advisor._id !== advisorToRemove._id
    );
    onSelectionChange?.(updatedSelection);
  }, [selectedAdvisors, onSelectionChange]);

  const selectionCount = selectedAdvisors.length;
  const isAtLimit = selectionCount >= maxSelections;
  const showWarning = selectionCount >= maxSelections * 0.8;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Selection Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                {selectionCount} advisor{selectionCount !== 1 ? 's' : ''} selected
              </span>
              {showWarning && (
                <Badge variant="warning" size="sm">
                  {selectionCount}/{maxSelections}
                </Badge>
              )}
            </div>

            {selectionCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isExpanded ? 'Hide' : 'Show'} Details
                <ArrowPathIcon className={`w-4 h-4 ml-1 transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>

          {selectionCount > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-red-600 hover:text-red-700"
              >
                <XCircleIcon className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {selectionCount === 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Select advisors from the marketplace to add them to your advisory board.
          </p>
        )}

        {isAtLimit && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              You've reached the maximum number of advisors ({maxSelections}).
              Remove some advisors to add new ones.
            </p>
          </div>
        )}
      </div>

      {/* Selected Advisors List */}
      {isExpanded && selectionCount > 0 && (
        <div className="p-4 border-b border-gray-200 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedAdvisors.map((advisor) => (
              <div
                key={advisor._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {advisor.image ? (
                      <img
                        src={advisor.image}
                        alt={advisor.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {advisor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {advisor.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {advisor.title}
                    </p>
                    {advisor.teamAffiliations && advisor.teamAffiliations.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-400">Team:</span>
                        <span className="text-xs text-blue-600 font-medium">
                          {advisor.teamAffiliations[0]?.teamName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAdvisor(advisor)}
                  className="text-red-600 hover:text-red-700 flex-shrink-0"
                  title="Remove advisor"
                >
                  <XCircleIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectionCount > 0 && (
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onManageAdvisors}
              className="flex-1"
            >
              <UserGroupIcon className="w-4 h-4 mr-2" />
              Manage My Advisors
            </Button>

            <Button
              variant="primary"
              onClick={handleStartChat}
              className="flex-1"
              disabled={selectionCount === 0}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Start Chatting
              {selectionCount > 0 && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {selectionCount}
                </Badge>
              )}
            </Button>
          </div>

          {selectionCount === 1 && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Ready to chat with {selectedAdvisors[0]?.name}?
            </p>
          )}

          {selectionCount > 1 && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Start a group conversation with all {selectionCount} selected advisors
            </p>
          )}
        </div>
      )}
    </div>
  );
};