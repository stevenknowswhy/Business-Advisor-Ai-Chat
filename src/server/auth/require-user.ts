import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";

/**
 * Get the current authenticated user from Clerk and sync with database
 * Throws an error if user is not authenticated
 */
export async function requireUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Get user details from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized: Invalid user session");
  }

  // Sync user with database
  const user = await db.user.upsert({
    where: { id: userId },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      name: clerkUser.fullName || null,
      image: clerkUser.imageUrl || null,
    },
    create: {
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      name: clerkUser.fullName || null,
      image: clerkUser.imageUrl || null,
      plan: "free", // Default plan for new users
    },
  });

  return user;
}

/**
 * Get the current user if authenticated, null otherwise
 */
export async function getCurrentUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}
