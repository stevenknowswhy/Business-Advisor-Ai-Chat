/**
 * Basic Database Test API - Messages List
 * Tests direct database operations without authentication
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create direct Prisma client for testing
const testDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log("=== BASIC DELETE TEST - GET MESSAGES START ===", {
    timestamp: new Date().toISOString(),
    url: req.url,
  });

  try {
    // Test database connection first
    console.log("Step 1: Testing database connection...");
    await testDb.$queryRaw`SELECT 1 as test`;
    console.log("Step 1 SUCCESS: Database connection verified");

    // Get test messages (limit to recent ones for testing)
    console.log("Step 2: Fetching test messages...");
    const messages = await testDb.message.findMany({
      where: {
        // Only get messages from test conversations or recent messages
        OR: [
          { content: { contains: "TEST_MESSAGE" } },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit for testing
      select: {
        id: true,
        content: true,
        createdAt: true,
        conversationId: true,
        sender: true,
      }
    });

    console.log("Step 2 SUCCESS: Found", messages.length, "test messages");

    const response = {
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        conversationId: msg.conversationId,
        sender: msg.sender,
      })),
      count: messages.length,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log("=== BASIC DELETE TEST - GET MESSAGES SUCCESS ===", {
      count: messages.length,
      duration: response.duration,
    });

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error("=== BASIC DELETE TEST - GET MESSAGES ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);

    const errorResponse = {
      success: false,
      error: "FETCH_MESSAGES_FAILED",
      message: "Failed to fetch test messages from database",
      details: {
        originalError: error?.message,
        code: error?.code,
        type: typeof error,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
