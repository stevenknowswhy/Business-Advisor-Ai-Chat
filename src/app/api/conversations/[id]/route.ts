import { NextRequest } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

import { requireUser } from "~/server/auth/require-user";
import { formatAdvisorForClient } from "~/server/advisors/persona";

// Create a direct Prisma client to bypass env validation issues
const createDirectPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    throw error;
  }
};

// Use direct client for DELETE operations to avoid env validation issues
const directDb = createDirectPrismaClient();

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

    const conversation = await directDb.conversation.findUnique({
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



// Simplified requireUser function that bypasses env validation
async function simpleRequireUser() {
  console.log("=== SIMPLE REQUIRE USER START ===");

  try {
    // Step 1: Get user ID from Clerk
    console.log("Step 1: Getting user ID from Clerk auth...");
    const { userId } = await auth();

    if (!userId) {
      console.log("Step 1 FAILED: No user ID from auth");
      throw new Error("User not authenticated");
    }
    console.log("Step 1 SUCCESS: User ID:", userId);

    // Step 2: Get user details from Clerk
    console.log("Step 2: Getting user details from Clerk...");
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.log("Step 2 FAILED: No user details from currentUser");
      throw new Error("User details not found");
    }
    console.log("Step 2 SUCCESS: User details retrieved");

    // Step 3: Sync with database using direct client
    console.log("Step 3: Syncing user with database...");
    const user = await directDb.user.upsert({
      where: { id: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || null,
        name: clerkUser.fullName || null,
        image: clerkUser.imageUrl || null,
      },
      create: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || null,
        name: clerkUser.fullName || null,
        image: clerkUser.imageUrl || null,
        plan: "free",
      },
    });
    console.log("Step 3 SUCCESS: User synced with database");

    console.log("=== SIMPLE REQUIRE USER SUCCESS ===");
    return user;
  } catch (error) {
    console.error("=== SIMPLE REQUIRE USER ERROR ===", error);
    throw error;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== DELETE CONVERSATION API START ===");
  console.log("Environment check:", {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasClerkKey: !!process.env.CLERK_SECRET_KEY,
    hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });

  try {
    // Step 1: Get conversation ID
    console.log("Step 1: Extracting conversation ID...");
    const { id: conversationId } = await params;
    console.log("Step 1 SUCCESS: Conversation ID:", conversationId);

    // Validate conversation ID format
    if (!conversationId || typeof conversationId !== 'string' || conversationId.length < 10) {
      console.log("Step 1 FAILED: Invalid conversation ID format");
      return Response.json({
        error: "INVALID_ID",
        message: "Invalid conversation ID format"
      }, { status: 400 });
    }

    // Step 2: Authenticate user using simplified function
    console.log("Step 2: Authenticating user...");
    const user = await simpleRequireUser();
    console.log("Step 2 SUCCESS: User authenticated:", user.id);

    // Step 3: Test database connection
    console.log("Step 3: Testing database connection...");
    await directDb.$queryRaw`SELECT 1`;
    console.log("Step 3 SUCCESS: Database connection verified");

    // Step 4: Find conversation
    console.log("Step 4: Finding conversation...");
    const existingConversation = await directDb.conversation.findUnique({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      console.log("Step 4 FAILED: Conversation not found or not owned by user");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found or you don't have permission to delete it"
      }, { status: 404 });
    }
    console.log("Step 4 SUCCESS: Conversation found");

    // Step 5: Delete conversation
    console.log("Step 5: Deleting conversation...");
    await directDb.conversation.delete({
      where: { id: conversationId },
    });
    console.log("Step 5 SUCCESS: Conversation deleted");

    console.log("=== DELETE CONVERSATION API SUCCESS ===");
    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error("=== DELETE CONVERSATION API ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);

    // Handle specific errors
    if (error?.message?.includes('not authenticated') ||
        error?.message?.includes('User not found')) {
      return Response.json({
        error: "AUTH_REQUIRED",
        message: "Please sign in to delete conversations"
      }, { status: 401 });
    }

    if (error?.code === 'P2025') {
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found"
      }, { status: 404 });
    }

    // Generic error
    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while deleting the conversation",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
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
  console.log("=== PATCH CONVERSATION API START ===");

  try {
    console.log("Step 1: Authenticating user...");
    const user = await requireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id);

    const { id: conversationId } = await params;
    console.log("Step 2: Conversation ID to update:", conversationId);

    // Parse request body
    console.log("Step 3: Parsing request body...");
    const body = await req.json();
    const updateData = updateConversationSchema.parse(body);
    console.log("Step 3 SUCCESS: Update data:", updateData);

    // Verify conversation ownership
    console.log("Step 4: Verifying conversation ownership...");
    const existingConversation = await directDb.conversation.findUnique({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      console.log("Step 4 FAILED: Conversation not found or not owned by user");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found or you don't have permission to update it"
      }, { status: 404 });
    }

    console.log("Step 4 SUCCESS: Conversation found and owned by user");

    // If updating activeAdvisorId, verify the advisor exists
    if (updateData.activeAdvisorId) {
      console.log("Step 5: Verifying advisor exists...");
      const advisor = await directDb.advisor.findUnique({
        where: {
          id: updateData.activeAdvisorId,
          status: "active",
        },
      });

      if (!advisor) {
        console.log("Step 5 FAILED: Advisor not found or inactive");
        return Response.json({
          error: "ADVISOR_NOT_FOUND",
          message: "The specified advisor was not found or is inactive"
        }, { status: 400 });
      }

      console.log("Step 5 SUCCESS: Advisor verified:", advisor.id);
    }

    // Update conversation
    console.log("Step 6: Updating conversation in database...");
    const updatedConversation = await directDb.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        messages: {
          include: { advisor: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    console.log("Step 6 SUCCESS: Conversation updated successfully");

    // Format response
    const response = {
      success: true,
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        activeAdvisorId: updatedConversation.activeAdvisorId,
        createdAt: updatedConversation.createdAt,
        updatedAt: updatedConversation.updatedAt,
        messageCount: updatedConversation.messages.length,
      },
      updated: updateData,
    };

    console.log("=== PATCH CONVERSATION API SUCCESS ===");
    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== PATCH CONVERSATION API ERROR ===");
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
        message: "Please sign in to update conversations"
      }, { status: 401 });
    }

    // Handle database errors
    if (error?.code === 'P2025') {
      // Prisma error: Record not found
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found"
      }, { status: 404 });
    }

    // Generic error handler
    return Response.json({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred while updating the conversation"
    }, { status: 500 });
  }
}
