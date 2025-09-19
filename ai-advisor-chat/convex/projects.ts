import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Project Management Functions
 *
 * These functions handle project CRUD operations and conversation-to-project relationships.
 */

// Get all projects for the current user
export const getProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // For each project, get the conversation count
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const conversationCount = await ctx.db
          .query("projectConversations")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
          .then((relations) => relations.length);

        // Get the last activity timestamp
        const lastActivity = await ctx.db
          .query("projectConversations")
          .withIndex("by_project_added", (q) => q.eq("projectId", project._id))
          .order("desc")
          .first()
          .then((relation) => relation?.addedAt || project.updatedAt);

        return {
          ...project,
          conversationCount,
          lastActivity,
        };
      })
    );

    return projectsWithCounts;
  },
});

// Get a single project by ID
export const getProjectById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      return null;
    }

    // Get conversation count
    const conversationCount = await ctx.db
      .query("projectConversations")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect()
      .then((relations) => relations.length);

    return {
      ...project,
      conversationCount,
    };
  },
});

// Create a new project
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      userId,
      status: "active",
      tags: args.tags || [],
      color: args.color,
      icon: args.icon,
      iconUrl: args.iconUrl,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

// Update an existing project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"), v.literal("completed"))),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    const { projectId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(projectId, {
        ...filteredUpdates,
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a project (soft delete by archiving)
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    // Soft delete by archiving
    await ctx.db.patch(args.projectId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    // Note: We don't delete the project-conversation relationships
    // This allows for project restoration if needed
  },
});

// Get all conversations for a project
export const getProjectConversations = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      return [];
    }

    // Get all project-conversation relationships
    const relations = await ctx.db
      .query("projectConversations")
      .withIndex("by_project_added", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    // Get the actual conversations
    const conversations = await Promise.all(
      relations.map(async (relation) => {
        const conversation = await ctx.db.get(relation.conversationId);
        if (!conversation) return null;

        // Get the active advisor for this conversation
        const activeAdvisor = conversation.activeAdvisorId
          ? await ctx.db.get(conversation.activeAdvisorId)
          : null;

        return {
          ...conversation,
          activeAdvisor,
          addedToProjectAt: relation.addedAt,
          addedBy: relation.addedBy,
        };
      })
    );

    return conversations.filter(Boolean);
  },
});

// Add a conversation to a project
export const addConversationToProject = mutation({
  args: {
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    // Check if conversation is already in project
    const existingRelation = await ctx.db
      .query("projectConversations")
      .withIndex("by_project_conversation", (q) =>
        q.eq("projectId", args.projectId).eq("conversationId", args.conversationId)
      )
      .first();

    if (existingRelation) {
      return; // Already in project
    }

    // Add conversation to project
    await ctx.db.insert("projectConversations", {
      projectId: args.projectId,
      conversationId: args.conversationId,
      addedAt: Date.now(),
      addedBy: userId,
    });
  },
});

// Remove a conversation from a project
export const removeConversationFromProject = mutation({
  args: {
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    // Find and remove the relationship
    const relation = await ctx.db
      .query("projectConversations")
      .withIndex("by_project_conversation", (q) =>
        q.eq("projectId", args.projectId).eq("conversationId", args.conversationId)
      )
      .first();

    if (relation) {
      await ctx.db.delete(relation._id);
    }
  },
});

// Get project for a specific conversation
export const getProjectForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    // Find the project relationship
    const relation = await ctx.db
      .query("projectConversations")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .first();

    if (!relation) {
      return null;
    }

    const project = await ctx.db.get(relation.projectId);
    return project;
  },
});

// Move a conversation from one project to another
export const moveConversationToProject = mutation({
  args: {
    conversationId: v.id("conversations"),
    fromProjectId: v.optional(v.id("projects")),
    toProjectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    // Remove from source project if specified
    if (args.fromProjectId) {
      const fromRelation = await ctx.db
        .query("projectConversations")
        .withIndex("by_project_conversation", (q) =>
          q.eq("projectId", args.fromProjectId!).eq("conversationId", args.conversationId)
        )
        .first();

      if (fromRelation) {
        await ctx.db.delete(fromRelation._id);
      }
    }

    // Add to destination project if specified
    if (args.toProjectId) {
      // Verify destination project ownership
      const toProject = await ctx.db.get(args.toProjectId!);
      if (!toProject || toProject.userId !== userId) {
        throw new Error("Destination project not found or access denied");
      }

      // Check if already in destination
      const existingRelation = await ctx.db
        .query("projectConversations")
        .withIndex("by_project_conversation", (q) =>
          q.eq("projectId", args.toProjectId!).eq("conversationId", args.conversationId)
        )
        .first();

      if (!existingRelation) {
        await ctx.db.insert("projectConversations", {
          projectId: args.toProjectId!,
          conversationId: args.conversationId,
          addedAt: Date.now(),
          addedBy: userId,
        });
      }
    }
  },
});

// Get projects that don't contain a specific conversation
export const getAvailableProjectsForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all user projects
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .collect();

    // Get projects that already contain this conversation
    const existingRelations = await ctx.db
      .query("projectConversations")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const existingProjectIds = new Set(existingRelations.map(r => r.projectId.toString()));

    // Filter out projects that already contain the conversation
    return allProjects.filter(project => !existingProjectIds.has(project._id.toString()));
  },
});

// Get project statistics
export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      return null;
    }

    // Get all conversations in project
    const relations = await ctx.db
      .query("projectConversations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get message counts for each conversation
    const messageCounts = await Promise.all(
      relations.map(async (relation) => {
        const count = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", relation.conversationId))
          .collect()
          .then(messages => messages.length);
        return count;
      })
    );

    const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);
    const totalConversations = relations.length;

    // Get unique advisors used in project
    const conversations = await Promise.all(
      relations.map(r => ctx.db.get(r.conversationId))
    );
    const advisorIds = new Set(
      conversations
        .filter(conv => conv?.activeAdvisorId)
        .map(conv => conv?.activeAdvisorId?.toString())
    );
    const uniqueAdvisors = advisorIds.size;

    return {
      totalConversations,
      totalMessages,
      uniqueAdvisors,
      createdAt: project.createdAt,
      lastActivity: Math.max(...relations.map(r => r.addedAt)),
    };
  },
});