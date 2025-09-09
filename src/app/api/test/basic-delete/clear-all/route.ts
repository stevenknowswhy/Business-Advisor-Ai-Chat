/**
 * Basic Database Test API - Clear All Test Data
 * Removes all test messages and conversations
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create direct Prisma client for testing
const testDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== BASIC DELETE TEST - CLEAR ALL DATA START ===", {
    timestamp: new Date().toISOString(),
  });

  try {
    // Step 1: Test database connection
    console.log("Step 1: Testing database connection...");
    await testDb.$queryRaw`SELECT 1 as test`;
    console.log("Step 1 SUCCESS: Database connection verified");

    // Step 2: Delete test messages
    console.log("Step 2: Deleting test messages...");
    const deletedMessages = await testDb.message.deleteMany({
      where: {
        OR: [
          { content: { contains: "TEST_MESSAGE" } },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        ]
      }
    });
    console.log("Step 2 SUCCESS: Deleted", deletedMessages.count, "test messages");

    // Step 3: Delete test conversations
    console.log("Step 3: Deleting test conversations...");
    const deletedConversations = await testDb.conversation.deleteMany({
      where: {
        title: { contains: "TEST_CONVERSATION" }
      }
    });
    console.log("Step 3 SUCCESS: Deleted", deletedConversations.count, "test conversations");

    // Step 4: Delete test users (optional, be careful in production)
    console.log("Step 4: Deleting test users...");
    const deletedUsers = await testDb.user.deleteMany({
      where: {
        email: { contains: "test@example.com" }
      }
    });
    console.log("Step 4 SUCCESS: Deleted", deletedUsers.count, "test users");

    const response = {
      success: true,
      message: "All test data cleared successfully",
      deleted: {
        messages: deletedMessages.count,
        conversations: deletedConversations.count,
        users: deletedUsers.count,
        total: deletedMessages.count + deletedConversations.count + deletedUsers.count,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== BASIC DELETE TEST - CLEAR ALL DATA SUCCESS ===", {
      deletedMessages: deletedMessages.count,
      deletedConversations: deletedConversations.count,
      deletedUsers: deletedUsers.count,
      duration: response.duration,
    });

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== BASIC DELETE TEST - CLEAR ALL DATA ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);

    const errorResponse = {
      success: false,
      error: "CLEAR_DATA_FAILED",
      message: "Failed to clear test data",
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
