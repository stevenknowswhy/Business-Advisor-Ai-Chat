import { NextRequest } from "next/server";

import { requireUser } from "~/server/auth/require-user";
import { getActiveAdvisors, formatAdvisorForClient } from "~/server/advisors/persona";

export async function GET(req: NextRequest) {
  console.log("=== ADVISORS API START ===");
  console.log("Request URL:", req.url);

  try {
    // Require authentication to access advisors
    await requireUser();

    const advisors = await getActiveAdvisors();

    // Format advisors for client consumption
    const formattedAdvisors = advisors.map(formatAdvisorForClient);

    return Response.json(formattedAdvisors);

  } catch (error) {
    console.error("=== ADVISORS API ERROR ===");
    console.error("Get advisors error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
