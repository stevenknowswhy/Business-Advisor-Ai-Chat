import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';
// Note: Id type from Convex is not used in this API

// Zod schema for role assignment
const assignRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['user', 'subscriber', 'advisor', 'admin']),
  assignedBy: z.string().optional(),
});

// Zod schema for role removal
const removeRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['user', 'subscriber', 'advisor', 'admin']),
});

// Role permissions configuration
const rolePermissions = {
  user: [
    'browse_advisors',
    'view_profile',
    'create_messages',
    'view_conversations',
  ],
  subscriber: [
    'browse_advisors',
    'view_profile',
    'create_messages',
    'view_conversations',
    'send_unlimited_messages',
    'priority_support',
    'view_analytics',
  ],
  advisor: [
    'browse_advisors',
    'view_profile',
    'create_messages',
    'view_conversations',
    'send_unlimited_messages',
    'priority_support',
    'view_analytics',
    'create_advisor_profile',
    'edit_advisor_profile',
    'view_advisor_analytics',
    'manage_appointments',
  ],
  admin: [
    'browse_advisors',
    'view_profile',
    'create_messages',
    'view_conversations',
    'send_unlimited_messages',
    'priority_support',
    'view_analytics',
    'create_advisor_profile',
    'edit_advisor_profile',
    'view_advisor_analytics',
    'manage_appointments',
    'manage_users',
    'manage_advisors',
    'manage_subscriptions',
    'view_system_analytics',
    'manage_content',
    'moderate_reviews',
    'access_admin_panel',
  ],
};

// Role hierarchy for permission inheritance
const roleHierarchy = {
  user: 0,
  subscriber: 1,
  advisor: 2,
  admin: 3,
};

// In-memory storage for development (replace with database in production)
let userRoles: Map<string, { userId: string; role: string; permissions: string[]; assignedAt: number; assignedBy?: string }[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has permission to assign roles
    const currentUserRoles = userRoles.get(userId) || [];
    const hasAdminPermission = currentUserRoles.some(role => role.role === 'admin');

    if (!hasAdminPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId, role, assignedBy } = assignRoleSchema.parse(body);

    // Validate target user exists
    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_USER',
            message: 'Target user ID is required'
          }
        },
        { status: 400 }
      );
    }

    // Get current roles for target user
    const currentUserRolesList = userRoles.get(targetUserId) || [];

    // Check if role already exists
    const existingRole = currentUserRolesList.find(r => r.role === role);
    if (existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROLE_ALREADY_EXISTS',
            message: `User already has role: ${role}`
          }
        },
        { status: 400 }
      );
    }

    // Create new role assignment
    const newRole = {
      userId: targetUserId,
      role,
      permissions: rolePermissions[role],
      assignedAt: Date.now(),
      assignedBy: assignedBy || userId,
    };

    // Add role to user
    const updatedRoles = [...currentUserRolesList, newRole];
    userRoles.set(targetUserId, updatedRoles);

    console.log(`Role ${role} assigned to user ${targetUserId} by ${assignedBy || userId}`);

    return NextResponse.json({
      success: true,
      data: {
        role: newRole,
        userRoles: updatedRoles,
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Role assignment error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to assign role'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // Users can only view their own roles unless they're admins
    if (targetUserId && targetUserId !== userId) {
      const currentUserRoles = userRoles.get(userId) || [];
      const hasAdminPermission = currentUserRoles.some(role => role.role === 'admin');

      if (!hasAdminPermission) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    const requestedUserId = targetUserId || userId;
    const roles = userRoles.get(requestedUserId) || [];

    // Calculate all permissions based on role hierarchy
    const allPermissions = new Set<string>();
    roles.forEach(role => {
      const roleLevel = roleHierarchy[role.role as keyof typeof roleHierarchy];

      // Add permissions from this role and all lower roles
      Object.entries(roleHierarchy).forEach(([roleName, level]) => {
        if (level <= roleLevel) {
          rolePermissions[roleName as keyof typeof rolePermissions].forEach(permission => {
            allPermissions.add(permission);
          });
        }
      });
    });

    const response = {
      userId: requestedUserId,
      roles: roles.map(role => ({
        userId: role.userId,
        role: role.role,
        permissions: role.permissions,
        assignedAt: role.assignedAt,
        assignedBy: role.assignedBy,
      })),
      permissions: Array.from(allPermissions),
      roleLevel: Math.max(...roles.map(role => roleHierarchy[role.role as keyof typeof roleHierarchy]), 0),
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Role retrieval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve roles'
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has permission to remove roles
    const currentUserRoles = userRoles.get(userId) || [];
    const hasAdminPermission = currentUserRoles.some(role => role.role === 'admin');

    if (!hasAdminPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId, role } = removeRoleSchema.parse(body);

    // Get current roles for target user
    const currentUserRolesList = userRoles.get(targetUserId) || [];

    // Check if role exists
    const roleIndex = currentUserRolesList.findIndex(r => r.role === role);
    if (roleIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: `User does not have role: ${role}`
          }
        },
        { status: 400 }
      );
    }

    // Remove role
    const updatedRoles = currentUserRolesList.filter(r => r.role !== role);
    userRoles.set(targetUserId, updatedRoles);

    console.log(`Role ${role} removed from user ${targetUserId} by ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        removedRole: role,
        userRoles: updatedRoles,
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Role removal error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove role'
        }
      },
      { status: 500 }
    );
  }
}

// List all available roles and permissions
export async function OPTIONS(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const currentUserRoles = userRoles.get(userId) || [];
    const hasAdminPermission = currentUserRoles.some(role => role.role === 'admin');

    if (!hasAdminPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const roleList = Object.entries(rolePermissions).map(([role, permissions]) => ({
      role,
      permissions,
      description: getRoleDescription(role as keyof typeof rolePermissions),
      hierarchyLevel: roleHierarchy[role as keyof typeof roleHierarchy],
    }));

    return NextResponse.json({
      success: true,
      data: {
        roles: roleList,
        hierarchy: roleHierarchy,
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Role list error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list roles'
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to get role descriptions
function getRoleDescription(role: keyof typeof rolePermissions): string {
  switch (role) {
    case 'user':
      return 'Basic user with limited access to browse advisors and send messages';
    case 'subscriber':
      return 'Paid subscriber with unlimited messaging and priority support';
    case 'advisor':
      return 'Advisor with profile management and advanced analytics access';
    case 'admin':
      return 'Administrator with full system access and management capabilities';
    default:
      return 'Unknown role';
  }
}