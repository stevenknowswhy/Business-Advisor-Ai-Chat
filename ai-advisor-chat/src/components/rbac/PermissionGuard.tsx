'use client';

import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { type Permission } from '../../types/rbac';
import { Button } from '../ui';

interface PermissionGuardProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  permission,
  fallback = null,
  children,
  showError = false
}: PermissionGuardProps) {
  const { hasPermission, isLoading, error } = useRBAC();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking permissions...</span>
      </div>
    );
  }

  if (error && showError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">
          Permission check failed: {error}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}