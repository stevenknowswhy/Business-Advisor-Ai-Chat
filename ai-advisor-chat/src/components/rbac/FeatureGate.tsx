'use client';

import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { Button } from '../ui';

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  upgradePrompt?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({
  feature,
  fallback = null,
  upgradePrompt,
  children
}: FeatureGateProps) {
  const { canAccessFeature, isLoading } = useRBAC();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (!canAccessFeature(feature)) {
    if (upgradePrompt) {
      return <>{upgradePrompt}</>;
    }

    const defaultUpgradePrompt = (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upgrade Required
        </h3>
        <p className="text-gray-600 mb-4">
          This feature is available with a premium subscription.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/marketplace'}>
          View Plans
        </Button>
      </div>
    );

    return <>{fallback || defaultUpgradePrompt}</>;
  }

  return <>{children}</>;
}