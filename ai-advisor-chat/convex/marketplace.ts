import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./auth";

/**
 * Advisor Marketplace Functions
 * 
 * Core functions for managing advisor selections and marketplace operations:
 * - getUserSelectedAdvisors: Get user's selected advisors for chat interface
 * - selectAdvisor: Add advisor to user's selection
 * - unselectAdvisor: Remove advisor from user's selection
 * - getMarketplaceAdvisors: Get public advisors for marketplace browsing
 * - selectTeam: Bulk select advisors from a team template
 * - getTeamTemplates: Get available team templates
 */

// Get user's selected advisors (for chat interface)
export const getUserSelectedAdvisors = query({
  args: {},
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await getCurrentUser(ctx);
    if (!user) {
      return []; // Return empty array for unauthenticated users
    }

    // Get user's advisor selections
    const userAdvisorSelections = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get the actual advisor documents
    const advisors = await Promise.all(
      userAdvisorSelections.map(async (selection) => {
        const advisor = await ctx.db.get(selection.advisorId);
        return advisor ? {
          ...advisor,
          selectedAt: selection.selectedAt,
          selectionSource: selection.source,
          teamId: selection.teamId,
        } : null;
      })
    );

    // Filter out any null advisors (in case advisor was deleted)
    return advisors.filter(advisor => advisor !== null);
  },
});

// Add advisor to user's selection
export const selectAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
    source: v.optional(v.union(
      v.literal("marketplace"),
      v.literal("team"),
      v.literal("migration"),
      v.literal("custom")
    )),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Please sign in to select advisors");
    }

    // Check if advisor is already selected by this user
    const existingSelection = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user_advisor", (q) =>
        q.eq("userId", user._id).eq("advisorId", args.advisorId)
      )
      .first();

    if (existingSelection) {
      // Already selected, return existing selection ID
      return existingSelection._id;
    }

    // Verify the advisor exists
    const advisor = await ctx.db.get(args.advisorId);
    if (!advisor) {
      throw new Error("Advisor not found");
    }

    // Create the selection
    const selectionId = await ctx.db.insert("userAdvisors", {
      userId: user._id,
      advisorId: args.advisorId,
      selectedAt: Date.now(),
      source: args.source || "marketplace",
      teamId: args.teamId,
    });

    return selectionId;
  },
});

// Remove advisor from user's selection
export const unselectAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Please sign in to manage your advisors");
    }

    // Find the selection to remove
    const selection = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user_advisor", (q) =>
        q.eq("userId", user._id).eq("advisorId", args.advisorId)
      )
      .first();

    if (!selection) {
      throw new Error("Advisor selection not found");
    }

    // Remove the selection
    await ctx.db.delete(selection._id);
    
    return { success: true, removedSelectionId: selection._id };
  },
});

// Get public advisors for marketplace browsing
export const getMarketplaceAdvisors = query({
  args: {
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    teamId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Start with all advisors and filter programmatically for now
    // In production, you'd optimize with proper indexes
    const allAdvisors = await ctx.db.query("advisors").collect();

    // Filter by public advisors only
    let filteredAdvisors = allAdvisors.filter(advisor => advisor.isPublic === true);

    // Apply additional filters
    if (args.featured !== undefined) {
      filteredAdvisors = filteredAdvisors.filter(advisor => advisor.featured === args.featured);
    }

    if (args.category) {
      filteredAdvisors = filteredAdvisors.filter(advisor => advisor.category === args.category);
    }

    // Filter by teamId (check teamAffiliations in metadata)
    if (args.teamId) {
      filteredAdvisors = filteredAdvisors.filter(advisor => {
        const teamAffiliations = advisor.metadata?.teamAffiliations || [];
        return teamAffiliations.some((affiliation: any) => affiliation.teamId === args.teamId);
      });
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      filteredAdvisors = filteredAdvisors.filter(advisor => {
        const advisorTags = advisor.tags || [];
        return args.tags!.some(tag => advisorTags.includes(tag));
      });
    }

    // Search query filtering (basic text search on name, title, and bio)
    if (args.searchQuery) {
      const searchLower = args.searchQuery.toLowerCase();
      filteredAdvisors = filteredAdvisors.filter(advisor => {
        const name = `${advisor.firstName} ${advisor.lastName}`.toLowerCase();
        const title = advisor.persona?.title?.toLowerCase() || '';
        const description = advisor.persona?.description?.toLowerCase() || '';
        const specialties = (advisor.persona?.specialties || []).join(' ').toLowerCase();

        return (
          name.includes(searchLower) ||
          title.includes(searchLower) ||
          description.includes(searchLower) ||
          specialties.includes(searchLower)
        );
      });
    }

    // Apply limit if specified
    const limitedAdvisors = args.limit
      ? filteredAdvisors.slice(0, args.limit)
      : filteredAdvisors;

    // Filter by status active and return only necessary fields for marketplace
    return limitedAdvisors
      .filter(advisor => advisor.status === "active")
      .map(advisor => ({
        _id: advisor._id,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        imageUrl: advisor.imageUrl,
        category: advisor.category,
        featured: advisor.featured,
        persona: {
          name: advisor.persona.name,
          title: advisor.persona.title,
          description: advisor.persona.description,
          oneLiner: advisor.persona.oneLiner,
          specialties: advisor.persona.specialties,
          expertise: advisor.persona.expertise,
        },
        tags: advisor.tags,
        createdAt: advisor.createdAt,
      }));
  },
});

// Get available team templates
export const getTeamTemplates = query({
  args: {
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get all team templates and filter programmatically
    const allTemplates = await ctx.db.query("teamTemplates").collect();

    // Apply filters
    let filteredTemplates = allTemplates;

    if (args.category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === args.category);
    }

    if (args.featured !== undefined) {
      filteredTemplates = filteredTemplates.filter(template => template.featured === args.featured);
    }

    // Sort by sortOrder, then by name
    return filteredTemplates.sort((a, b) => {
      const orderA = a.sortOrder || 999;
      const orderB = b.sortOrder || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  },
});

// Bulk select advisors from a team template
export const selectTeam = mutation({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Please sign in to select advisor teams");
    }
    // Get the team template
    const team = await ctx.db
      .query("teamTemplates")
      .filter((q) => q.eq(q.field("id"), args.teamId))
      .first();

    if (!team) {
      throw new Error("Team template not found");
    }

    // Select each advisor in the team
    const selectionResults = await Promise.all(
      team.advisorIds.map(async (advisorId) => {
        try {
          // Check if advisor is already selected by this user
          const existingSelection = await ctx.db
            .query("userAdvisors")
            .withIndex("by_user_advisor", (q) =>
              q.eq("userId", user._id).eq("advisorId", advisorId)
            )
            .first();

          if (existingSelection) {
            return { advisorId, selectionId: existingSelection._id, success: true, alreadySelected: true };
          }

          // Create the selection
          const selectionId = await ctx.db.insert("userAdvisors", {
            userId: user._id,
            advisorId,
            selectedAt: Date.now(),
            source: "team",
            teamId: args.teamId,
          });

          return { advisorId, selectionId, success: true, alreadySelected: false };
        } catch (error) {
          console.error(`Failed to select advisor ${advisorId}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { advisorId, error: errorMessage, success: false };
        }
      })
    );

    const successCount = selectionResults.filter(result => result.success).length;
    const failureCount = selectionResults.filter(result => !result.success).length;

    return {
      teamId: args.teamId,
      teamName: team.name,
      totalAdvisors: team.advisorIds.length,
      successCount,
      failureCount,
      results: selectionResults,
    };
  },
});

// Advanced search marketplace advisors with fuzzy matching and ranking
export const searchMarketplaceAdvisors = query({
  args: {
    searchQuery: v.string(),
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("relevance"),
      v.literal("rating"),
      v.literal("experience"),
      v.literal("newest"),
      v.literal("name")
    )),
    experienceLevel: v.optional(v.union(
      v.literal("entry"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("expert")
    )),
    availability: v.optional(v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("offline")
    )),
  },
  handler: async (ctx, args) => {
    // Get all marketplace advisors
    const allAdvisors = await ctx.db.query("advisors").collect();
    let filteredAdvisors = allAdvisors.filter(advisor => advisor.isPublic === true && advisor.status === "active");

    // Apply filters
    if (args.category) {
      filteredAdvisors = filteredAdvisors.filter(advisor => advisor.category === args.category);
    }

    if (args.featured !== undefined) {
      filteredAdvisors = filteredAdvisors.filter(advisor => advisor.featured === args.featured);
    }

    if (args.experienceLevel) {
      // Map experience level to years of experience
      const experienceMap = {
        entry: { min: 0, max: 2 },
        mid: { min: 3, max: 5 },
        senior: { min: 6, max: 10 },
        expert: { min: 11, max: 100 }
      };
      const range = experienceMap[args.experienceLevel];
      filteredAdvisors = filteredAdvisors.filter(advisor => {
        // Extract experience from persona.experience string (e.g., "5+ years" -> 5)
        const experienceStr = advisor.persona.experience || "0";
        const experienceMatch = experienceStr.match(/(\d+)/);
        const experience = experienceMatch ? parseInt(experienceMatch[1]!) : 0;
        return experience >= range.min && experience <= range.max;
      });
    }

    // Transform advisors for search and ranking
    const searchAdvisors = filteredAdvisors.map(advisor => {
      // Extract experience from persona.experience string
      const experienceStr = advisor.persona.experience || "0";
      const experienceMatch = experienceStr.match(/(\d+)/);
      const experience = experienceMatch ? parseInt(experienceMatch[1]!) : 0;

      return {
        _id: advisor._id,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        imageUrl: advisor.imageUrl,
        category: advisor.category,
        featured: advisor.featured,
        experience,
      persona: {
        name: advisor.persona.name,
        title: advisor.persona.title,
        description: advisor.persona.description,
        oneLiner: advisor.persona.oneLiner,
        specialties: advisor.persona.specialties || [],
        expertise: advisor.persona.expertise || [],
      },
      tags: advisor.tags || [],
      createdAt: advisor.createdAt,
    };
  });

  // Search and rank results
    const searchTerm = args.searchQuery.toLowerCase();
    const results = searchAdvisors
      .map(advisor => {
        const score = calculateRelevanceScore(advisor, searchTerm);
        return { ...advisor, relevanceScore: score };
      })
      .filter(advisor => advisor.relevanceScore > 0);

    // Sort results
    const sortedResults = sortAdvisors(results, args.sortBy || "relevance");

    // Apply limit after sorting
    return args.limit
      ? sortedResults.slice(0, args.limit)
      : sortedResults;
  },
});

// Helper function to calculate relevance score
function calculateRelevanceScore(advisor: any, searchTerm: string): number {
  if (!searchTerm) return 1;

  const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
  let score = 0;

  // Exact name match (highest weight)
  if (advisor.persona.name.toLowerCase().includes(searchTerm)) {
    score += 100;
  }

  // Title match (high weight)
  if (advisor.persona.title.toLowerCase().includes(searchTerm)) {
    score += 80;
  }

  // Search through all text fields
  const searchableText = [
    advisor.persona.name,
    advisor.persona.title,
    advisor.persona.description,
    advisor.persona.oneLiner,
    ...(advisor.persona.specialties || []),
    ...(advisor.persona.expertise || []),
    ...(advisor.tags || []),
    advisor.category
  ].join(' ').toLowerCase();

  // Calculate term frequency score
  searchTerms.forEach(term => {
    const termCount = (searchableText.match(new RegExp(term, 'g')) || []).length;
    score += termCount * 10;

    // Bonus for exact specialty matches
    if (advisor.persona.specialties?.some((specialty: string) =>
      specialty.toLowerCase().includes(term))) {
      score += 30;
    }

    // Bonus for exact expertise matches
    if (advisor.persona.expertise?.some((expertise: string) =>
      expertise.toLowerCase().includes(term))) {
      score += 25;
    }
  });

  // Boost featured advisors
  if (advisor.featured) {
    score += 20;
  }

  // Boost based on featured status (already handled above)
  // Note: rating and reviewCount will be added when reviews feature is implemented

  return score;
}

// Helper function to sort advisors
function sortAdvisors(advisors: any[], sortBy: string): any[] {
  const sorted = [...advisors];

  switch (sortBy) {
    case 'relevance':
      return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
    case 'rating':
      // Rating sorting will be implemented when reviews feature is added
      return sorted.sort((a, b) => b.featured - a.featured || b.createdAt - a.createdAt);
    case 'experience':
      return sorted.sort((a, b) => b.experience - a.experience);
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'name':
      return sorted.sort((a, b) => a.persona.name.localeCompare(b.persona.name));
    default:
      return sorted;
  }
}

// Get marketplace statistics and counts
export const getMarketplaceStats = query({
  args: {},
  handler: async (ctx, args) => {
    const allAdvisors = await ctx.db.query("advisors").collect();
    const publicAdvisors = allAdvisors.filter(advisor => advisor.isPublic === true && advisor.status === "active");

    // Count by category
    const categoryCounts: Record<string, number> = {};
    publicAdvisors.forEach(advisor => {
      const category = advisor.category || "general";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Rating calculation will be implemented when reviews feature is added
    const averageRating = 0;
    const ratedAdvisors = []; // Will be populated when reviews feature is implemented

    // Experience distribution
    const experienceDistribution = {
      entry: publicAdvisors.filter(a => {
        const expStr = a.persona.experience || "0";
        const expMatch = expStr.match(/(\d+)/);
        const exp = expMatch ? parseInt(expMatch[1]!) : 0;
        return exp <= 2;
      }).length,
      mid: publicAdvisors.filter(a => {
        const expStr = a.persona.experience || "0";
        const expMatch = expStr.match(/(\d+)/);
        const exp = expMatch ? parseInt(expMatch[1]!) : 0;
        return exp >= 3 && exp <= 5;
      }).length,
      senior: publicAdvisors.filter(a => {
        const expStr = a.persona.experience || "0";
        const expMatch = expStr.match(/(\d+)/);
        const exp = expMatch ? parseInt(expMatch[1]!) : 0;
        return exp >= 6 && exp <= 10;
      }).length,
      expert: publicAdvisors.filter(a => {
        const expStr = a.persona.experience || "0";
        const expMatch = expStr.match(/(\d+)/);
        const exp = expMatch ? parseInt(expMatch[1]!) : 0;
        return exp >= 11;
      }).length,
    };

    return {
      totalAdvisors: publicAdvisors.length,
      featuredAdvisors: publicAdvisors.filter(a => a.featured).length,
      categoryCounts,
      averageRating: Math.round(averageRating * 10) / 10,
      ratedAdvisors: ratedAdvisors.length,
      experienceDistribution,
      topCategories: Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
    };
  },
});

// Get advisor suggestions based on user preferences and behavior
export const getAdvisorSuggestions = query({
  args: {
    limit: v.optional(v.number()),
    excludeSelected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = args.limit || 6;

    // Get all public advisors
    const allAdvisors = await ctx.db.query("advisors").collect();
    let availableAdvisors = allAdvisors.filter(advisor =>
      advisor.isPublic === true &&
      advisor.status === "active"
    );

    // Exclude user's selected advisors if requested
    if (args.excludeSelected && user) {
      const userSelections = await ctx.db
        .query("userAdvisors")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const selectedAdvisorIds = new Set(userSelections.map(s => s.advisorId.toString()));
      availableAdvisors = availableAdvisors.filter(advisor =>
        !selectedAdvisorIds.has(advisor._id.toString())
      );
    }

    // Get user's selection history for personalization
    let userPreferences = { categories: new Set<string>(), experienceLevel: 0 };
    if (user) {
      const userSelections = await ctx.db
        .query("userAdvisors")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const selectedAdvisors = await Promise.all(
        userSelections.map(selection => ctx.db.get(selection.advisorId))
      );

      const validAdvisors = selectedAdvisors.filter(Boolean) as any[];

      // Analyze user preferences
      validAdvisors.forEach(advisor => {
        if (advisor.category) {
          userPreferences.categories.add(advisor.category);
        }
        userPreferences.experienceLevel = Math.max(
          userPreferences.experienceLevel,
          advisor.experience || 0
        );
      });
    }

    // Score and rank advisors
    const scoredAdvisors = availableAdvisors.map(advisor => {
      let score = 0;

      // Boost featured advisors
      if (advisor.featured) score += 50;
      // Note: rating and reviewCount will be added when reviews feature is implemented

      // Boost based on user preferences
      if (advisor.category && userPreferences.categories.has(advisor.category)) {
        score += 30;
      }

      // Boost advisors with similar experience level
      const experienceStr = advisor.persona.experience || "0";
      const experienceMatch = experienceStr.match(/(\d+)/);
      const advisorExperience = experienceMatch ? parseInt(experienceMatch[1]!) : 0;
      const experienceDiff = Math.abs(advisorExperience - userPreferences.experienceLevel);
      score += Math.max(0, 20 - experienceDiff);

      // Boost recently created advisors
      const ageInDays = (Date.now() - advisor.createdAt) / (1000 * 60 * 60 * 24);
      if (ageInDays <= 30) score += 15;

      return {
        ...advisor,
        suggestionScore: score,
      };
    });

    // Sort by suggestion score and return top results
    const suggestedAdvisors = scoredAdvisors
      .sort((a, b) => b.suggestionScore - a.suggestionScore)
      .slice(0, limit);

    return suggestedAdvisors.map(advisor => {
      const experienceStr = advisor.persona?.experience || "0";
      const experienceMatch = experienceStr.match(/(\d+)/);

      return {
        _id: advisor._id,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        imageUrl: advisor.imageUrl,
        category: advisor.category,
        featured: advisor.featured,
        rating: 0, // Will be implemented when reviews feature is added
        reviewCount: 0, // Will be implemented when reviews feature is added
        experience: experienceMatch ? parseInt(experienceMatch[1]!) : 0,
        persona: {
        name: advisor.persona.name,
        title: advisor.persona.title,
        description: advisor.persona.description,
        oneLiner: advisor.persona.oneLiner,
        specialties: advisor.persona.specialties || [],
        expertise: advisor.persona.expertise || [],
      },
      tags: advisor.tags || [],
      createdAt: advisor.createdAt,
      };
    });
  },
});

// Get popular advisors based on selection count and ratings
export const getPopularAdvisors = query({
  args: {
    limit: v.optional(v.number()),
    timeFrame: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const timeFrame = args.timeFrame || "month";

    // Calculate time cutoff
    const now = Date.now();
    const timeCutoff = timeFrame === "week"
      ? now - (7 * 24 * 60 * 60 * 1000)
      : timeFrame === "month"
      ? now - (30 * 24 * 60 * 60 * 1000)
      : 0;

    // Get all public advisors
    const allAdvisors = await ctx.db.query("advisors").collect();
    const publicAdvisors = allAdvisors.filter(advisor =>
      advisor.isPublic === true &&
      advisor.status === "active"
    );

    // Get selection counts for advisors
    const advisorPopularity = await Promise.all(
      publicAdvisors.map(async (advisor) => {
        const selections = await ctx.db
          .query("userAdvisors")
          .withIndex("by_advisor", (q) => q.eq("advisorId", advisor._id))
          .collect();

        const recentSelections = timeFrame === "all"
          ? selections
          : selections.filter(s => s.selectedAt >= timeCutoff);

        return {
          advisor,
          totalSelections: selections.length,
          recentSelections: recentSelections.length,
          // Rating and reviewCount will be added when reviews feature is implemented
        };
      })
    );

    // Score and sort advisors by popularity
    const popularityScore = (data: any) => {
      const selectionWeight = timeFrame === "all" ? 1 : 2; // Weight recent selections more
      const selectionScore = data.recentSelections * selectionWeight + data.totalSelections * 0.5;
      // Rating and review scores will be added when reviews feature is implemented

      return selectionScore;
    };

    const popularAdvisors = advisorPopularity
      .sort((a, b) => popularityScore(b) - popularityScore(a))
      .slice(0, limit)
      .map(data => data.advisor);

    return popularAdvisors.map(advisor => {
      const experienceStr = advisor.persona?.experience || "0";
      const experienceMatch = experienceStr.match(/(\d+)/);

      return {
        _id: advisor._id,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        imageUrl: advisor.imageUrl,
        category: advisor.category,
        featured: advisor.featured,
        rating: 0, // Will be implemented when reviews feature is added
        reviewCount: 0, // Will be implemented when reviews feature is added
        experience: experienceMatch ? parseInt(experienceMatch[1]!) : 0,
        persona: {
        name: advisor.persona.name,
        title: advisor.persona.title,
        description: advisor.persona.description,
        oneLiner: advisor.persona.oneLiner,
        specialties: advisor.persona.specialties || [],
        expertise: advisor.persona.expertise || [],
      },
      tags: advisor.tags || [],
      createdAt: advisor.createdAt,
      };
    });
  },
});
// Additional marketplace functions for reviews and profiles

// Create or update an advisor review
export const createAdvisorReview = mutation({
  args: {
    advisorId: v.id("advisors"),
    rating: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User must be authenticated to create a review");
    }

    // Get user from Clerk identity
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has actually used this advisor
    const hasUsedAdvisor = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user_advisor", q =>
        q.eq("userId", user._id).eq("advisorId", args.advisorId)
      )
      .first();

    const verified = !!hasUsedAdvisor;

    // Check if user already reviewed this advisor
    const existingReview = await ctx.db
      .query("advisorReviews")
      .withIndex("by_advisor_user", q =>
        q.eq("advisorId", args.advisorId).eq("userId", user._id)
      )
      .first();

    if (existingReview) {
      // Update existing review
      await ctx.db.patch(existingReview._id, {
        rating: args.rating,
        title: args.title,
        content: args.content,
        tags: args.tags,
        updatedAt: Date.now(),
      });
      return existingReview._id;
    } else {
      // Create new review
      const reviewId = await ctx.db.insert("advisorReviews", {
        advisorId: args.advisorId,
        userId: user._id,
        rating: args.rating,
        title: args.title,
        content: args.content,
        tags: args.tags,
        verified,
        status: "pending", // Reviews require approval
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return reviewId;
    }
  },
});

// Get reviews for an advisor
export const getAdvisorReviews = query({
  args: {
    advisorId: v.id("advisors"),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("rating"), v.literal("helpful"))),
  },
  handler: async (ctx, args) => {
    let reviewsQuery = ctx.db
      .query("advisorReviews")
      .withIndex("by_advisor", q => q.eq("advisorId", args.advisorId));

    // Filter by status if provided
    if (args.status) {
      reviewsQuery = reviewsQuery.filter(q => q.eq(q.field("status"), args.status));
    }

    let reviews = await reviewsQuery.collect();

    // Join with user data
    const reviewsWithUser = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          user: user ? {
            _id: user._id,
            name: user.name,
            image: user.image,
          } : null,
        };
      })
    );

    // Sort reviews
    switch (args.sortBy) {
      case "rating":
        reviewsWithUser.sort((a, b) => b.rating - a.rating);
        break;
      case "helpful":
        reviewsWithUser.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
      case "newest":
      default:
        reviewsWithUser.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // Apply limit
    return args.limit ? reviewsWithUser.slice(0, args.limit) : reviewsWithUser;
  },
});

// Get advisor rating summary
export const getAdvisorRatingSummary = query({
  args: {
    advisorId: v.id("advisors"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("advisorReviews")
      .withIndex("by_advisor", q => q.eq("advisorId", args.advisorId))
      .filter(q => q.eq(q.field("status"), "approved"))
      .collect();

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
        verifiedReviews: 0,
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const verifiedReviews = reviews.filter(review => review.verified).length;

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating as keyof typeof acc] = (acc[review.rating as keyof typeof acc] || 0) + 1;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
      verifiedReviews,
    };
  },
});

// Create portfolio item
export const createPortfolioItem = mutation({
  args: {
    advisorId: v.id("advisors"),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("case_study"), v.literal("project"), v.literal("achievement"), v.literal("publication"), v.literal("other")),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    links: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      type: v.union(v.literal("website"), v.literal("github"), v.literal("linkedin"), v.literal("other")),
    }))),
    tags: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User must be authenticated to create portfolio items");
    }

    // Get user from Clerk identity
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the user owns this advisor or is an admin
    const advisor = await ctx.db.get(args.advisorId);
    if (!advisor || (advisor.ownerId !== user._id && user.plan !== "admin")) {
      throw new Error("Unauthorized: User can only create portfolio items for their own advisors");
    }

    // Get the highest order number for this advisor
    const existingItems = await ctx.db
      .query("advisorPortfolios")
      .withIndex("by_advisor", q => q.eq("advisorId", args.advisorId))
      .collect();

    const maxOrder = Math.max(...existingItems.map(item => item.order || 0), 0);

    const portfolioId = await ctx.db.insert("advisorPortfolios", {
      advisorId: args.advisorId,
      title: args.title,
      description: args.description,
      type: args.type,
      content: args.content,
      images: args.images,
      links: args.links,
      tags: args.tags,
      featured: args.featured || false,
      order: maxOrder + 1,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return portfolioId;
  },
});

// Get portfolio items for an advisor
export const getAdvisorPortfolio = query({
  args: {
    advisorId: v.id("advisors"),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    featured: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("case_study"), v.literal("project"), v.literal("achievement"), v.literal("publication"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("advisorPortfolios")
      .withIndex("by_advisor", q => q.eq("advisorId", args.advisorId));

    // Apply filters
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }
    if (args.featured !== undefined) {
      query = query.filter(q => q.eq(q.field("featured"), args.featured));
    }
    if (args.type) {
      query = query.filter(q => q.eq(q.field("type"), args.type));
    }

    const items = await query.collect();

    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  },
});

// Update advisor availability
export const updateAdvisorAvailability = mutation({
  args: {
    advisorId: v.id("advisors"),
    status: v.union(v.literal("available"), v.literal("busy"), v.literal("offline"), v.literal("away")),
    statusMessage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    schedule: v.optional(v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      available: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User must be authenticated to update availability");
    }

    // Get user from Clerk identity
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the user owns this advisor or is an admin
    const advisor = await ctx.db.get(args.advisorId);
    if (!advisor || (advisor.ownerId !== user._id && user.plan !== "admin")) {
      throw new Error("Unauthorized: User can only update availability for their own advisors");
    }

    // Check if availability record exists
    const existingAvailability = await ctx.db
      .query("advisorAvailability")
      .withIndex("by_advisor", q => q.eq("advisorId", args.advisorId))
      .first();

    const updateData = {
      status: args.status,
      statusMessage: args.statusMessage,
      timezone: args.timezone,
      schedule: args.schedule,
      lastStatusUpdate: Date.now(),
      updatedAt: Date.now(),
    };

    if (existingAvailability) {
      await ctx.db.patch(existingAvailability._id, updateData);
      return existingAvailability._id;
    } else {
      const availabilityId = await ctx.db.insert("advisorAvailability", {
        advisorId: args.advisorId,
        status: args.status,
        statusMessage: args.statusMessage,
        timezone: args.timezone || "UTC",
        schedule: args.schedule,
        lastStatusUpdate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return availabilityId;
    }
  },
});

// Get advisor availability
export const getAdvisorAvailability = query({
  args: {
    advisorId: v.id("advisors"),
  },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("advisorAvailability")
      .withIndex("by_advisor", q => q.eq("advisorId", args.advisorId))
      .first();

    return availability || null;
  },
});

// ===== ADMIN FUNCTIONS =====

// Get all advisors with admin access (requires admin authentication)
export const adminGetAllAdvisors = query({
  args: {
    filters: v.optional(v.object({
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"))),
      category: v.optional(v.string()),
      featured: v.optional(v.boolean()),
      searchQuery: v.optional(v.string()),
    })),
    pagination: v.optional(v.object({
      limit: v.optional(v.number()),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await getCurrentUser(ctx);
    if (!user || user.plan !== "enterprise") {
      throw new Error("Admin access required");
    }

    let advisors = await ctx.db.query("advisors").collect();

    // Apply filters
    if (args.filters) {
      if (args.filters.status) {
        advisors = advisors.filter(advisor => {
          if (args.filters!.status === "active") return advisor.status === "active";
          if (args.filters!.status === "inactive") return advisor.status === "inactive";
          if (args.filters!.status === "archived") return advisor.status === "archived";
          return true;
        });
      }

      if (args.filters.category) {
        advisors = advisors.filter(advisor => advisor.category === args.filters!.category);
      }

      if (args.filters.featured !== undefined) {
        advisors = advisors.filter(advisor => advisor.featured === args.filters!.featured);
      }

      if (args.filters.searchQuery) {
        const query = args.filters.searchQuery.toLowerCase();
        advisors = advisors.filter(advisor => {
          const name = `${advisor.firstName || ''} ${advisor.lastName || ''}`.toLowerCase();
          const title = advisor.persona?.title?.toLowerCase() || '';
          const specialties = advisor.persona?.specialties?.join(' ').toLowerCase() || '';
          const tags = advisor.tags?.join(' ').toLowerCase() || '';

          return name.includes(query) ||
                 title.includes(query) ||
                 specialties.includes(query) ||
                 tags.includes(query);
        });
      }
    }

    // Apply pagination
    if (args.pagination?.limit) {
      const startIndex = args.pagination.cursor ?
        advisors.findIndex(a => a._id === args.pagination!.cursor) : 0;
      advisors = advisors.slice(startIndex, startIndex + args.pagination.limit);
    }

    return advisors;
  },
});

// Update advisor with admin access
export const adminUpdateAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
    updates: v.object({
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"))),
      featured: v.optional(v.boolean()),
      category: v.optional(v.string()),
      isPublic: v.optional(v.boolean()),
      persona: v.optional(v.object({
        name: v.optional(v.string()),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        oneLiner: v.optional(v.string()),
        archetype: v.optional(v.string()),
        bio: v.optional(v.string()),
        detailedBackground: v.optional(v.string()),
        experience: v.optional(v.string()),
        specialties: v.optional(v.array(v.string())),
        personalInterests: v.optional(v.array(v.string())),
        communicationStyle: v.optional(v.string()),
        expertise: v.optional(v.array(v.string())),
      })),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await getCurrentUser(ctx);
    if (!user || user.plan !== "enterprise") {
      throw new Error("Admin access required");
    }

    const advisor = await ctx.db.get(args.advisorId);
    if (!advisor) {
      throw new Error("Advisor not found");
    }

    // Prepare update object
    const updateData: any = { ...args.updates, updatedAt: Date.now() };

    // Handle persona updates
    if (args.updates.persona) {
      updateData.persona = { ...advisor.persona, ...args.updates.persona };
    }

    // Handle tags updates
    if (args.updates.tags !== undefined) {
      updateData.tags = args.updates.tags;
    }

    const updatedAdvisor = await ctx.db.patch(args.advisorId, updateData);

    return updatedAdvisor;
  },
});

// Delete advisor with admin access (cascade delete)
export const adminDeleteAdvisor = mutation({
  args: {
    advisorId: v.id("advisors"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await getCurrentUser(ctx);
    if (!user || user.plan !== "enterprise") {
      throw new Error("Admin access required");
    }

    const advisor = await ctx.db.get(args.advisorId);
    if (!advisor) {
      throw new Error("Advisor not found");
    }

    // Delete related data (cascade)
    // Delete user selections
    const userSelections = await ctx.db
      .query("userAdvisors")
      .withIndex("by_advisor", (q) => q.eq("advisorId", args.advisorId))
      .collect();

    await Promise.all(userSelections.map(selection => ctx.db.delete(selection._id)));

    // Delete reviews
    const reviews = await ctx.db
      .query("advisorReviews")
      .withIndex("by_advisor", (q) => q.eq("advisorId", args.advisorId))
      .collect();

    await Promise.all(reviews.map(review => ctx.db.delete(review._id)));

    // Delete portfolio items
    const portfolioItems = await ctx.db
      .query("advisorPortfolios")
      .withIndex("by_advisor", (q) => q.eq("advisorId", args.advisorId))
      .collect();

    await Promise.all(portfolioItems.map(item => ctx.db.delete(item._id)));

    // Delete availability
    const availability = await ctx.db
      .query("advisorAvailability")
      .withIndex("by_advisor", (q) => q.eq("advisorId", args.advisorId))
      .first();

    if (availability) {
      await ctx.db.delete(availability._id);
    }

    // Finally delete the advisor
    await ctx.db.delete(args.advisorId);

    return { success: true, deletedAdvisorId: args.advisorId };
  },
});

// Get reviews with admin access (for moderation)
export const adminGetReviews = query({
  args: {
    filters: v.optional(v.object({
      status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
      advisorId: v.optional(v.id("advisors")),
      rating: v.optional(v.number()),
      searchQuery: v.optional(v.string()),
    })),
    pagination: v.optional(v.object({
      limit: v.optional(v.number()),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await getCurrentUser(ctx);
    if (!user || user.plan !== "enterprise") {
      throw new Error("Admin access required");
    }

    let reviews = await ctx.db.query("advisorReviews").collect();

    // Apply filters
    if (args.filters) {
      if (args.filters.status) {
        reviews = reviews.filter(review => review.status === args.filters!.status);
      }

      if (args.filters.advisorId) {
        reviews = reviews.filter(review => review.advisorId === args.filters!.advisorId);
      }

      if (args.filters.rating !== undefined) {
        reviews = reviews.filter(review => review.rating === args.filters!.rating);
      }

      if (args.filters.searchQuery) {
        const query = args.filters.searchQuery.toLowerCase();
        reviews = reviews.filter(review => {
          const title = review.title?.toLowerCase() || '';
          const content = review.content.toLowerCase();
          const tags = review.tags?.join(' ').toLowerCase() || '';

          return title.includes(query) || content.includes(query) || tags.includes(query);
        });
      }
    }

    // Apply pagination
    if (args.pagination?.limit) {
      const startIndex = args.pagination.cursor ?
        reviews.findIndex(r => r._id === args.pagination!.cursor) : 0;
      reviews = reviews.slice(startIndex, startIndex + args.pagination.limit);
    }

    return reviews;
  },
});

// Moderate review with admin access
export const adminModerateReview = mutation({
  args: {
    reviewId: v.id("advisorReviews"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await getCurrentUser(ctx);
    if (!user || user.plan !== "enterprise") {
      throw new Error("Admin access required");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const updateData: any = {
      status: args.action === "approve" ? "approved" : "rejected",
      updatedAt: Date.now(),
    };

    // Add rejection reason if provided
    if (args.action === "reject" && args.reason) {
      updateData.response = {
        content: `Rejected by admin: ${args.reason}`,
        respondedAt: Date.now(),
      };
    }

    const updatedReview = await ctx.db.patch(args.reviewId, updateData);

    return updatedReview;
  },
});

// Get marketplace analytics with admin access
export const adminGetMarketplaceAnalytics = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    const user = await getCurrentUser(ctx);
    if (!user || user.plan !== "enterprise") {
      throw new Error("Admin access required");
    }

    // Get all advisors
    const advisors = await ctx.db.query("advisors").collect();

    // Get all reviews
    const reviews = await ctx.db.query("advisorReviews").collect();

    // Get all user selections
    const userSelections = await ctx.db.query("userAdvisors").collect();

    // Get all portfolio items
    const portfolioItems = await ctx.db.query("advisorPortfolios").collect();

    // Calculate analytics
    const analytics = {
      advisors: {
        total: advisors.length,
        active: advisors.filter(a => a.status === "active").length,
        featured: advisors.filter(a => a.featured).length,
        public: advisors.filter(a => a.isPublic).length,
        byCategory: advisors.reduce((acc, advisor) => {
          const category = advisor.category || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      reviews: {
        total: reviews.length,
        pending: reviews.filter(r => r.status === "pending").length,
        approved: reviews.filter(r => r.status === "approved").length,
        rejected: reviews.filter(r => r.status === "rejected").length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
        byRating: [1, 2, 3, 4, 5].reduce((acc, rating) => {
          acc[rating] = reviews.filter(r => r.rating === rating).length;
          return acc;
        }, {} as Record<number, number>),
      },
      users: {
        totalSelections: userSelections.length,
        uniqueUsers: new Set(userSelections.map(s => String(s.userId))).size,
        averageSelectionsPerUser: userSelections.length > 0
          ? userSelections.length / new Set(userSelections.map(s => String(s.userId))).size
          : 0,
      },
      portfolio: {
        totalItems: portfolioItems.length,
        published: portfolioItems.filter(p => p.status === "published").length,
        featured: portfolioItems.filter(p => p.featured).length,
        byType: portfolioItems.reduce((acc, item) => {
          const type = item.type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      recentActivity: {
        newAdvisorsThisMonth: advisors.filter(a =>
          a.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000
        ).length,
        newReviewsThisMonth: reviews.filter(r =>
          r.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000
        ).length,
        newSelectionsThisMonth: userSelections.filter(s =>
          s.selectedAt > Date.now() - 30 * 24 * 60 * 60 * 1000
        ).length,
      },
    };

    return analytics;
  },
});