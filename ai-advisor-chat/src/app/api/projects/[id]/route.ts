import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectConversations,
  addConversationToProject,
  removeConversationFromProject,
  getProjectStats,
} from "~/server/convex/projects";

// Request schemas
const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long").optional(),
  description: z.string().optional(),
  status: z.enum(["active", "archived", "completed"]).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const addConversationSchema = z.object({
  conversationId: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PROJECT API GET START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log("Getting project:", projectId);

    const project = await getProjectById({ projectId });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);

  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PROJECT API PATCH START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log("Updating project:", projectId);

    // Parse request body
    const body = await req.json();
    const updateData = updateProjectSchema.parse(body);
    console.log("Update data:", updateData);

    await updateProject({ projectId, ...updateData });

    console.log("Project updated successfully:", projectId);

    // Get the updated project to return formatted data
    const updatedProject = await getProjectById({ projectId });

    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error("Update project error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PROJECT API DELETE START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log("Deleting project:", projectId);

    await deleteProject({ projectId });

    console.log("Project deleted successfully:", projectId);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

