/**
 * Authenticated Database Test API - User Messages List
 * Tests authenticated database operations with user authorization
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

// Create direct Prisma client for testing
const testDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Enhanced requireUser function for testing
async function testRequireUser() {
  console.log("=== TEST REQUIRE USER START ===");
  
  try {
    // Step 1: Get user ID from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    console.log("Step 1 SUCCESS: User ID:", userId.substring(0, 10) + "...");

    // Step 2: Get user details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("User details not found");
    }
    console.log("Step 2 SUCCESS: User details retrieved");

    // Step 3: Sync with database
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
    console.log("Step 3 SUCCESS: User synced with database");

    console.log("=== TEST REQUIRE USER SUCCESS ===");
    return user;
  } catch (error) {
    console.error("=== TEST REQUIRE USER ERROR ===", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== AUTH DELETE TEST - GET USER MESSAGES START ===", {
    timestamp: new Date().toISOString(),
    url: req.url,
  });

  try {
    // Step 1: Authenticate user
    console.log("Step 1: Authenticating user...");
    const user = await testRequireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id.substring(0, 10) + "...");

    // Step 2: Test database connection
    console.log("Step 2: Testing database connection...");
    await testDb.$queryRaw`SELECT 1 as test`;
    console.log("Step 2 SUCCESS: Database connection verified");

    // Step 3: Get user's messages (including test messages and recent messages)
    console.log("Step 3: Fetching user's messages...");
    const messages = await testDb.message.findMany({
      where: {
        conversation: {
          userId: user.id, // Only messages from conversations owned by this user
        },
        OR: [
          { content: { contains: "AUTH_TEST_MESSAGE" } },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        ]
      },
      include: {
        conversation: {
          select: {
            id: true,
            userId: true,
            title: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit for testing
    });

    console.log("Step 3 SUCCESS: Found", messages.length, "user messages");

    const response = {
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        conversationId: msg.conversationId,
        userId: msg.conversation.userId,
        sender: msg.sender,
      })),
      count: messages.length,
      userId: user.id,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== AUTH DELETE TEST - GET USER MESSAGES SUCCESS ===", {
      count: messages.length,
      userId: user.id.substring(0, 10) + "...",
      duration: response.duration,
    });

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== AUTH DELETE TEST - GET USER MESSAGES ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);

    // Handle authentication errors
    if (error?.message?.includes('not authenticated') || 
        error?.message?.includes('User not found')) {
      return Response.json({
        success: false,
        error: "AUTH_REQUIRED",
        message: "Please sign in to view your messages",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      }, { status: 401 });
    }

    const errorResponse = {
      success: false,
      error: "FETCH_USER_MESSAGES_FAILED",
      message: "Failed to fetch user messages from database",
      details: {
        originalError: error?.message,
        code: error?.code,
        type: typeof error,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
