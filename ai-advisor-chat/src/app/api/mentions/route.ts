import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "~/server/auth/require-user";
import { db } from "~/server/db";
import { extractMentions } from "~/server/llm/prompt";

const mentionRequestSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

/**
 * Extract mentions from message content
 * POST /api/mentions
 */
export async function POST(req: NextRequest) {
  console.log("=== MENTIONS API START ===");
  console.log("Request URL:", req.url);

  try {
    // Authenticate user
    console.log("Step 1: Authenticating user...");
    const user = await requireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id);

    // Parse request body
    console.log("Step 2: Parsing request body...");
    const body = await req.json();
    const { content } = mentionRequestSchema.parse(body);
    console.log("Step 2 SUCCESS: Content to analyze:", content.substring(0, 100) + "...");

    // Get available advisors
    console.log("Step 3: Fetching available advisors...");
    const advisors = await db.advisor.findMany({
      where: { status: "active" },
    });
    console.log("Step 3 SUCCESS: Found", advisors.length, "active advisors");

    // Extract mentions using server-side logic
    console.log("Step 4: Extracting mentions from content...");
    const mentionedAdvisorIds = extractMentions(content, advisors);
    console.log("Step 4 SUCCESS: Found mentions for advisor IDs:", mentionedAdvisorIds);

    // Get full advisor details for mentioned advisors
    console.log("Step 5: Fetching mentioned advisor details...");
    const mentionedAdvisors = mentionedAdvisorIds.length > 0 
      ? await db.advisor.findMany({
          where: {
            id: { in: mentionedAdvisorIds },
            status: "active",
          },
          select: {
            id: true,
            persona: true,
            metadata: true,
            roleDefinition: true,
          },
        })
      : [];
    console.log("Step 5 SUCCESS: Retrieved", mentionedAdvisors.length, "mentioned advisor details");

    // Return structured response
    const response = {
      success: true,
      content,
      mentions: {
        advisorIds: mentionedAdvisorIds,
        advisors: mentionedAdvisors.map(advisor => ({
          id: advisor.id,
          name: (advisor.persona as any)?.name || "Unknown",
          role: (advisor.roleDefinition as any) || "AI Advisor",
          metadata: advisor.metadata,
        })),
        count: mentionedAdvisorIds.length,
      },
      analysis: {
        hasValidMentions: mentionedAdvisorIds.length > 0,
        contentLength: content.length,
        processedAt: new Date().toISOString(),
      },
    };

    console.log("=== MENTIONS API SUCCESS ===");
    console.log("Response summary:", {
      mentionCount: response.mentions.count,
      advisorIds: response.mentions.advisorIds,
    });

    return Response.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("=== MENTIONS API ERROR ===");
    console.error("Error details:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return Response.json({
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error?.message?.includes('User not found') || 
        error?.message?.includes('not authenticated')) {
      console.error("Authentication error detected");
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to use mention processing",
        code: 401
      }, { status: 401 });
    }

    // Handle database errors
    if (error?.code === 'P2002' || error?.name === 'PrismaClientKnownRequestError') {
      console.error("Database error detected");
      return Response.json({
        error: "DATABASE_ERROR",
        message: "Failed to process mentions due to database error",
        details: error.message,
      }, { status: 500 });
    }

    // Generic error handler
    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while processing mentions",
      details: error.message,
    }, { status: 500 });
  }
}
