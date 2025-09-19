import { convex } from "./client";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Server-side project management utilities
 * These functions provide a server-side interface to Convex project queries and mutations
 */

/**
 * Get all projects for the authenticated user
 */
export async function getProjects() {
  return await convex.query(api.projects.getProjects);
}

/**
 * Get a project by ID
 */
export async function getProjectById({ projectId }: { projectId: string }) {
  return await convex.query(api.projects.getProjectById, { projectId: projectId as Id<"projects"> });
}

/**
 * Create a new project
 */
export async function createProject(data: {
  name: string;
  description?: string;
  tags?: string[];
  color?: string;
  icon?: string;
}) {
  return await convex.mutation(api.projects.createProject, data);
}

/**
 * Update a project
 */
export async function updateProject({ projectId, ...data }: {
  projectId: string;
  name?: string;
  description?: string;
  status?: "active" | "archived" | "completed";
  tags?: string[];
  color?: string;
  icon?: string;
}) {
  return await convex.mutation(api.projects.updateProject, { projectId: projectId as Id<"projects">, ...data });
}

/**
 * Delete a project
 */
export async function deleteProject({ projectId }: { projectId: string }) {
  return await convex.mutation(api.projects.deleteProject, { projectId: projectId as Id<"projects"> });
}

/**
 * Get all conversations for a project
 */
export async function getProjectConversations({ projectId }: { projectId: string }) {
  return await convex.query(api.projects.getProjectConversations, { projectId: projectId as Id<"projects"> });
}

/**
 * Add a conversation to a project
 */
export async function addConversationToProject({ projectId, conversationId }: {
  projectId: string;
  conversationId: string;
}) {
  return await convex.mutation(api.projects.addConversationToProject, {
    projectId: projectId as Id<"projects">,
    conversationId: conversationId as Id<"conversations">
  });
}

/**
 * Remove a conversation from a project
 */
export async function removeConversationFromProject({ projectId, conversationId }: {
  projectId: string;
  conversationId: string;
}) {
  return await convex.mutation(api.projects.removeConversationFromProject, {
    projectId: projectId as Id<"projects">,
    conversationId: conversationId as Id<"conversations">
  });
}

/**
 * Get project statistics
 */
export async function getProjectStats({ projectId }: { projectId: string }) {
  return await convex.query(api.projects.getProjectStats, { projectId: projectId as Id<"projects"> });
}