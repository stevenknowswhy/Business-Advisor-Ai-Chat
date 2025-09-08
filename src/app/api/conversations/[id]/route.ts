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

  try {
    console.log("Step 1: Authenticating user...");
    const user = await requireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id);

    const { id: conversationId } = await params;
    console.log("Step 2: Conversation ID to delete:", conversationId);

    // Verify conversation ownership
    console.log("Step 3: Verifying conversation ownership...");
    const existingConversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      console.log("Step 3 FAILED: Conversation not found or not owned by user");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found or you don't have permission to delete it"
      }, { status: 404 });
    }

    console.log("Step 3 SUCCESS: Conversation found and owned by user");

    // Delete conversation (messages will be cascade deleted)
    console.log("Step 4: Deleting conversation from database...");
    await db.conversation.delete({
      where: { id: conversationId },
    });
    console.log("Step 4 SUCCESS: Conversation deleted successfully");

    console.log("=== DELETE CONVERSATION API SUCCESS ===");
    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error("=== DELETE CONVERSATION API ERROR ===");
    console.error("Error details:", error);

    // Handle authentication errors
    if (error?.message?.includes('User not found') ||
        error?.message?.includes('not authenticated')) {
      console.error("Authentication error detected");
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to delete conversations"
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
      message: "An unexpected error occurred while deleting the conversation"
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
