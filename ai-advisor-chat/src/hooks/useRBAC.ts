'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  type UserAccess,
  type Permission,
  type UserRole,
  calculateEffectivePermissions,
  hasPermission,
  canAccessFeature
} from '../types/rbac';

interface UseRBACReturn {
  userAccess: UserAccess | null;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccessFeature: (feature: string) => boolean;
  refreshAccess: () => Promise<void>;
  error: string | null;
}

export function useRBAC(): UseRBACReturn {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAccess = async () => {
    if (!userId || !isSignedIn) {
      setUserAccess(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/roles/user-access', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user access: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.userAccess) {
        setUserAccess(data.userAccess);
      } else {
        // Fallback to basic user access
        const fallbackAccess: UserAccess = {
          userId,
          role: 'user',
          effectivePermissions: calculateEffectivePermissions('user')
        };
        setUserAccess(fallbackAccess);
      }
    } catch (err) {
      console.error('Error fetching user access:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user permissions');

      // Fallback to guest access
      const fallbackAccess: UserAccess = {
        userId,
        role: 'guest',
        effectivePermissions: calculateEffectivePermissions('guest')
      };
      setUserAccess(fallbackAccess);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchUserAccess();
    }
  }, [userId, isLoaded, isSignedIn]);

  const checkPermission = (permission: Permission): boolean => {
    if (!userAccess) return false;
    return hasPermission(userAccess, permission);
  };

  const checkFeatureAccess = (feature: string): boolean => {
    if (!userAccess) return false;
    return canAccessFeature(userAccess, feature);
  };

  return {
    userAccess,
    isLoading,
    hasPermission: checkPermission,
    canAccessFeature: checkFeatureAccess,
    refreshAccess: fetchUserAccess,
    error
  };
}