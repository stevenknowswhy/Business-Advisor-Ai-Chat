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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;
    const body = await req.json();
    const { title, activeAdvisorId } = updateConversationSchema.parse(body);

    // Verify conversation ownership
    const existingConversation = await db.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Update conversation
    const conversation = await db.conversation.update({
      where: { id: conversationId },
      data: {
        ...(title && { title }),
        ...(activeAdvisorId && { activeAdvisorId }),
        updatedAt: new Date(),
      },
      include: {
        activeAdvisor: true,
      },
    });

    return Response.json({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      activeAdvisor: conversation.activeAdvisor ? formatAdvisorForClient(conversation.activeAdvisor) : null,
    });

  } catch (error) {
    console.error("Update conversation error:", error);
    
    if (error instanceof z.ZodError) {
      return new Response("Invalid request data", { status: 400 });
    }
    
    return new Response("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: conversationId } = await params;

    // Verify conversation ownership
    const existingConversation = await db.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Delete conversation (messages will be cascade deleted)
    await db.conversation.delete({
      where: { id: conversationId },
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    console.error("Delete conversation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
