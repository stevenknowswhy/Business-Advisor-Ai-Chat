import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";

// Request schemas
const updateMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty").max(4000, "Message too long"),
});

/**
 * Update a user message
 * PATCH /api/messages/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== UPDATE MESSAGE API START ===");

  try {
    console.log("Step 1: Authenticating user...");
    const user = await requireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id.substring(0, 10) + "...");

    const { id: messageId } = await params;
    console.log("Step 2: Message ID to update:", messageId);

    // Parse request body
    console.log("Step 3: Parsing request body...");
    const body = await req.json();
    const { content } = updateMessageSchema.parse(body);
    console.log("Step 3 SUCCESS: New content length:", content.length);

    // Verify message exists and user owns it
    console.log("Step 4: Verifying message ownership...");
    const existingMessage = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            id: true,
            userId: true,
          }
        }
      }
    });

    if (!existingMessage) {
      console.log("Step 4 FAILED: Message not found");
      return Response.json({
        success: false,
        error: "MESSAGE_NOT_FOUND",
        message: "Message not found",
      }, { status: 404 });
    }

    // Check if user owns the conversation
    if (existingMessage.conversation.userId !== user.id) {
      console.log("Step 4 FAILED: User does not own this message");
      return Response.json({
        success: false,
        error: "UNAUTHORIZED",
        message: "You don't have permission to edit this message",
      }, { status: 403 });
    }

    // Only allow editing user messages
    if (existingMessage.sender !== "user") {
      console.log("Step 4 FAILED: Cannot edit non-user message");
      return Response.json({
        success: false,
        error: "INVALID_MESSAGE_TYPE",
        message: "Only user messages can be edited",
      }, { status: 400 });
    }

    console.log("Step 4 SUCCESS: Message ownership verified");

    // Update the message
    console.log("Step 5: Updating message content...");
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        conversation: true,
      }
    });

    console.log("Step 5 SUCCESS: Message updated successfully");

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: updatedMessage.conversationId },
      data: { updatedAt: new Date() },
    });

    const response = {
      success: true,
      message: "Message updated successfully",
      updatedMessage: {
        id: updatedMessage.id,
        content: updatedMessage.content,
        createdAt: updatedMessage.createdAt.toISOString(),
        conversationId: updatedMessage.conversationId,
        sender: updatedMessage.sender,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("=== UPDATE MESSAGE API SUCCESS ===");
    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error("Update message error:", error);
    
    if (error instanceof z.ZodError) {
      return Response.json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors,
      }, { status: 400 });
    }

    return Response.json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to update message",
    }, { status: 500 });
  }
}

/**
 * Delete a single user message
 * DELETE /api/messages/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== DELETE MESSAGE API START ===");

  try {
    console.log("Step 1: Authenticating user...");
    const user = await requireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id.substring(0, 10) + "...");

    const { id: messageId } = await params;
    console.log("Step 2: Message ID to delete:", messageId);

    // Verify message exists and user owns it
    console.log("Step 3: Verifying message ownership...");
    const existingMessage = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            id: true,
            userId: true,
          }
        }
      }
    });

    if (!existingMessage) {
      console.log("Step 3 FAILED: Message not found");
      return Response.json({
        success: false,
        error: "MESSAGE_NOT_FOUND",
        message: "Message not found",
      }, { status: 404 });
    }

    // Check if user owns the conversation
    if (existingMessage.conversation.userId !== user.id) {
      console.log("Step 3 FAILED: User does not own this message");
      return Response.json({
        success: false,
        error: "UNAUTHORIZED",
        message: "You don't have permission to delete this message",
      }, { status: 403 });
    }

    console.log("Step 3 SUCCESS: Message ownership verified");

    // Delete only the specified message
    console.log("Step 4: Deleting single message...");
    const deleteResult = await db.message.delete({
      where: { id: messageId }
    });

    console.log("Step 4 SUCCESS: Message deleted:", deleteResult.id);

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: existingMessage.conversationId },
      data: { updatedAt: new Date() },
    });

    const response = {
      success: true,
      message: "Message deleted successfully",
      deletedCount: 1,
      deletedMessageIds: [messageId],
      conversationId: existingMessage.conversationId,
      timestamp: new Date().toISOString(),
    };

    console.log("=== DELETE MESSAGE API SUCCESS ===");
    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error("Delete message error:", error);

    return Response.json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to delete message",
    }, { status: 500 });
  }
}
