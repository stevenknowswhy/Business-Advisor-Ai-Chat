/**
 * Authenticated Database Test API - Clear User Test Data
 * Removes test messages and conversations for the authenticated user
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
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User details not found");

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

  return user;
}

export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== AUTH DELETE TEST - CLEAR USER DATA START ===", {
    timestamp: new Date().toISOString(),
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

    // Step 3: Delete user's test messages
    console.log("Step 3: Deleting user's test messages...");
    const deletedMessages = await testDb.message.deleteMany({
      where: {
        conversation: {
          userId: user.id, // Only delete messages from conversations owned by this user
        },
        OR: [
          { content: { contains: "AUTH_TEST_MESSAGE" } },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        ]
      }
    });
    console.log("Step 3 SUCCESS: Deleted", deletedMessages.count, "user test messages");

    // Step 4: Delete user's test conversations
    console.log("Step 4: Deleting user's test conversations...");
    const deletedConversations = await testDb.conversation.deleteMany({
      where: {
        userId: user.id,
        title: { contains: "AUTH_TEST_CONVERSATION" }
      }
    });
    console.log("Step 4 SUCCESS: Deleted", deletedConversations.count, "user test conversations");

    const response = {
      success: true,
      message: "User test data cleared successfully",
      deleted: {
        messages: deletedMessages.count,
        conversations: deletedConversations.count,
        total: deletedMessages.count + deletedConversations.count,
      },
      userId: user.id,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== AUTH DELETE TEST - CLEAR USER DATA SUCCESS ===", {
      deletedMessages: deletedMessages.count,
      deletedConversations: deletedConversations.count,
      userId: user.id.substring(0, 10) + "...",
      duration: response.duration,
    });

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== AUTH DELETE TEST - CLEAR USER DATA ERROR ===");
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
        message: "Please sign in to clear your test data",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      }, { status: 401 });
    }

    const errorResponse = {
      success: false,
      error: "CLEAR_USER_DATA_FAILED",
      message: "Failed to clear user test data",
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
