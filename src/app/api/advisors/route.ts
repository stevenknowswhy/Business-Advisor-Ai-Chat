/**
 * @deprecated This API route has been replaced by Convex functions.
 * Use the following Convex hooks instead:
 * - GET /api/advisors -> useAdvisors() or useActiveAdvisors()
 * - POST /api/advisors -> useCreateAdvisor()
 *
 * This route will be removed in a future version.
 */

import { NextRequest } from "next/server";

import { requireUser } from "~/server/auth/require-user";
import { getActiveAdvisors, formatAdvisorForClient } from "~/server/advisors/persona";
import { db } from "~/server/db";
import { type AdvisorFormData } from "~/components/chat/AdvisorModal";

export async function GET(req: NextRequest) {
  console.log("=== ADVISORS API START ===");
  console.log("Request URL:", req.url);

  try {
    // TEMPORARY: Skip authentication while database is down
    // await requireUser();

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

/**
 * Create a new advisor
 * POST /api/advisors
 */
export async function POST(req: NextRequest) {
  try {
    console.log("=== CREATE ADVISOR API START ===");

    // Authenticate user
    const user = await requireUser();
    console.log("User authenticated:", user.id.substring(0, 10) + "...");

    // Parse request body
    const body = await req.json();
    const { firstName, lastName, title, jsonConfiguration, imageUrl } = body as AdvisorFormData & { imageUrl?: string };

    console.log("Creating advisor:", { firstName, lastName, title });

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !title?.trim() || !jsonConfiguration?.trim()) {
      return Response.json(
        { error: "Missing required fields: firstName, lastName, title, jsonConfiguration" },
        { status: 400 }
      );
    }

    // Validate JSON configuration
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(jsonConfiguration);
    } catch (error) {
      return Response.json(
        { error: "Invalid JSON configuration" },
        { status: 400 }
      );
    }

    // Generate advisor ID
    const advisorId = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`;

    // Create advisor
    const advisor = await db.advisor.create({
      data: {
        id: advisorId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        imageUrl: imageUrl || null,
        schemaVersion: "1.0.0",
        status: "active",
        persona: {
          name: `${firstName} ${lastName}`,
          title: title.trim(),
          ...parsedConfig.persona || {},
        },
        roleDefinition: parsedConfig.roleDefinition || null,
        components: parsedConfig.components || [],
        metadata: parsedConfig.metadata || null,
        localization: parsedConfig.localization || null,
        modelHint: parsedConfig.modelHint || null,
        tags: parsedConfig.tags || [],
      },
    });

    console.log("Advisor created successfully:", advisor.id);

    // Format response using existing formatter
    const formattedAdvisor = formatAdvisorForClient(advisor);

    console.log("=== CREATE ADVISOR API SUCCESS ===");
    return Response.json(formattedAdvisor, { status: 201 });

  } catch (error) {
    console.error("Create advisor error:", error);
    return Response.json(
      { error: "Failed to create advisor" },
      { status: 500 }
    );
  }
}
