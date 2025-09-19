import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import {
  getUserConversations,
  createConversation,
  formatConversationForClient
} from "~/server/convex/conversations";
import { getActiveAdvisors } from "~/server/convex/advisors";

// Request schemas
const createConversationSchema = z.object({
  title: z.string().optional(),
  advisorId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  console.log("=== CONVERSATIONS API START (CONVEX) ===");
  console.log("Request URL:", req.url);

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const conversations = await getUserConversations();
    console.log("Retrieved conversations from Convex:", conversations.length);

    // Format conversations for client
    const formattedConversations = conversations.map(formatConversationForClient);

    return Response.json(formattedConversations);

  } catch (error) {
    console.error("Get conversations error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("=== CREATE CONVERSATION API START (CONVEX) ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = await req.json();
    const { title, advisorId } = createConversationSchema.parse(body);

    // Get default advisor if none specified
    let activeAdvisorId = advisorId;
    if (!activeAdvisorId) {
      const advisors = await getActiveAdvisors();
      if (advisors.length > 0) {
        activeAdvisorId = advisors[0]?._id;
      }
    }

    const conversationId = await createConversation({
      title: title || "New Conversation",
      activeAdvisorId,
    });

    console.log("Conversation created successfully:", conversationId);

    // Get the created conversation to return formatted data
    const conversation = await getUserConversations();
    const createdConversation = conversation.find((c: any) => c._id === conversationId);

    if (!createdConversation) {
      throw new Error("Failed to retrieve created conversation");
    }

    const formattedConversation = formatConversationForClient(createdConversation);

    return Response.json(formattedConversation);

  } catch (error) {
    console.error("Create conversation error:", error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request data", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
