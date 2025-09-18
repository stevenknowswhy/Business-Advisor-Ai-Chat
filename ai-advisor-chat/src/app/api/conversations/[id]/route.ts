import { NextRequest } from "next/server";
import { z } from "zod";

import {
  getConversationById,
  updateConversation,
  deleteConversation,
  formatConversationWithMessagesForClient
} from "~/server/convex/conversations";

// Request schemas
const updateConversationSchema = z.object({
  title: z.string().optional(),
  activeAdvisorId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== GET CONVERSATION API START (CONVEX) ===");

  try {
    const { id: conversationId } = await params;
    console.log("Getting conversation:", conversationId);

    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    const formattedConversation = formatConversationWithMessagesForClient(conversation);

    return Response.json(formattedConversation);

  } catch (error) {
    console.error("Get conversation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== DELETE CONVERSATION API START (CONVEX) ===");

  try {
    const { id: conversationId } = await params;
    console.log("Deleting conversation:", conversationId);

    await deleteConversation(conversationId);

    console.log("Conversation deleted successfully:", conversationId);
    return new Response(null, { status: 204 });

  } catch (error) {
    console.error("Delete conversation error:", error);
    return new Response("Internal server error", { status: 500 });
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
  console.log("=== PATCH CONVERSATION API START (CONVEX) ===");

  try {
    const { id: conversationId } = await params;
    console.log("Updating conversation:", conversationId);

    // Parse request body
    const body = await req.json();
    const updateData = updateConversationSchema.parse(body);
    console.log("Update data:", updateData);

    await updateConversation({
      conversationId,
      title: updateData.title,
      activeAdvisorId: updateData.activeAdvisorId,
    });

    console.log("Conversation updated successfully:", conversationId);

    return Response.json({
      success: true,
      updated: updateData,
    }, { status: 200 });

  } catch (error) {
    console.error("Update conversation error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return Response.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while updating the conversation"
    }, { status: 500 });
  }
}
