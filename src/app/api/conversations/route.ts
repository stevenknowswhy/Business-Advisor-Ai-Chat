import { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";

// Request schemas
const createConversationSchema = z.object({
  title: z.string().optional(),
  advisorId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  console.log("=== CONVERSATIONS API START ===");
  console.log("Request URL:", req.url);

  try {
    const user = await requireUser();

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      include: {
        activeAdvisor: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get last message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50, // Limit to recent conversations
    });

    // Format conversations for client
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title || "New Conversation",
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0] ? {
        content: conv.messages[0].content.slice(0, 100) + (conv.messages[0].content.length > 100 ? "..." : ""),
        createdAt: conv.messages[0].createdAt,
        sender: conv.messages[0].sender,
      } : null,
      activeAdvisor: conv.activeAdvisor ? {
        id: conv.activeAdvisor.id,
        name: (conv.activeAdvisor.persona as any).name,
        title: (conv.activeAdvisor.persona as any).title,
      } : null,
    }));

    return Response.json(formattedConversations);


  } catch (error) {
    console.error("Get conversations error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { title, advisorId } = createConversationSchema.parse(body);

    // Get default advisor if none specified
    let activeAdvisorId = advisorId;
    if (!activeAdvisorId) {
      const defaultAdvisor = await db.advisor.findFirst({
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
      });
      activeAdvisorId = defaultAdvisor?.id;
    }

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        title: title || "New Conversation",
        activeAdvisorId,
      },
      include: {
        activeAdvisor: true,
      },
    });

    return Response.json({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      activeAdvisor: conversation.activeAdvisor ? {
        id: conversation.activeAdvisor.id,
        name: (conversation.activeAdvisor.persona as any).name,
        title: (conversation.activeAdvisor.persona as any).title,
      } : null,
    });

  } catch (error) {
    console.error("Create conversation error:", error);
    
    if (error instanceof z.ZodError) {
      return new Response("Invalid request data", { status: 400 });
    }
    
    return new Response("Internal server error", { status: 500 });
  }
}
