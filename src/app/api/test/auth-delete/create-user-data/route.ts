/**
 * Authenticated Database Test API - Create User Test Data
 * Creates test messages for the authenticated user
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== AUTH DELETE TEST - CREATE USER DATA START ===", {
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

    // Step 3: Create or find a test conversation for this user
    console.log("Step 3: Creating/finding user test conversation...");
    let testConversation = await testDb.conversation.findFirst({
      where: {
        userId: user.id,
        title: { contains: "AUTH_TEST_CONVERSATION" }
      }
    });

    if (!testConversation) {
      testConversation = await testDb.conversation.create({
        data: {
          title: `AUTH_TEST_CONVERSATION_${Date.now()}`,
          userId: user.id,
        }
      });
      console.log("Created user test conversation:", testConversation.id);
    } else {
      console.log("Found existing user test conversation:", testConversation.id);
    }

    // Step 4: Create test messages for this user
    console.log("Step 4: Creating user test messages...");
    const testMessages = [];
    const messageCount = 5;

    for (let i = 1; i <= messageCount; i++) {
      const message = await testDb.message.create({
        data: {
          content: `AUTH_TEST_MESSAGE_${i}_${Date.now()}: This is a test message for authenticated deletion testing. Created for user ${user.id} at ${new Date().toISOString()}`,
          sender: i % 2 === 0 ? "user" : "assistant",
          conversationId: testConversation.id,
        }
      });
      testMessages.push(message);
      console.log(`Created user test message ${i}:`, message.id);
    }

    console.log("Step 4 SUCCESS: Created", testMessages.length, "user test messages");

    const response = {
      success: true,
      message: "User test data created successfully",
      created: testMessages.length,
      userId: user.id,
      testConversation: {
        id: testConversation.id,
        title: testConversation.title,
        userId: testConversation.userId,
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

    console.log("=== AUTH DELETE TEST - CREATE USER DATA SUCCESS ===", {
      created: testMessages.length,
      userId: user.id.substring(0, 10) + "...",
      conversationId: testConversation.id,
      duration: response.duration,
    });

    return Response.json(response, { status: 201 });

  } catch (error: any) {
    console.error("=== AUTH DELETE TEST - CREATE USER DATA ERROR ===");
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
        message: "Please sign in to create test data",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      }, { status: 401 });
    }

    const errorResponse = {
      success: false,
      error: "CREATE_USER_DATA_FAILED",
      message: "Failed to create user test data",
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
