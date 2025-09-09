/**
 * Authenticated Database Test API - Individual Message Deletion
 * Tests authenticated database deletion with user authorization
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

    console.log("=== TEST REQUIRE USER SUCCESS ===");
    return user;
  } catch (error) {
    console.error("=== TEST REQUIRE USER ERROR ===", error);
    throw error;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  console.log("=== AUTH DELETE TEST - DELETE USER MESSAGE START ===", {
    timestamp: new Date().toISOString(),
    url: req.url,
  });

  try {
    // Step 1: Get message ID
    console.log("Step 1: Extracting message ID...");
    const { id: messageId } = await params;
    console.log("Step 1 SUCCESS: Message ID:", messageId);

    // Validate message ID format
    if (!messageId || typeof messageId !== 'string' || messageId.length < 10) {
      console.log("Step 1 FAILED: Invalid message ID format");
      return Response.json({
        success: false,
        error: "INVALID_MESSAGE_ID",
        message: "Invalid message ID format",
        details: { messageId, type: typeof messageId, length: messageId?.length },
      }, { status: 400 });
    }

    // Step 2: Authenticate user
    console.log("Step 2: Authenticating user...");
    const user = await testRequireUser();
    console.log("Step 2 SUCCESS: User authenticated:", user.id.substring(0, 10) + "...");

    // Step 3: Test database connection
    console.log("Step 3: Testing database connection...");
    await testDb.$queryRaw`SELECT 1 as test`;
    console.log("Step 3 SUCCESS: Database connection verified");

    // Step 4: Check if message exists and belongs to user
    console.log("Step 4: Checking message ownership...");
    const existingMessage = await testDb.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            id: true,
            userId: true,
            title: true,
          }
        }
      }
    });

    if (!existingMessage) {
      console.log("Step 4 FAILED: Message not found");
      return Response.json({
        success: false,
        error: "MESSAGE_NOT_FOUND",
        message: "Message not found in database",
        details: { messageId },
      }, { status: 404 });
    }

    // Check if user owns the conversation (authorization)
    if (existingMessage.conversation.userId !== user.id) {
      console.log("Step 4 FAILED: User does not own this message", {
        messageUserId: existingMessage.conversation.userId,
        currentUserId: user.id,
      });
      return Response.json({
        success: false,
        error: "UNAUTHORIZED",
        message: "You don't have permission to delete this message",
        details: { messageId, userId: user.id },
      }, { status: 403 });
    }

    console.log("Step 4 SUCCESS: Message found and owned by user", {
      id: existingMessage.id,
      content: existingMessage.content.substring(0, 50) + "...",
      sender: existingMessage.sender,
      conversationId: existingMessage.conversationId,
    });

    // Step 5: Delete the message
    console.log("Step 5: Deleting user message from database...");
    const deletedMessage = await testDb.message.delete({
      where: { id: messageId },
    });

    console.log("Step 5 SUCCESS: User message deleted successfully", {
      deletedId: deletedMessage.id,
    });

    const response = {
      success: true,
      message: "User message deleted successfully",
      deletedMessage: {
        id: deletedMessage.id,
        content: deletedMessage.content,
        createdAt: deletedMessage.createdAt.toISOString(),
        conversationId: deletedMessage.conversationId,
        sender: deletedMessage.sender,
      },
      userId: user.id,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== AUTH DELETE TEST - DELETE USER MESSAGE SUCCESS ===", {
      messageId,
      userId: user.id.substring(0, 10) + "...",
      duration: response.duration,
    });

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== AUTH DELETE TEST - DELETE USER MESSAGE ERROR ===");
    console.error("Error timestamp:", new Date().toISOString());
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
        message: "Please sign in to delete messages",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      }, { status: 401 });
    }

    // Handle Prisma errors
    let errorCategory = "UNKNOWN_ERROR";
    let statusCode = 500;
    let userMessage = "An unexpected error occurred while deleting the message";

    if (error?.code === 'P2025') {
      errorCategory = "MESSAGE_NOT_FOUND";
      statusCode = 404;
      userMessage = "Message not found or already deleted";
    } else if (error?.code?.startsWith('P')) {
      errorCategory = "PRISMA_ERROR";
      statusCode = 500;
      userMessage = "Database operation failed";
    }

    console.error("Error categorized as:", errorCategory, "with status:", statusCode);

    const errorResponse = {
      success: false,
      error: errorCategory,
      message: userMessage,
      details: {
        originalMessage: error?.message,
        code: error?.code,
        type: typeof error,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    return Response.json(errorResponse, { status: statusCode });
  }
}
