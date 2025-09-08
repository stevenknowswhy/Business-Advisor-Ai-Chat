/**
 * Health check API endpoint for monitoring application status
 */

import { NextRequest } from "next/server";
import { checkDatabaseHealth, checkDatabaseHealthDetailed } from "~/lib/db-health";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const detailed = searchParams.get('detailed') === 'true';

  try {
    const healthCheck = detailed 
      ? await checkDatabaseHealthDetailed()
      : await checkDatabaseHealth();

    const response = {
      status: healthCheck.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: healthCheck.timestamp,
      database: {
        healthy: healthCheck.isHealthy,
        latency: healthCheck.latency,
        error: healthCheck.error,
        ...(detailed && 'details' in healthCheck ? { details: healthCheck.details } : {}),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasClerkKey: !!process.env.CLERK_SECRET_KEY,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      },
    };

    const statusCode = healthCheck.isHealthy ? 200 : 503;
    
    return Response.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error("Health check error:", error);
    
    return Response.json({
      status: 'error',
      timestamp: new Date(),
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
