import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import {
  getProjects,
  createProject,
} from "~/server/convex/projects";

// Request schemas
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  iconUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  console.log("=== PROJECTS API GET START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const projects = await getProjects();
    console.log("Retrieved projects:", projects.length);

    return NextResponse.json(projects);

  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("=== PROJECTS API POST START ===");

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);
    console.log("Creating project:", validatedData.name);

    const projectId = await createProject(validatedData);
    console.log("Project created successfully:", projectId);

    // Get the created project to return formatted data
    const projects = await getProjects();
    const createdProject = projects.find((p: any) => p._id === projectId);

    return NextResponse.json(createdProject, { status: 201 });

  } catch (error) {
    console.error("Create project error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}