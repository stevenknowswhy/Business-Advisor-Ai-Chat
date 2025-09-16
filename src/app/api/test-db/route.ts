import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a direct Prisma client for testing
const createTestPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (error) {
    console.error("Failed to create test Prisma client:", error);
    throw error;
  }
};

// Mask sensitive parts of the database URL for security
function maskDatabaseUrl(url: string): string {
  if (!url) return "Not configured";

  try {
    const urlObj = new URL(url);
    const password = urlObj.password;
    if (password) {
      urlObj.password = "*".repeat(Math.min(password.length, 8));
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, mask the middle part
    if (url.length > 20) {
      return url.substring(0, 10) + "*".repeat(10) + url.substring(url.length - 10);
    }
    return "*".repeat(url.length);
  }
}

export async function GET(req: NextRequest) {
  console.log("=== DATABASE CONNECTIVITY TEST START ===");
  console.log("Request URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());

  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrl: maskDatabaseUrl(process.env.DATABASE_URL || ""),
    connectionStatus: "unknown",
    tests: [] as Array<{
      name: string;
      status: "success" | "failure" | "skipped";
      duration: number;
      result?: any;
      error?: string;
    }>,
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    },
    recommendations: [] as string[],
  };

  let testDb: PrismaClient | null = null;

  try {
    // Test 1: Prisma Client Creation
    const test1Start = Date.now();
    try {
      testDb = createTestPrismaClient();
      testResults.tests.push({
        name: "Prisma Client Creation",
        status: "success",
        duration: Date.now() - test1Start,
        result: "Prisma client created successfully",
      });
    } catch (error) {
      testResults.tests.push({
        name: "Prisma Client Creation",
        status: "failure",
        duration: Date.now() - test1Start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    // Test 2: Basic Database Connection
    const test2Start = Date.now();
    try {
      const connectionTest = await testDb.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
      testResults.connectionStatus = "connected";
      testResults.tests.push({
        name: "Database Connection",
        status: "success",
        duration: Date.now() - test2Start,
        result: connectionTest,
      });
    } catch (error) {
      testResults.connectionStatus = "failed";
      testResults.tests.push({
        name: "Database Connection",
        status: "failure",
        duration: Date.now() - test2Start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    // Test 3: Database Schema Check
    const test3Start = Date.now();
    try {
      const tableCheck = await testDb.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      testResults.tests.push({
        name: "Schema Verification",
        status: "success",
        duration: Date.now() - test3Start,
        result: { tables: tableCheck },
      });
    } catch (error) {
      testResults.tests.push({
        name: "Schema Verification",
        status: "failure",
        duration: Date.now() - test3Start,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: User Table Operations
    const test4Start = Date.now();
    try {
      // Try to count users
      const userCount = await testDb.user.count();

      // Try to find first user
      const firstUser = await testDb.user.findFirst({
        select: { id: true, email: true, name: true, plan: true, createdAt: true }
      });

      testResults.tests.push({
        name: "User Table Operations",
        status: "success",
        duration: Date.now() - test4Start,
        result: {
          userCount,
          hasUsers: userCount > 0,
          firstUser: firstUser ? {
            id: firstUser.id.substring(0, 10) + "...",
            email: firstUser.email,
            name: firstUser.name,
            plan: firstUser.plan,
            createdAt: firstUser.createdAt,
          } : null,
        },
      });
    } catch (error) {
      testResults.tests.push({
        name: "User Table Operations",
        status: "failure",
        duration: Date.now() - test4Start,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 5: Advisor Table Operations
    const test5Start = Date.now();
    try {
      const advisorCount = await testDb.advisor.count();
      const activeAdvisors = await testDb.advisor.findMany({
        where: { status: "active" },
        select: { id: true, firstName: true, lastName: true, status: true },
        take: 3,
      });

      testResults.tests.push({
        name: "Advisor Table Operations",
        status: "success",
        duration: Date.now() - test5Start,
        result: {
          advisorCount,
          activeAdvisorCount: activeAdvisors.length,
          sampleAdvisors: activeAdvisors,
        },
      });
    } catch (error) {
      testResults.tests.push({
        name: "Advisor Table Operations",
        status: "failure",
        duration: Date.now() - test5Start,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 6: Conversation Table Operations
    const test6Start = Date.now();
    try {
      const conversationCount = await testDb.conversation.count();
      const recentConversations = await testDb.conversation.findMany({
        select: { id: true, title: true, userId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      });

      testResults.tests.push({
        name: "Conversation Table Operations",
        status: "success",
        duration: Date.now() - test6Start,
        result: {
          conversationCount,
          recentConversations: recentConversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            userId: conv.userId.substring(0, 10) + "...",
            createdAt: conv.createdAt,
          })),
        },
      });
    } catch (error) {
      testResults.tests.push({
        name: "Conversation Table Operations",
        status: "failure",
        duration: Date.now() - test6Start,
        error: error instanceof Error ? error.message : String(error),
      });
    }

  } catch (mainError) {
    console.error("Database test failed:", mainError);
    testResults.connectionStatus = "failed";
  } finally {
    // Clean up Prisma client
    if (testDb) {
      try {
        await testDb.$disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting from database:", disconnectError);
      }
    }
  }

  // Calculate summary
  testResults.summary.totalTests = testResults.tests.length;
  testResults.summary.passed = testResults.tests.filter(t => t.status === "success").length;
  testResults.summary.failed = testResults.tests.filter(t => t.status === "failure").length;
  testResults.summary.skipped = testResults.tests.filter(t => t.status === "skipped").length;

  // Generate recommendations
  if (testResults.connectionStatus === "connected") {
    testResults.recommendations.push("✅ Database connection is working! You can transition back from mock data to real database operations.");
    testResults.recommendations.push("🔄 Update API routes to remove mock data and re-enable database queries.");
    testResults.recommendations.push("🧪 Run additional tests to ensure all functionality works with real data.");
  } else {
    testResults.recommendations.push("❌ Database connection failed. Continue using mock data for now.");
    testResults.recommendations.push("🔧 Check database server status and connection string.");
    testResults.recommendations.push("📋 Verify environment variables are correctly configured.");
  }

  if (testResults.summary.failed > 0) {
    testResults.recommendations.push(`⚠️ ${testResults.summary.failed} test(s) failed. Review error messages above.`);
  }

  console.log("=== DATABASE CONNECTIVITY TEST COMPLETE ===");
  console.log("Connection Status:", testResults.connectionStatus);
  console.log("Tests Passed:", testResults.summary.passed);
  console.log("Tests Failed:", testResults.summary.failed);

  return NextResponse.json(testResults, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
