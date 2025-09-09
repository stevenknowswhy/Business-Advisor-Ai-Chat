/**
 * Basic Database Test API - Create Test Data
 * Creates test messages for deletion testing
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create direct Prisma client for testing
const testDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== BASIC DELETE TEST - CREATE TEST DATA START ===", {
    timestamp: new Date().toISOString(),
  });

  try {
    // Step 1: Test database connection
    console.log("Step 1: Testing database connection...");
    await testDb.$queryRaw`SELECT 1 as test`;
    console.log("Step 1 SUCCESS: Database connection verified");

    // Step 2: Create or find a test conversation
    console.log("Step 2: Creating/finding test conversation...");
    let testConversation = await testDb.conversation.findFirst({
      where: {
        title: { contains: "TEST_CONVERSATION" }
      }
    });

    if (!testConversation) {
      // Create a test conversation (we need a user ID, so we'll use a test user)
      let testUser = await testDb.user.findFirst({
        where: {
          email: { contains: "test" }
        }
      });

      if (!testUser) {
        // Create a test user
        testUser = await testDb.user.create({
          data: {
            id: "test_user_" + Date.now(),
            email: "test@example.com",
            name: "Test User",
            plan: "free",
          }
        });
        console.log("Created test user:", testUser.id);
      }

      testConversation = await testDb.conversation.create({
        data: {
          title: "TEST_CONVERSATION_" + Date.now(),
          userId: testUser.id,
        }
      });
      console.log("Created test conversation:", testConversation.id);
    } else {
      console.log("Found existing test conversation:", testConversation.id);
    }

    // Step 3: Create test messages
    console.log("Step 3: Creating test messages...");
    const testMessages = [];
    const messageCount = 5;

    for (let i = 1; i <= messageCount; i++) {
      const message = await testDb.message.create({
        data: {
          content: `TEST_MESSAGE_${i}_${Date.now()}: This is a test message for deletion testing. Created at ${new Date().toISOString()}`,
          sender: i % 2 === 0 ? "user" : "advisor",
          conversationId: testConversation.id,
        }
      });
      testMessages.push(message);
      console.log(`Created test message ${i}:`, message.id);
    }

    console.log("Step 3 SUCCESS: Created", testMessages.length, "test messages");

    const response = {
      success: true,
      message: "Test data created successfully",
      created: testMessages.length,
      testConversation: {
        id: testConversation.id,
        title: testConversation.title,
      },
      testMessages: testMessages.map(msg => ({
        id: msg.id,
        content: msg.content.substring(0, 100) + "...",
        sender: msg.sender,
        createdAt: msg.createdAt.toISOString(),
      })),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== BASIC DELETE TEST - CREATE TEST DATA SUCCESS ===", {
      created: testMessages.length,
      conversationId: testConversation.id,
      duration: response.duration,
    });

    return Response.json(response, { status: 201 });

  } catch (error: any) {
    console.error("=== BASIC DELETE TEST - CREATE TEST DATA ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);

    const errorResponse = {
      success: false,
      error: "CREATE_TEST_DATA_FAILED",
      message: "Failed to create test data",
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
