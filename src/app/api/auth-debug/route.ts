import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";

/**
 * Authentication debugging endpoint
 * Provides detailed information about the current authentication state
 */
export async function GET(req: NextRequest) {
  console.log("=== AUTH DEBUG API START ===");
  console.log("Request URL:", req.url);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      clerkPublishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + "...",
      clerkSecretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 20) + "...",
    },
    auth: {
      authResult: null,
      authError: null,
      clerkUser: null,
      clerkUserError: null,
      dbUser: null,
      dbUserError: null,
    },
    database: {
      connected: false,
      error: null,
    }
  };

  // Test Clerk auth() function
  try {
    console.log("Testing Clerk auth()...");
    const authResult = await auth();
    debugInfo.auth.authResult = {
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      orgId: authResult.orgId,
      hasUserId: !!authResult.userId,
      hasSessionId: !!authResult.sessionId,
    };
    console.log("Clerk auth() result:", debugInfo.auth.authResult);
  } catch (error: any) {
    console.error("Clerk auth() error:", error);
    debugInfo.auth.authError = {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    };
  }

  // Test Clerk currentUser() function
  try {
    console.log("Testing Clerk currentUser()...");
    const clerkUser = await currentUser();
    debugInfo.auth.clerkUser = clerkUser ? {
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress),
      fullName: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
      hasEmailAddresses: !!clerkUser.emailAddresses?.length,
      hasFullName: !!clerkUser.fullName,
    } : null;
    console.log("Clerk currentUser() result:", debugInfo.auth.clerkUser);
  } catch (error: any) {
    console.error("Clerk currentUser() error:", error);
    debugInfo.auth.clerkUserError = {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    };
  }

  // Test database connection and user lookup
  try {
    console.log("Testing database connection...");
    
    // Test basic database connection
    await db.$queryRaw`SELECT 1 as test`;
    debugInfo.database.connected = true;
    console.log("Database connection successful");

    // If we have a user ID, try to look up the user in the database
    if (debugInfo.auth.authResult?.userId) {
      console.log("Looking up user in database...");
      const dbUser = await db.user.findUnique({
        where: { id: debugInfo.auth.authResult.userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      debugInfo.auth.dbUser = dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        plan: dbUser.plan,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
        exists: true,
      } : {
        exists: false,
        message: "User not found in database",
      };
      console.log("Database user lookup result:", debugInfo.auth.dbUser);
    }

  } catch (error: any) {
    console.error("Database error:", error);
    debugInfo.database.error = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack?.substring(0, 500),
    };
  }

  // Test requireUser function
  try {
    console.log("Testing requireUser function...");
    const { requireUser } = await import("~/server/auth/require-user");
    const user = await requireUser();
    debugInfo.auth.requireUserResult = {
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    };
    console.log("requireUser() successful:", debugInfo.auth.requireUserResult);
  } catch (error: any) {
    console.error("requireUser() error:", error);
    debugInfo.auth.requireUserError = {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    };
  }

  console.log("=== AUTH DEBUG COMPLETE ===");
  console.log("Final debug info:", JSON.stringify(debugInfo, null, 2));

  return Response.json(debugInfo, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
