/**
 * Debug endpoint to test DELETE functionality step by step
 */

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  console.log("=== DEBUG DELETE TEST START ===");
  
  const results: any = {
    step1_environment: null,
    step2_auth: null,
    step3_currentUser: null,
    step4_database: null,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Check environment variables
    console.log("Step 1: Checking environment variables...");
    results.step1_environment = {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
    };
    console.log("Step 1 SUCCESS:", results.step1_environment);

    // Step 2: Test Clerk auth
    console.log("Step 2: Testing Clerk auth...");
    try {
      const { userId } = await auth();
      results.step2_auth = {
        userId: userId || "null",
        hasUserId: !!userId,
      };
      console.log("Step 2 SUCCESS:", results.step2_auth);
    } catch (error) {
      results.step2_auth = {
        error: error instanceof Error ? error.message : "Unknown auth error",
      };
      results.errors.push("Auth failed: " + (error instanceof Error ? error.message : "Unknown"));
      console.error("Step 2 FAILED:", error);
    }

    // Step 3: Test currentUser (only if auth succeeded)
    if (results.step2_auth && !results.step2_auth.error) {
      console.log("Step 3: Testing currentUser...");
      try {
        const clerkUser = await currentUser();
        results.step3_currentUser = {
          hasUser: !!clerkUser,
          userId: clerkUser?.id || "null",
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || "null",
        };
        console.log("Step 3 SUCCESS:", results.step3_currentUser);
      } catch (error) {
        results.step3_currentUser = {
          error: error instanceof Error ? error.message : "Unknown currentUser error",
        };
        results.errors.push("CurrentUser failed: " + (error instanceof Error ? error.message : "Unknown"));
        console.error("Step 3 FAILED:", error);
      }
    }

    // Step 4: Test database connection
    console.log("Step 4: Testing database connection...");
    try {
      // Import db here to catch import errors
      const { db } = await import("~/server/db");
      
      // Test basic query
      const testQuery = await db.$queryRaw`SELECT 1 as test`;
      results.step4_database = {
        connectionTest: "success",
        queryResult: testQuery,
      };
      console.log("Step 4 SUCCESS:", results.step4_database);
    } catch (error) {
      results.step4_database = {
        error: error instanceof Error ? error.message : "Unknown database error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      };
      results.errors.push("Database failed: " + (error instanceof Error ? error.message : "Unknown"));
      console.error("Step 4 FAILED:", error);
    }

  } catch (error) {
    results.errors.push("General error: " + (error instanceof Error ? error.message : "Unknown"));
    console.error("=== DEBUG DELETE TEST GENERAL ERROR ===", error);
  }

  console.log("=== DEBUG DELETE TEST COMPLETE ===");
  console.log("Results:", JSON.stringify(results, null, 2));

  return Response.json({
    success: results.errors.length === 0,
    results,
    summary: {
      environmentOk: !!results.step1_environment,
      authOk: !!(results.step2_auth && !results.step2_auth.error),
      currentUserOk: !!(results.step3_currentUser && !results.step3_currentUser.error),
      databaseOk: !!(results.step4_database && !results.step4_database.error),
      totalErrors: results.errors.length,
    },
  }, { 
    status: results.errors.length === 0 ? 200 : 500,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log("=== DEBUG DELETE SIMULATION START ===");
  
  try {
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return Response.json({
        error: "MISSING_ID",
        message: "conversationId is required in request body"
      }, { status: 400 });
    }

    // Test the full requireUser flow
    console.log("Testing requireUser flow...");
    const { requireUser } = await import("~/server/auth/require-user");
    
    const user = await requireUser();
    console.log("RequireUser SUCCESS:", { userId: user.id, email: user.email });

    // Test database query
    console.log("Testing conversation lookup...");
    const { db } = await import("~/server/db");
    
    const conversation = await db.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found or not owned by user"
      }, { status: 404 });
    }

    console.log("Conversation found:", { id: conversation.id, title: conversation.title });

    // Simulate delete (don't actually delete)
    console.log("Simulating delete operation...");
    
    return Response.json({
      success: true,
      message: "Delete simulation successful",
      conversation: {
        id: conversation.id,
        title: conversation.title,
        userId: conversation.userId,
      },
      user: {
        id: user.id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("=== DEBUG DELETE SIMULATION ERROR ===", error);
    
    return Response.json({
      error: "SIMULATION_FAILED",
      message: error instanceof Error ? error.message : "Unknown error during simulation",
      stack: error instanceof Error ? error.stack : "No stack trace",
    }, { status: 500 });
  }
}
