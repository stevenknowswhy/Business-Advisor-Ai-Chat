import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { removeConversationFromProject } from "~/server/convex/projects";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  console.log("=== PROJECT REMOVE CONVERSATION API START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: projectId, conversationId } = await params;
    console.log("Removing conversation from project:", projectId, conversationId);

    await removeConversationFromProject({ projectId, conversationId });

    console.log("Conversation removed from project successfully");

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Remove conversation from project error:", error);
    return NextResponse.json(
      { error: "Failed to remove conversation from project" },
      { status: 500 }
    );
  }
}