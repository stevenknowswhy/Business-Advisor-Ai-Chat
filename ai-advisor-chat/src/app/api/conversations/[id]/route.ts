import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
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
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    console.log("Getting conversation:", conversationId);

    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const formattedConversation = formatConversationWithMessagesForClient(conversation);

    return NextResponse.json(formattedConversation);

  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== DELETE CONVERSATION API START (PRISMA) ===");
  const db = new PrismaClient();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    console.log("Deleting conversation:", conversationId);

    // Ownership check
    const existing = await db.conversation.findUnique({ select: { id: true, userId: true }, where: { id: conversationId } });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    // Transactional delete: children then conversation
    await db.$transaction([
      db.message.deleteMany({ where: { conversationId } }),
      db.threadSummary.deleteMany({ where: { conversationId } }),
      db.advisorMemory.deleteMany({ where: { conversationId } }),
      db.conversation.delete({ where: { id: conversationId } }),
    ]);

    console.log("Conversation deleted successfully:", conversationId);
    return NextResponse.json(null, { status: 204 });

  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await db.$disconnect();
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
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      updated: updateData,
    }, { status: 200 });

  } catch (error) {
    console.error("Update conversation error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while updating the conversation"
    }, { status: 500 });
  }
}
