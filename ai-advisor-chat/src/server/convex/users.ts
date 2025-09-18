import { convex } from "./client";

/**
 * Convex-based user utilities
 * These handle user synchronization between Clerk and Convex
 */

/**
 * Sync user from Clerk to Convex (temporary migration version)
 */
export async function syncUserToConvex(userData: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  plan?: string;
}) {
  // For now, we'll just return the user data since we're not implementing
  // full user sync during the migration phase. This maintains compatibility
  // with the existing chat API while using Convex for other operations.
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    image: userData.image,
    plan: userData.plan || "free",
  };
}

/**
 * Get user by ID (temporary migration version)
 */
export async function getUserById(userId: string) {
  // For migration purposes, we'll return a basic user object
  // In the full implementation, this would query Convex for user data
  return {
    id: userId,
    plan: "free", // Default plan during migration
  };
}

// Re-export for convenience
export { syncUserToConvex as debugRequireUser };
