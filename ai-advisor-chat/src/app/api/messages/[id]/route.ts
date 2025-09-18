import { NextRequest } from "next/server";
import { z } from "zod";

import {
  getMessageById,
  updateMessage,
  deleteMessage,
  formatMessageForClient
} from "~/server/convex/messages";

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
  console.log("=== UPDATE MESSAGE API START (CONVEX) ===");

  try {
    const { id: messageId } = await params;
    console.log("Message ID to update:", messageId);

    // Parse request body
    const body = await req.json();
    const { content } = updateMessageSchema.parse(body);
    console.log("New content length:", content.length);

    // Get the existing message to verify it exists and check permissions
    const existingMessage = await getMessageById(messageId);

    if (!existingMessage) {
      console.log("Message not found");
      return Response.json({
        success: false,
        error: "MESSAGE_NOT_FOUND",
        message: "Message not found",
      }, { status: 404 });
    }

    // Only allow editing user messages
    if (existingMessage.sender !== "user") {
      console.log("Cannot edit non-user message");
      return Response.json({
        success: false,
        error: "INVALID_MESSAGE_TYPE",
        message: "Only user messages can be edited",
      }, { status: 400 });
    }

    console.log("Message ownership verified");

    // Update the message
    console.log("Updating message content...");
    await updateMessage({
      messageId,
      content,
    });

    console.log("Message updated successfully");

    // Get the updated message for response
    const updatedMessage = await getMessageById(messageId);
    const formattedMessage = formatMessageForClient(updatedMessage);

    const response = {
      success: true,
      message: "Message updated successfully",
      updatedMessage: {
        id: formattedMessage.id,
        content: formattedMessage.content,
        createdAt: formattedMessage.createdAt.toISOString(),
        conversationId: formattedMessage.conversationId,
        sender: formattedMessage.sender,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("=== UPDATE MESSAGE API SUCCESS (CONVEX) ===");
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
  console.log("=== DELETE MESSAGE API START (CONVEX) ===");

  try {
    const { id: messageId } = await params;
    console.log("Message ID to delete:", messageId);

    // Get the existing message to verify it exists
    const existingMessage = await getMessageById(messageId);

    if (!existingMessage) {
      console.log("Message not found");
      return Response.json({
        success: false,
        error: "MESSAGE_NOT_FOUND",
        message: "Message not found",
      }, { status: 404 });
    }

    console.log("Message ownership verified");

    // Delete the message
    console.log("Deleting message...");
    const deletedMessage = await deleteMessage(messageId);

    console.log("Message deleted successfully:", messageId);

    const response = {
      success: true,
      message: "Message deleted successfully",
      deletedCount: 1,
      deletedMessageIds: [messageId],
      conversationId: existingMessage.conversationId,
      timestamp: new Date().toISOString(),
    };

    console.log("=== DELETE MESSAGE API SUCCESS (CONVEX) ===");
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
