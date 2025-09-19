export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export type Permission =
  | 'view_advisors'
  | 'select_advisors'
  | 'chat_with_advisors'
  | 'view_payments'
  | 'make_payments'
  | 'manage_subscriptions'
  | 'view_analytics'
  | 'manage_users'
  | 'manage_advisors'
  | 'manage_billing'
  | 'access_premium_features'
  | 'access_enterprise_features';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    permissions: [
      'view_advisors',
      'select_advisors',
      'chat_with_advisors',
      'view_payments',
      'make_payments',
      'manage_subscriptions',
      'view_analytics',
      'manage_users',
      'manage_advisors',
      'manage_billing',
      'access_premium_features',
      'access_enterprise_features'
    ],
    description: 'Full system access with all permissions'
  },
  manager: {
    role: 'manager',
    permissions: [
      'view_advisors',
      'select_advisors',
      'chat_with_advisors',
      'view_payments',
      'make_payments',
      'manage_subscriptions',
      'view_analytics',
      'manage_advisors',
      'access_premium_features'
    ],
    description: 'Team management with payment and advisor access'
  },
  user: {
    role: 'user',
    permissions: [
      'view_advisors',
      'select_advisors',
      'chat_with_advisors',
      'view_payments',
      'make_payments',
      'manage_subscriptions'
    ],
    description: 'Standard user with basic advisor and payment access'
  },
  guest: {
    role: 'guest',
    permissions: [
      'view_advisors'
    ],
    description: 'Read-only access to view advisors'
  }
};

export interface SubscriptionTierPermissions {
  tier: 'basic' | 'premium' | 'enterprise';
  permissions: Permission[];
  features: string[];
}

export const SUBSCRIPTION_PERMISSIONS: Record<string, SubscriptionTierPermissions> = {
  basic: {
    tier: 'basic',
    permissions: [
      'view_advisors',
      'select_advisors',
      'chat_with_advisors',
      'view_payments',
      'make_payments'
    ],
    features: [
      'Up to 10 advisor messages per month',
      'Email support',
      'Basic analytics',
      '24-hour response time'
    ]
  },
  premium: {
    tier: 'premium',
    permissions: [
      'view_advisors',
      'select_advisors',
      'chat_with_advisors',
      'view_payments',
      'make_payments',
      'manage_subscriptions',
      'view_analytics',
      'access_premium_features'
    ],
    features: [
      'Unlimited advisor messages',
      'Priority support',
      'Advanced analytics',
      '12-hour response time',
      'Video call options',
      'Document sharing'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    permissions: [
      'view_advisors',
      'select_advisors',
      'chat_with_advisors',
      'view_payments',
      'make_payments',
      'manage_subscriptions',
      'view_analytics',
      'access_premium_features',
      'access_enterprise_features'
    ],
    features: [
      'Everything in Premium',
      'Custom advisor matching',
      'Dedicated account manager',
      '6-hour response time',
      'API access',
      'Custom integrations',
      'White-label options'
    ]
  }
};

export interface UserAccess {
  userId: string;
  role: UserRole;
  subscription?: 'basic' | 'premium' | 'enterprise';
  effectivePermissions: Permission[];
}

export function calculateEffectivePermissions(
  role: UserRole,
  subscription?: 'basic' | 'premium' | 'enterprise'
): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[role].permissions;
  const subscriptionPermissions = subscription
    ? SUBSCRIPTION_PERMISSIONS[subscription]?.permissions || []
    : [];

  // Combine role and subscription permissions (union)
  const allPermissions = new Set([...rolePermissions, ...subscriptionPermissions]);
  return Array.from(allPermissions);
}

export function hasPermission(
  userAccess: UserAccess,
  requiredPermission: Permission
): boolean {
  return userAccess.effectivePermissions.includes(requiredPermission);
}

export function canAccessFeature(
  userAccess: UserAccess,
  feature: string
): boolean {
  const subscription = userAccess.subscription;
  if (!subscription) return false;

  const subscriptionConfig = SUBSCRIPTION_PERMISSIONS[subscription];
  return subscriptionConfig?.features.includes(feature) || false;
}