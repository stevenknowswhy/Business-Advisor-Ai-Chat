/**
 * Database connection test endpoint for production debugging
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

// Create direct Prisma client for testing
const testDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== DATABASE TEST START ===", {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  });

  const results: any = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    },
    tests: {},
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Test 1: Basic database connection
    console.log("Test 1: Basic database connection...");
    try {
      const connectionTest = await testDb.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
      results.tests.databaseConnection = {
        success: true,
        result: connectionTest,
        duration: Date.now() - startTime,
      };
      console.log("Test 1 SUCCESS:", results.tests.databaseConnection);
    } catch (dbError) {
      results.tests.databaseConnection = {
        success: false,
        error: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code,
        duration: Date.now() - startTime,
      };
      results.errors.push("Database connection failed");
      console.error("Test 1 FAILED:", results.tests.databaseConnection);
    }

    // Test 2: Clerk authentication
    console.log("Test 2: Clerk authentication...");
    try {
      const { userId } = await auth();
      results.tests.clerkAuth = {
        success: true,
        hasUserId: !!userId,
        userId: userId?.substring(0, 10) + "...",
      };
      console.log("Test 2 SUCCESS:", results.tests.clerkAuth);
    } catch (authError) {
      results.tests.clerkAuth = {
        success: false,
        error: authError instanceof Error ? authError.message : String(authError),
      };
      results.errors.push("Clerk auth failed");
      console.error("Test 2 FAILED:", results.tests.clerkAuth);
    }

    // Test 3: Current user (only if auth succeeded)
    if (results.tests.clerkAuth?.success && results.tests.clerkAuth?.hasUserId) {
      console.log("Test 3: Current user...");
      try {
        const clerkUser = await currentUser();
        results.tests.currentUser = {
          success: true,
          hasUser: !!clerkUser,
          hasEmail: !!clerkUser?.emailAddresses?.[0]?.emailAddress,
        };
        console.log("Test 3 SUCCESS:", results.tests.currentUser);
      } catch (userError) {
        results.tests.currentUser = {
          success: false,
          error: userError instanceof Error ? userError.message : String(userError),
        };
        results.errors.push("Current user failed");
        console.error("Test 3 FAILED:", results.tests.currentUser);
      }
    }

    // Test 4: Database table access (only if DB connection succeeded)
    if (results.tests.databaseConnection?.success) {
      console.log("Test 4: Database table access...");
      try {
        const userCount = await testDb.user.count();
        const conversationCount = await testDb.conversation.count();
        results.tests.tableAccess = {
          success: true,
          userCount,
          conversationCount,
        };
        console.log("Test 4 SUCCESS:", results.tests.tableAccess);
      } catch (tableError) {
        results.tests.tableAccess = {
          success: false,
          error: tableError instanceof Error ? tableError.message : String(tableError),
          code: (tableError as any)?.code,
        };
        results.errors.push("Table access failed");
        console.error("Test 4 FAILED:", results.tests.tableAccess);
      }
    }

    // Test 5: User upsert (only if authenticated and DB working)
    if (results.tests.clerkAuth?.success && 
        results.tests.currentUser?.success && 
        results.tests.databaseConnection?.success) {
      console.log("Test 5: User upsert operation...");
      try {
        const { userId } = await auth();
        const clerkUser = await currentUser();
        
        if (userId && clerkUser) {
          const user = await testDb.user.upsert({
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
              plan: "free",
            },
          });
          
          results.tests.userUpsert = {
            success: true,
            userId: user.id.substring(0, 10) + "...",
            email: user.email,
          };
          console.log("Test 5 SUCCESS:", results.tests.userUpsert);
        }
      } catch (upsertError) {
        results.tests.userUpsert = {
          success: false,
          error: upsertError instanceof Error ? upsertError.message : String(upsertError),
          code: (upsertError as any)?.code,
          meta: (upsertError as any)?.meta,
        };
        results.errors.push("User upsert failed");
        console.error("Test 5 FAILED:", results.tests.userUpsert);
      }
    }

  } catch (generalError) {
    results.errors.push("General test error: " + (generalError instanceof Error ? generalError.message : String(generalError)));
    console.error("=== DATABASE TEST GENERAL ERROR ===", generalError);
  }

  results.summary = {
    totalTests: Object.keys(results.tests).length,
    successfulTests: Object.values(results.tests).filter((test: any) => test.success).length,
    totalErrors: results.errors.length,
    overallSuccess: results.errors.length === 0,
    duration: Date.now() - startTime,
  };

  console.log("=== DATABASE TEST COMPLETE ===", results.summary);

  return Response.json(results, { 
    status: results.summary.overallSuccess ? 200 : 500,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
