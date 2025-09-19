import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { type UserAccess, type UserRole, calculateEffectivePermissions } from '@/types/rbac';

export async function GET(request: NextRequest) {
  let userId;
  try {
    const auth = getAuth(request);
    userId = auth.userId;
  } catch (error) {
    console.log('Authentication not available during build or configuration missing');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Authentication service unavailable' }
      },
      { status: 503 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      },
      { status: 401 }
    );
  }

  try {
    // In a real implementation, you would fetch user role and subscription from your database
    // For now, we'll use mock data based on user ID patterns
    let userRole: UserRole = 'user';
    let subscription: 'basic' | 'premium' | 'enterprise' | undefined;

    // Mock role assignment based on user ID patterns
    if (userId.includes('admin')) {
      userRole = 'admin';
      subscription = 'enterprise';
    } else if (userId.includes('manager')) {
      userRole = 'manager';
      subscription = 'premium';
    } else if (userId.includes('premium')) {
      userRole = 'user';
      subscription = 'premium';
    }

    const userAccess: UserAccess = {
      userId,
      role: userRole,
      subscription,
      effectivePermissions: calculateEffectivePermissions(userRole, subscription)
    };

    return NextResponse.json({
      success: true,
      userAccess
    });

  } catch (error) {
    console.error('Error fetching user access:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user access' }
      },
      { status: 500 }
    );
  }
}