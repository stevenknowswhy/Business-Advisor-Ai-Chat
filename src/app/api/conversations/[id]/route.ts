import { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";
import { formatAdvisorForClient } from "~/server/advisors/persona";

// Request schemas
const updateConversationSchema = z.object({
  title: z.string().optional(),
  activeAdvisorId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;

    const conversation = await db.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id, // Ensure user owns this conversation
      },
      include: {
        activeAdvisor: true,
        messages: {
          include: { advisor: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Format messages for client
    const formattedMessages = conversation.messages.map(message => ({
      id: message.id,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
      mentions: message.mentions,
      advisor: message.advisor ? formatAdvisorForClient(message.advisor) : null,
    }));

    return Response.json({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      activeAdvisor: conversation.activeAdvisor ? formatAdvisorForClient(conversation.activeAdvisor) : null,
      messages: formattedMessages,
    });

  } catch (error) {
    console.error("Get conversation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}



export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== DELETE CONVERSATION API START ===");
  console.log("Environment check:", {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasClerkKey: !!process.env.CLERK_SECRET_KEY,
  });

  try {
    // Step 1: Get conversation ID first (before auth to avoid issues)
    console.log("Step 1: Extracting conversation ID...");
    const { id: conversationId } = await params;
    console.log("Step 1 SUCCESS: Conversation ID:", conversationId);

    // Validate conversation ID format
    if (!conversationId || typeof conversationId !== 'string' || conversationId.length < 10) {
      console.log("Step 1 FAILED: Invalid conversation ID format");
      return Response.json({
        error: "INVALID_ID",
        message: "Invalid conversation ID format"
      }, { status: 400 });
    }

    // Step 2: Authenticate user with timeout
    console.log("Step 2: Authenticating user...");
    let user;
    try {
      // Add timeout to authentication to prevent hanging
      user = await Promise.race([
        requireUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Authentication timeout')), 10000)
        )
      ]);
      console.log("Step 2 SUCCESS: User authenticated:", user.id);
    } catch (authError) {
      console.error("Step 2 FAILED: Authentication error:", authError);
      return Response.json({
        error: "AUTH_ERROR",
        message: "Authentication failed. Please sign in again."
      }, { status: 401 });
    }

    // Step 3: Database connection check
    console.log("Step 3: Checking database connection...");
    try {
      // Test database connection first
      await db.$queryRaw`SELECT 1`;
      console.log("Step 3 SUCCESS: Database connection verified");
    } catch (dbError) {
      console.error("Step 3 FAILED: Database connection error:", dbError);
      return Response.json({
        error: "DATABASE_ERROR",
        message: "Database connection failed. Please try again."
      }, { status: 503 });
    }

    // Step 4: Verify conversation ownership with timeout
    console.log("Step 4: Verifying conversation ownership...");
    let existingConversation;
    try {
      existingConversation = await Promise.race([
        db.conversation.findUnique({
          where: {
            id: conversationId,
            userId: user.id,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 15000)
        )
      ]);
    } catch (queryError) {
      console.error("Step 4 FAILED: Query error:", queryError);
      return Response.json({
        error: "QUERY_ERROR",
        message: "Database query failed. Please try again."
      }, { status: 503 });
    }

    if (!existingConversation) {
      console.log("Step 4 FAILED: Conversation not found or not owned by user");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found or you don't have permission to delete it"
      }, { status: 404 });
    }

    console.log("Step 4 SUCCESS: Conversation found and owned by user");

    // Step 5: Delete conversation with timeout and retry logic
    console.log("Step 5: Deleting conversation from database...");
    try {
      await Promise.race([
        db.conversation.delete({
          where: { id: conversationId },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Delete operation timeout')), 20000)
        )
      ]);
      console.log("Step 5 SUCCESS: Conversation deleted successfully");
    } catch (deleteError) {
      console.error("Step 5 FAILED: Delete error:", deleteError);

      // Check if it's a timeout or actual error
      if (deleteError.message?.includes('timeout')) {
        return Response.json({
          error: "TIMEOUT_ERROR",
          message: "Delete operation timed out. The conversation may have been deleted. Please refresh the page."
        }, { status: 408 });
      }

      // Re-throw for general error handling
      throw deleteError;
    }

    console.log("=== DELETE CONVERSATION API SUCCESS ===");
    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error("=== DELETE CONVERSATION API ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    // Handle specific Prisma errors
    if (error?.code === 'P2025') {
      console.error("Prisma P2025: Record not found");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found"
      }, { status: 404 });
    }

    if (error?.code === 'P2002') {
      console.error("Prisma P2002: Unique constraint violation");
      return Response.json({
        error: "CONSTRAINT_ERROR",
        message: "Database constraint error"
      }, { status: 409 });
    }

    // Handle connection errors
    if (error?.message?.includes('connect') ||
        error?.message?.includes('timeout') ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT') {
      console.error("Database connection error detected");
      return Response.json({
        error: "CONNECTION_ERROR",
        message: "Database connection failed. Please try again in a moment."
      }, { status: 503 });
    }

    // Handle authentication errors
    if (error?.message?.includes('User not found') ||
        error?.message?.includes('not authenticated') ||
        error?.message?.includes('Authentication timeout')) {
      console.error("Authentication error detected");
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to delete conversations"
      }, { status: 401 });
    }

    // Generic error handler with more details for debugging
    console.error("Unhandled error - returning 500");
    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while deleting the conversation",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

/**
 * Update conversation properties (e.g., active advisor)
 * PATCH /api/conversations/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PATCH CONVERSATION API START ===");

  try {
    console.log("Step 1: Authenticating user...");
    const user = await requireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id);

    const { id: conversationId } = await params;
    console.log("Step 2: Conversation ID to update:", conversationId);

    // Parse request body
    console.log("Step 3: Parsing request body...");
    const body = await req.json();
    const updateData = updateConversationSchema.parse(body);
    console.log("Step 3 SUCCESS: Update data:", updateData);

    // Verify conversation ownership
    console.log("Step 4: Verifying conversation ownership...");
    const existingConversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      console.log("Step 4 FAILED: Conversation not found or not owned by user");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found or you don't have permission to update it"
      }, { status: 404 });
    }

    console.log("Step 4 SUCCESS: Conversation found and owned by user");

    // If updating activeAdvisorId, verify the advisor exists
    if (updateData.activeAdvisorId) {
      console.log("Step 5: Verifying advisor exists...");
      const advisor = await db.advisor.findUnique({
        where: {
          id: updateData.activeAdvisorId,
          status: "active",
        },
      });

      if (!advisor) {
        console.log("Step 5 FAILED: Advisor not found or inactive");
        return Response.json({
          error: "ADVISOR_NOT_FOUND",
          message: "The specified advisor was not found or is inactive"
        }, { status: 400 });
      }

      console.log("Step 5 SUCCESS: Advisor verified:", advisor.id);
    }

    // Update conversation
    console.log("Step 6: Updating conversation in database...");
    const updatedConversation = await db.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        messages: {
          include: { advisor: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    console.log("Step 6 SUCCESS: Conversation updated successfully");

    // Format response
    const response = {
      success: true,
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        activeAdvisorId: updatedConversation.activeAdvisorId,
        createdAt: updatedConversation.createdAt,
        updatedAt: updatedConversation.updatedAt,
        messageCount: updatedConversation.messages.length,
      },
      updated: updateData,
    };

    console.log("=== PATCH CONVERSATION API SUCCESS ===");
    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== PATCH CONVERSATION API ERROR ===");
    console.error("Error details:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return Response.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error?.message?.includes('User not found') ||
        error?.message?.includes('not authenticated')) {
      console.error("Authentication error detected");
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to update conversations"
      }, { status: 401 });
    }

    // Handle database errors
    if (error?.code === 'P2025') {
      // Prisma error: Record not found
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found"
      }, { status: 404 });
    }

    // Generic error handler
    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while updating the conversation"
    }, { status: 500 });
  }
}
