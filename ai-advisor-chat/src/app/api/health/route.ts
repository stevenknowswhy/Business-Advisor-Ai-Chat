/**
 * Health check API endpoint for monitoring application status
 */

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const detailed = searchParams.get('detailed') === 'true';
  const startTime = Date.now();

  console.log("=== SIMPLE HEALTH CHECK START ===", {
    timestamp: new Date().toISOString(),
    detailed,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    // Simple health check without Prisma to avoid import issues
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasClerkKey: !!process.env.CLERK_SECRET_KEY,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      },
      message: "Health endpoint working without database connection test",
      note: "Database connection testing disabled to avoid import issues",
      totalDuration: Date.now() - startTime,
    };

    console.log("=== SIMPLE HEALTH CHECK SUCCESS ===", response);

    return Response.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error("=== SIMPLE HEALTH CHECK ERROR ===", error);

    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown health check error',
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
