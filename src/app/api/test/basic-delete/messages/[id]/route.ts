/**
 * Basic Database Test API - Individual Message Deletion
 * Tests direct database deletion without authentication
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create direct Prisma client for testing
const testDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  console.log("=== BASIC DELETE TEST - DELETE MESSAGE START ===", {
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

    // Step 2: Test database connection
    console.log("Step 2: Testing database connection...");
    await testDb.$queryRaw`SELECT 1 as test`;
    console.log("Step 2 SUCCESS: Database connection verified");

    // Step 3: Check if message exists
    console.log("Step 3: Checking if message exists...");
    const existingMessage = await testDb.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        conversationId: true,
        sender: true,
      }
    });

    if (!existingMessage) {
      console.log("Step 3 FAILED: Message not found");
      return Response.json({
        success: false,
        error: "MESSAGE_NOT_FOUND",
        message: "Message not found in database",
        details: { messageId },
      }, { status: 404 });
    }

    console.log("Step 3 SUCCESS: Message found", {
      id: existingMessage.id,
      content: existingMessage.content.substring(0, 50) + "...",
      sender: existingMessage.sender,
    });

    // Step 4: Delete the message
    console.log("Step 4: Deleting message from database...");
    const deletedMessage = await testDb.message.delete({
      where: { id: messageId },
    });

    console.log("Step 4 SUCCESS: Message deleted successfully", {
      deletedId: deletedMessage.id,
    });

    const response = {
      success: true,
      message: "Message deleted successfully",
      deletedMessage: {
        id: deletedMessage.id,
        content: deletedMessage.content,
        createdAt: deletedMessage.createdAt.toISOString(),
        conversationId: deletedMessage.conversationId,
        sender: deletedMessage.sender,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== BASIC DELETE TEST - DELETE MESSAGE SUCCESS ===", {
      messageId,
      duration: response.duration,
    });

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== BASIC DELETE TEST - DELETE MESSAGE ERROR ===");
    console.error("Error timestamp:", new Date().toISOString());
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error meta:", error?.meta);
    console.error("Error stack:", error?.stack);

    // Enhanced error categorization for testing
    let errorCategory = "UNKNOWN_ERROR";
    let statusCode = 500;
    let userMessage = "An unexpected error occurred while deleting the message";

    // Prisma specific errors
    if (error?.code === 'P2025') {
      errorCategory = "MESSAGE_NOT_FOUND";
      statusCode = 404;
      userMessage = "Message not found or already deleted";
    } else if (error?.code === 'P2002') {
      errorCategory = "CONSTRAINT_ERROR";
      statusCode = 409;
      userMessage = "Database constraint error";
    } else if (error?.code?.startsWith('P')) {
      errorCategory = "PRISMA_ERROR";
      statusCode = 500;
      userMessage = "Database operation failed";
    }
    // Database connection errors
    else if (error?.message?.includes('connect') ||
             error?.code === 'ECONNREFUSED' ||
             error?.code === 'ETIMEDOUT') {
      errorCategory = "DATABASE_CONNECTION_ERROR";
      statusCode = 503;
      userMessage = "Database connection failed";
    }

    console.error("Error categorized as:", errorCategory, "with status:", statusCode);

    const errorResponse = {
      success: false,
      error: errorCategory,
      message: userMessage,
      details: {
        originalMessage: error?.message,
        code: error?.code,
        meta: error?.meta,
        type: typeof error,
        constructor: error?.constructor?.name,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    return Response.json(errorResponse, { status: statusCode });
  }
}
