import { NextRequest } from "next/server";

import { requireUser } from "~/server/auth/require-user";
import { formatAdvisorForClient } from "~/server/advisors/persona";
import { db } from "~/server/db";
import { type AdvisorFormData } from "~/components/chat/AdvisorModal";

/**
 * Update an existing advisor
 * PATCH /api/advisors/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== UPDATE ADVISOR API START ===");

    // Authenticate user
    const user = await requireUser();
    console.log("User authenticated:", user.id.substring(0, 10) + "...");

    const { id: advisorId } = await params;
    console.log("Updating advisor:", advisorId);

    // Parse request body
    const body = await req.json();
    const { firstName, lastName, title, jsonConfiguration, imageUrl } = body as AdvisorFormData & { imageUrl?: string };

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

    // Check if advisor exists
    const existingAdvisor = await db.advisor.findUnique({
      where: { id: advisorId },
    });

    if (!existingAdvisor) {
      return Response.json(
        { error: "Advisor not found" },
        { status: 404 }
      );
    }

    // Update advisor
    const updatedAdvisor = await db.advisor.update({
      where: { id: advisorId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        imageUrl: imageUrl || null,
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
        updatedAt: new Date(),
      },
    });

    console.log("Advisor updated successfully:", updatedAdvisor.id);

    // Format response using existing formatter
    const formattedAdvisor = formatAdvisorForClient(updatedAdvisor);

    console.log("=== UPDATE ADVISOR API SUCCESS ===");
    return Response.json(formattedAdvisor);

  } catch (error) {
    console.error("Update advisor error:", error);
    return Response.json(
      { error: "Failed to update advisor" },
      { status: 500 }
    );
  }
}

/**
 * Delete an advisor
 * DELETE /api/advisors/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== DELETE ADVISOR API START ===");

    // Authenticate user
    const user = await requireUser();
    console.log("User authenticated:", user.id.substring(0, 10) + "...");

    const { id: advisorId } = await params;
    console.log("Deleting advisor:", advisorId);

    // Check if advisor exists
    const existingAdvisor = await db.advisor.findUnique({
      where: { id: advisorId },
    });

    if (!existingAdvisor) {
      return Response.json(
        { error: "Advisor not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting status to archived
    await db.advisor.update({
      where: { id: advisorId },
      data: {
        status: "archived",
        updatedAt: new Date(),
      },
    });

    console.log("Advisor archived successfully:", advisorId);

    console.log("=== DELETE ADVISOR API SUCCESS ===");
    return Response.json({ success: true, message: "Advisor archived successfully" });

  } catch (error) {
    console.error("Delete advisor error:", error);
    return Response.json(
      { error: "Failed to delete advisor" },
      { status: 500 }
    );
  }
}
