import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import { getProjectConversations, addConversationToProject } from "~/server/convex/projects";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PROJECT CONVERSATIONS API GET START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log("Getting conversations for project:", projectId);

    const conversations = await getProjectConversations({ projectId });

    return NextResponse.json(conversations);

  } catch (error) {
    console.error("Get project conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project conversations" },
      { status: 500 }
    );
  }
}

const addConversationSchema = z.object({
  conversationId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PROJECT ADD CONVERSATION API START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log("Adding conversation to project:", projectId);

    const body = await req.json();
    const { conversationId } = addConversationSchema.parse(body);

    await addConversationToProject({ projectId, conversationId });

    console.log("Conversation added to project successfully");

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Add conversation to project error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to add conversation to project" },
      { status: 500 }
    );
  }
}