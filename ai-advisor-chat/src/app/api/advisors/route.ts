import { NextRequest } from "next/server";
import { getActiveAdvisors, formatAdvisorForClient } from "~/server/convex/advisors";

export async function GET(req: NextRequest) {
  console.log("=== ADVISORS API START (CONVEX) ===");
  console.log("Request URL:", req.url);

  try {
    const advisors = await getActiveAdvisors();
    console.log("Retrieved advisors from Convex:", advisors.length);

    // Format advisors for client consumption
    const formattedAdvisors = advisors.map(formatAdvisorForClient);

    return Response.json(formattedAdvisors);

  } catch (error) {
    console.error("=== ADVISORS API ERROR ===");
    console.error("Get advisors error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// POST method temporarily disabled during migration
// Will be re-enabled once authentication is migrated to Convex
