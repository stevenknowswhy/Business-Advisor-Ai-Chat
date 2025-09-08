/**
 * Health check API endpoint for monitoring application status
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create direct Prisma client to bypass env validation issues
const healthDb = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const detailed = searchParams.get('detailed') === 'true';
  const startTime = Date.now();

  console.log("=== HEALTH CHECK START ===", {
    timestamp: new Date().toISOString(),
    detailed,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    // Direct database health check
    let dbHealthy = false;
    let dbLatency = 0;
    let dbError: string | undefined;
    let dbDetails: any = {};

    try {
      console.log("Testing database connection...");
      const dbStartTime = Date.now();
      const result = await healthDb.$queryRaw`SELECT 1 as health_check, NOW() as timestamp`;
      dbLatency = Date.now() - dbStartTime;
      dbHealthy = true;

      if (detailed) {
        dbDetails = {
          connectionTest: result,
          userCount: await healthDb.user.count(),
          conversationCount: await healthDb.conversation.count(),
        };
      }

      console.log("Database health check SUCCESS:", { dbLatency, dbHealthy });
    } catch (error) {
      dbLatency = Date.now() - startTime;
      dbHealthy = false;
      dbError = error instanceof Error ? error.message : String(error);
      console.error("Database health check FAILED:", { dbError, dbLatency });
    }

    const response = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealthy,
        latency: dbLatency,
        error: dbError,
        ...(detailed ? { details: dbDetails } : {}),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasClerkKey: !!process.env.CLERK_SECRET_KEY,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      },
      totalDuration: Date.now() - startTime,
    };

    const statusCode = dbHealthy ? 200 : 503;

    console.log("=== HEALTH CHECK COMPLETE ===", {
      status: response.status,
      statusCode,
      totalDuration: response.totalDuration
    });

    return Response.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error("=== HEALTH CHECK ERROR ===", error);

    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown health check error',
      database: {
        healthy: false,
        error: 'Health check failed',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasClerkKey: !!process.env.CLERK_SECRET_KEY,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      },
      totalDuration: Date.now() - startTime,
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
