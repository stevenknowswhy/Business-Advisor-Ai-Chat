/**
 * @deprecated This API route has been replaced by Convex functions.
 * Use the following Convex hooks instead:
 * - GET /api/conversations -> useConversations()
 * - POST /api/conversations -> useCreateConversation()
 *
 * This route will be removed in a future version.
 */

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
    // TEMPORARY: Skip authentication and return mock data while database is down
    // const user = await requireUser();

    // Return mock conversations for now
    const mockConversations = [
      {
        id: "1",
        title: "Investment Portfolio Review",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000),
        messageCount: 5,
        lastMessage: {
          content: "Thank you for the detailed portfolio analysis. I'll implement your diversification recommendations...",
          createdAt: new Date(Date.now() - 86400000),
          sender: "user",
        },
        activeAdvisor: {
          id: "1",
          name: "Marcus Wellington",
          title: "Senior Investment Strategist",
        },
      },
      {
        id: "2",
        title: "Tech Stack Architecture",
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000),
        messageCount: 8,
        lastMessage: {
          content: "The microservices architecture you proposed looks solid. Let's discuss the deployment strategy...",
          createdAt: new Date(Date.now() - 172800000),
          sender: "user",
        },
        activeAdvisor: {
          id: "2",
          name: "Dr. Sarah Chen",
          title: "Chief Technology Strategist",
        },
      }
    ];

    return Response.json(mockConversations);

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
