import { NextRequest } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

// REMOVED: import { requireUser } from "~/server/auth/require-user";
// This import causes environment validation failures in production
// We use debugRequireUser() instead which bypasses the problematic imports

// REMOVED: import { formatAdvisorForClient } from "~/server/advisors/persona";
// This import also causes environment validation failures in production
// We create a local version below to avoid the problematic import chain

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

// Local version of formatAdvisorForClient to avoid problematic imports
function localFormatAdvisorForClient(advisor: any) {
  // Simple formatting without the complex persona logic to avoid imports
  return {
    id: advisor.id,
    name: advisor.name || 'Unknown Advisor',
    title: advisor.title || 'Business Advisor',
    image: advisor.image || null,
    oneLiner: advisor.oneLiner || 'Expert business advisor',
    archetype: advisor.archetype || 'general',
    bio: advisor.bio || 'Experienced business advisor',
    // Add other fields as needed, with safe defaults
  };
}

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
    const user = await debugRequireUser();
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
      advisor: message.advisor ? localFormatAdvisorForClient(message.advisor) : null,
    }));

    return Response.json({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      activeAdvisor: conversation.activeAdvisor ? localFormatAdvisorForClient(conversation.activeAdvisor) : null,
      messages: formattedMessages,
    });

  } catch (error) {
    console.error("Get conversation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}



// Enhanced requireUser function with comprehensive error handling and logging
async function debugRequireUser() {
  const startTime = Date.now();
  console.log("=== DEBUG REQUIRE USER START ===", {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
  });

  try {
    // Step 1: Test Clerk auth function
    console.log("Step 1: Testing Clerk auth function...");
    let authResult;
    try {
      authResult = await auth();
      console.log("Step 1 SUCCESS: Auth function executed", {
        hasUserId: !!authResult.userId,
        userId: authResult.userId?.substring(0, 10) + "...",
        sessionId: authResult.sessionId?.substring(0, 10) + "...",
      });
    } catch (authError) {
      console.error("Step 1 FAILED: Auth function error", {
        error: authError instanceof Error ? authError.message : String(authError),
        stack: authError instanceof Error ? authError.stack : undefined,
      });
      throw new Error(`Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`);
    }

    const { userId } = authResult;
    if (!userId) {
      console.log("Step 1 FAILED: No user ID from auth");
      throw new Error("User not authenticated - no userId in auth result");
    }

    // Step 2: Test currentUser function
    console.log("Step 2: Testing currentUser function...");
    let clerkUser;
    try {
      clerkUser = await currentUser();
      console.log("Step 2 SUCCESS: CurrentUser function executed", {
        hasUser: !!clerkUser,
        userId: clerkUser?.id?.substring(0, 10) + "...",
        hasEmail: !!clerkUser?.emailAddresses?.[0]?.emailAddress,
        emailDomain: clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[1],
      });
    } catch (currentUserError) {
      console.error("Step 2 FAILED: CurrentUser function error", {
        error: currentUserError instanceof Error ? currentUserError.message : String(currentUserError),
        stack: currentUserError instanceof Error ? currentUserError.stack : undefined,
      });
      throw new Error(`Current user fetch failed: ${currentUserError instanceof Error ? currentUserError.message : String(currentUserError)}`);
    }

    if (!clerkUser) {
      console.log("Step 2 FAILED: No user details from currentUser");
      throw new Error("User details not found from Clerk");
    }

    // Step 3: Test database connection
    console.log("Step 3: Testing database connection...");
    try {
      const connectionTest = await directDb.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
      console.log("Step 3 SUCCESS: Database connection test passed", {
        result: connectionTest,
        connectionTime: Date.now() - startTime,
      });
    } catch (dbConnectionError) {
      console.error("Step 3 FAILED: Database connection error", {
        error: dbConnectionError instanceof Error ? dbConnectionError.message : String(dbConnectionError),
        code: (dbConnectionError as any)?.code,
        stack: dbConnectionError instanceof Error ? dbConnectionError.stack : undefined,
      });
      throw new Error(`Database connection failed: ${dbConnectionError instanceof Error ? dbConnectionError.message : String(dbConnectionError)}`);
    }

    // Step 4: Test user upsert operation
    console.log("Step 4: Testing user upsert operation...");
    let user;
    try {
      const userData = {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || null,
        name: clerkUser.fullName || null,
        image: clerkUser.imageUrl || null,
        plan: "free" as const,
      };

      console.log("Step 4: Attempting upsert with data", {
        userId: userData.id.substring(0, 10) + "...",
        hasEmail: !!userData.email,
        hasName: !!userData.name,
        hasImage: !!userData.image,
      });

      user = await directDb.user.upsert({
        where: { id: userId },
        update: {
          email: userData.email,
          name: userData.name,
          image: userData.image,
        },
        create: userData,
      });

      console.log("Step 4 SUCCESS: User upsert completed", {
        userId: user.id.substring(0, 10) + "...",
        email: user.email,
        upsertTime: Date.now() - startTime,
      });
    } catch (upsertError) {
      console.error("Step 4 FAILED: User upsert error", {
        error: upsertError instanceof Error ? upsertError.message : String(upsertError),
        code: (upsertError as any)?.code,
        meta: (upsertError as any)?.meta,
        stack: upsertError instanceof Error ? upsertError.stack : undefined,
      });
      throw new Error(`User sync failed: ${upsertError instanceof Error ? upsertError.message : String(upsertError)}`);
    }

    console.log("=== DEBUG REQUIRE USER SUCCESS ===", {
      totalTime: Date.now() - startTime,
      userId: user.id.substring(0, 10) + "...",
    });
    return user;

  } catch (error) {
    console.error("=== DEBUG REQUIRE USER FINAL ERROR ===", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: Date.now() - startTime,
    });
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

    // Step 2: Authenticate user using enhanced debugging function
    console.log("Step 2: Authenticating user with enhanced debugging...");
    const user = await debugRequireUser();
    console.log("Step 2 SUCCESS: User authenticated:", user.id.substring(0, 10) + "...");

    // Step 3: Test database connection
    console.log("Step 3: Testing database connection...");
    await directDb.$queryRaw`SELECT 1`;
    console.log("Step 3 SUCCESS: Database connection verified");

    // Step 4: Check if conversation exists and belongs to user
    console.log("Step 4: Checking conversation ownership...");
    const existingConversation = await directDb.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userId: true,
        title: true,
        createdAt: true,
      }
    });

    if (!existingConversation) {
      console.log("Step 4 FAILED: Conversation not found");
      return Response.json({
        error: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found in database"
      }, { status: 404 });
    }

    // Check if user owns the conversation (authorization)
    if (existingConversation.userId !== user.id) {
      console.log("Step 4 FAILED: User does not own this conversation", {
        conversationUserId: existingConversation.userId,
        currentUserId: user.id,
      });
      return Response.json({
        error: "UNAUTHORIZED",
        message: "You don't have permission to delete this conversation"
      }, { status: 403 });
    }

    console.log("Step 4 SUCCESS: Conversation found and owned by user", {
      id: existingConversation.id,
      title: existingConversation.title,
      userId: existingConversation.userId.substring(0, 10) + "...",
    });

    // Step 5: Transactionally delete children first, then the conversation
    console.log("Step 5: Transactionally deleting children and conversation...");
    await directDb.$transaction([
      directDb.message.deleteMany({ where: { conversationId } }),
      directDb.threadSummary.deleteMany({ where: { conversationId } }),
      directDb.advisorMemory.deleteMany({ where: { conversationId } }),
      directDb.conversation.delete({ where: { id: conversationId } }),
    ]);

    console.log("Step 5 SUCCESS: Conversation and dependents deleted", {
      conversationId,
    });

    console.log("=== DELETE CONVERSATION API SUCCESS ===", {
      conversationId,
      userId: user.id.substring(0, 10) + "...",
    });

    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error("=== DELETE CONVERSATION API ERROR ===");
    console.error("Error timestamp:", new Date().toISOString());
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error meta:", error?.meta);
    console.error("Error stack:", error?.stack);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Enhanced error categorization
    let errorCategory = "UNKNOWN";
    let statusCode = 500;
    let userMessage = "An unexpected error occurred while deleting the conversation";

    // Authentication errors
    if (error?.message?.includes('not authenticated') ||
        error?.message?.includes('User not found') ||
        error?.message?.includes('Authentication failed') ||
        error?.message?.includes('Current user fetch failed')) {
      errorCategory = "AUTH_ERROR";
      statusCode = 401;
      userMessage = "Please sign in to delete conversations";
    }
    // Database connection errors
    else if (error?.message?.includes('Database connection failed') ||
             error?.message?.includes('connect') ||
             error?.code === 'ECONNREFUSED' ||
             error?.code === 'ETIMEDOUT') {
      errorCategory = "DATABASE_CONNECTION_ERROR";
      statusCode = 503;
      userMessage = "Database connection failed. Please try again in a moment.";
    }
    // User sync errors
    else if (error?.message?.includes('User sync failed') ||
             error?.message?.includes('upsert')) {
      errorCategory = "USER_SYNC_ERROR";
      statusCode = 500;
      userMessage = "User synchronization failed. Please try signing in again.";
    }
    // Prisma specific errors
    else if (error?.code === 'P2025') {
      errorCategory = "CONVERSATION_NOT_FOUND";
      statusCode = 404;
      userMessage = "Conversation not found";
    }
    else if (error?.code === 'P2002') {
      errorCategory = "CONSTRAINT_ERROR";
      statusCode = 409;
      userMessage = "Database constraint error";
    }
    else if (error?.code?.startsWith('P')) {
      errorCategory = "PRISMA_ERROR";
      statusCode = 500;
      userMessage = "Database operation failed. Please try again.";
    }
    // Clerk specific errors
    else if (error?.message?.includes('Clerk') ||
             error?.message?.includes('clerk')) {
      errorCategory = "CLERK_ERROR";
      statusCode = 500;
      userMessage = "Authentication service error. Please try again.";
    }

    console.error("Error categorized as:", errorCategory, "with status:", statusCode);

    return Response.json({
      error: errorCategory,
      message: userMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalMessage: error?.message,
        code: error?.code,
        meta: error?.meta,
      } : undefined,
      timestamp: new Date().toISOString(),
    }, { status: statusCode });
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
    const user = await debugRequireUser();
    console.log("Step 1 SUCCESS: User authenticated:", user.id.substring(0, 10) + "...");

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
