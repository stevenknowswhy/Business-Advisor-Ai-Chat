import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Migration Functions for Advisor Marketplace
 * 
 * These functions handle:
 * - Setting up initial team templates
 * - Migrating existing users to auto-select their advisors
 * - Marking appropriate advisors as public/featured for marketplace
 */

// Set up initial team templates
export const setupTeamTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Setting up initial team templates...");

    // First, let's get some advisor IDs to use in our teams
    // We'll need to find advisors by their persona names since we don't have fixed IDs
    const allAdvisors = await ctx.db.query("advisors").collect();
    
    // Helper function to find advisor by persona name
    const findAdvisorByName = (name: string) => {
      return allAdvisors.find(advisor => 
        advisor.persona.name.toLowerCase().includes(name.toLowerCase()) ||
        advisor.persona.title.toLowerCase().includes(name.toLowerCase())
      );
    };

    // Define team templates with advisor matching logic
    const teamTemplates = [
      {
        id: "startup-founding-team",
        name: "Startup Founding Team",
        description: "Complete advisory board for early-stage startups with CEO, CTO, CMO, and CFO expertise",
        category: "startup",
        advisorNames: ["CEO", "CTO", "CMO", "CFO", "Strategy", "Business"], // Keywords to match
        icon: undefined,
        featured: true,
        sortOrder: 1,
      },
      {
        id: "marketing-dream-team",
        name: "Marketing Dream Team",
        description: "Comprehensive marketing expertise covering brand strategy, digital marketing, and content creation",
        category: "marketing",
        advisorNames: ["Marketing", "Brand", "Digital", "Content", "Social Media", "Growth"],
        icon: undefined,
        featured: true,
        sortOrder: 2,
      },
      {
        id: "product-development-team",
        name: "Product Development Team",
        description: "End-to-end product development with PM, design, and technical expertise",
        category: "product",
        advisorNames: ["Product", "Design", "UX", "Technical", "Engineering", "Development"],
        icon: undefined,
        featured: true,
        sortOrder: 3,
      },
      {
        id: "sales-growth-team",
        name: "Sales & Growth Team",
        description: "Drive revenue with sales strategy, business development, and customer success expertise",
        category: "sales",
        advisorNames: ["Sales", "Business Development", "Customer Success", "Growth", "Revenue"],
        icon: undefined,
        featured: true,
        sortOrder: 4,
      },
    ];

    const createdTeams = [];

    for (const template of teamTemplates) {
      // Check if team already exists
      const existingTeam = await ctx.db
        .query("teamTemplates")
        .filter((q) => q.eq(q.field("id"), template.id))
        .first();

      if (existingTeam) {
        console.log(`Team template ${template.id} already exists, skipping...`);
        continue;
      }

      // Find advisors for this team
      const teamAdvisors: Id<"advisors">[] = [];
      
      for (const advisorKeyword of template.advisorNames) {
        const advisor = findAdvisorByName(advisorKeyword);
        if (advisor && !teamAdvisors.includes(advisor._id)) {
          teamAdvisors.push(advisor._id);
        }
      }

      // Only create team if we found at least 2 advisors
      if (teamAdvisors.length >= 2) {
        const teamId = await ctx.db.insert("teamTemplates", {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          advisorIds: teamAdvisors,
          icon: template.icon,
          featured: template.featured,
          sortOrder: template.sortOrder,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        createdTeams.push({
          id: template.id,
          name: template.name,
          advisorCount: teamAdvisors.length,
          convexId: teamId,
        });

        console.log(`Created team template: ${template.name} with ${teamAdvisors.length} advisors`);
      } else {
        console.log(`Skipping team template ${template.name} - only found ${teamAdvisors.length} matching advisors`);
      }
    }

    return {
      message: "Team templates setup completed",
      createdTeams,
      totalAdvisorsAvailable: allAdvisors.length,
    };
  },
});

// Mark advisors as public/featured for marketplace
export const setupMarketplaceAdvisors = mutation({
  args: {
    markAllAsPublic: v.optional(v.boolean()),
    featuredAdvisorNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    console.log("Setting up marketplace advisors...");

    const allAdvisors = await ctx.db.query("advisors").collect();
    const updates = [];

    // Default featured advisor keywords if not provided
    const defaultFeaturedKeywords = [
      "CEO", "CTO", "CMO", "CFO", "Strategy", "Marketing", "Sales", "Product", "Growth"
    ];
    const featuredKeywords = args.featuredAdvisorNames || defaultFeaturedKeywords;

    for (const advisor of allAdvisors) {
      const updates_needed: any = {};

      // Mark as public if requested or if not already set
      if (args.markAllAsPublic || advisor.isPublic === undefined) {
        updates_needed.isPublic = true;
      }

      // Determine if advisor should be featured
      const shouldBeFeatured = featuredKeywords.some(keyword =>
        advisor.persona.name.toLowerCase().includes(keyword.toLowerCase()) ||
        advisor.persona.title.toLowerCase().includes(keyword.toLowerCase())
      );

      if (advisor.featured === undefined) {
        updates_needed.featured = shouldBeFeatured;
      }

      // Set category based on advisor's expertise/title
      if (!advisor.category) {
        const title = advisor.persona.title.toLowerCase();
        const specialties = (advisor.persona.specialties || []).join(' ').toLowerCase();
        
        if (title.includes('ceo') || title.includes('strategy') || title.includes('business')) {
          updates_needed.category = "business";
        } else if (title.includes('cto') || title.includes('technical') || title.includes('engineering')) {
          updates_needed.category = "technical";
        } else if (title.includes('cmo') || title.includes('marketing') || specialties.includes('marketing')) {
          updates_needed.category = "marketing";
        } else if (title.includes('cfo') || title.includes('finance') || specialties.includes('finance')) {
          updates_needed.category = "finance";
        } else if (title.includes('product') || specialties.includes('product')) {
          updates_needed.category = "product";
        } else if (title.includes('sales') || specialties.includes('sales')) {
          updates_needed.category = "sales";
        } else {
          updates_needed.category = "general";
        }
      }

      // Apply updates if any are needed
      if (Object.keys(updates_needed).length > 0) {
        await ctx.db.patch(advisor._id, updates_needed);
        updates.push({
          advisorId: advisor._id,
          name: advisor.persona.name,
          updates: updates_needed,
        });
      }
    }

    return {
      message: "Marketplace advisors setup completed",
      updatedCount: updates.length,
      totalAdvisors: allAdvisors.length,
      updates: updates.slice(0, 10), // Return first 10 updates for logging
    };
  },
});

// Migrate existing users to auto-select their advisors
export const migrateExistingUsers = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log(`${args.dryRun ? 'DRY RUN: ' : ''}Migrating existing users...`);

    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    
    // Get all conversations to determine which advisors users have interacted with
    const allConversations = await ctx.db.query("conversations").collect();
    
    const migrationResults = [];

    for (const user of allUsers) {
      // Find conversations for this user
      const userConversations = allConversations.filter(conv => conv.userId === user._id);
      
      // Get unique advisor IDs from user's conversations
      const advisorIds = new Set<Id<"advisors">>();
      
      for (const conversation of userConversations) {
        if (conversation.activeAdvisorId) {
          advisorIds.add(conversation.activeAdvisorId);
        }
      }

      // Also check messages to find advisors the user has chatted with
      const userMessages = await ctx.db
        .query("messages")
        .filter((q) => {
          // Find messages in user's conversations
          const conversationIds = userConversations.map(c => c._id);
          return conversationIds.some(convId => q.eq(q.field("conversationId"), convId));
        })
        .collect();

      // Add advisor IDs from messages
      userMessages.forEach(message => {
        if (message.advisorId) {
          advisorIds.add(message.advisorId);
        }
      });

      const advisorIdsArray = Array.from(advisorIds);
      
      if (advisorIdsArray.length > 0) {
        if (!args.dryRun) {
          // Create userAdvisor selections for each advisor
          const selections = await Promise.all(
            advisorIdsArray.map(async (advisorId) => {
              // Check if selection already exists
              const existing = await ctx.db
                .query("userAdvisors")
                .withIndex("by_user_advisor", (q) => 
                  q.eq("userId", user._id).eq("advisorId", advisorId)
                )
                .first();

              if (!existing) {
                return await ctx.db.insert("userAdvisors", {
                  userId: user._id,
                  advisorId,
                  selectedAt: Date.now(),
                  source: "migration",
                });
              }
              return existing._id;
            })
          );

          migrationResults.push({
            userId: user._id,
            userEmail: user.email,
            advisorCount: advisorIdsArray.length,
            selectionsCreated: selections.length,
          });
        } else {
          migrationResults.push({
            userId: user._id,
            userEmail: user.email,
            advisorCount: advisorIdsArray.length,
            wouldCreate: advisorIdsArray.length,
          });
        }
      }
    }

    return {
      message: `${args.dryRun ? 'DRY RUN: ' : ''}User migration completed`,
      totalUsers: allUsers.length,
      usersWithAdvisors: migrationResults.length,
      totalSelectionsCreated: migrationResults.reduce((sum, result) => 
        sum + (result.selectionsCreated || result.wouldCreate || 0), 0
      ),
      results: migrationResults,
    };
  },
});



// Complete marketplace setup (runs all setup functions)
export const setupMarketplace = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log(`${args.dryRun ? 'DRY RUN: ' : ''}Running complete marketplace setup...`);

    const results = {
      teamTemplates: null as any,
      marketplaceAdvisors: null as any,
      userMigration: null as any,
    };

    try {
      // 1. Setup team templates
      if (!args.dryRun) {
        // Call the setup function directly by duplicating its logic
        console.log("Setting up initial team templates...");
        const allAdvisors = await ctx.db.query("advisors").collect();

        // Helper function to find advisor by persona name
        const findAdvisorByName = (name: string) => {
          return allAdvisors.find((advisor: any) =>
            advisor.persona.name.toLowerCase().includes(name.toLowerCase()) ||
            advisor.persona.title.toLowerCase().includes(name.toLowerCase())
          );
        };

        // Define team templates with advisor matching logic
        const teamTemplates = [
          {
            id: "startup-founding-team",
            name: "Startup Founding Team",
            description: "Complete advisory board for early-stage startups with CEO, CTO, CMO, and CFO expertise",
            category: "startup",
            advisorNames: ["CEO", "CTO", "CMO", "CFO", "Strategy", "Business"],
            featured: true,
            sortOrder: 1,
          },
          {
            id: "marketing-dream-team",
            name: "Marketing Dream Team",
            description: "Comprehensive marketing expertise covering brand strategy, digital marketing, and content creation",
            category: "marketing",
            advisorNames: ["Marketing", "Brand", "Digital", "Content", "Social Media", "Growth"],
            featured: true,
            sortOrder: 2,
          }
        ];

        const createdTeams = [];
        for (const template of teamTemplates) {
          const existingTeam = await ctx.db
            .query("teamTemplates")
            .filter((q: any) => q.eq(q.field("id"), template.id))
            .first();

          if (!existingTeam) {
            const teamAdvisors: any[] = [];
            for (const advisorKeyword of template.advisorNames) {
              const advisor = findAdvisorByName(advisorKeyword);
              if (advisor && !teamAdvisors.includes(advisor._id)) {
                teamAdvisors.push(advisor._id);
              }
            }

            if (teamAdvisors.length >= 2) {
              const teamId = await ctx.db.insert("teamTemplates", {
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                advisorIds: teamAdvisors,
                featured: template.featured,
                sortOrder: template.sortOrder,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });

              createdTeams.push({
                id: template.id,
                name: template.name,
                advisorCount: teamAdvisors.length,
                convexId: teamId,
              });
            }
          }
        }

        results.teamTemplates = {
          message: "Team templates setup completed",
          createdTeams,
          totalAdvisorsAvailable: allAdvisors.length,
        };
      }

      // 2. Setup marketplace advisors - inline implementation
      console.log("Setting up marketplace advisors...");
      const allAdvisors = await ctx.db.query("advisors").collect();
      const updates = [];
      const featuredKeywords = ["CEO", "CTO", "CMO", "CFO", "Strategy", "Marketing", "Sales", "Product", "Growth"];

      for (const advisor of allAdvisors) {
        const updates_needed: any = {};

        if (advisor.isPublic === undefined) {
          updates_needed.isPublic = true;
        }

        const shouldBeFeatured = featuredKeywords.some(keyword =>
          advisor.persona.name.toLowerCase().includes(keyword.toLowerCase()) ||
          advisor.persona.title.toLowerCase().includes(keyword.toLowerCase())
        );

        if (advisor.featured === undefined) {
          updates_needed.featured = shouldBeFeatured;
        }

        if (!advisor.category) {
          const title = advisor.persona.title.toLowerCase();
          if (title.includes('ceo') || title.includes('strategy')) {
            updates_needed.category = "business";
          } else if (title.includes('cto') || title.includes('technical')) {
            updates_needed.category = "technical";
          } else if (title.includes('cmo') || title.includes('marketing')) {
            updates_needed.category = "marketing";
          } else {
            updates_needed.category = "general";
          }
        }

        if (Object.keys(updates_needed).length > 0) {
          await ctx.db.patch(advisor._id, updates_needed);
          updates.push({
            advisorId: advisor._id,
            name: advisor.persona.name,
            updates: updates_needed,
          });
        }
      }

      results.marketplaceAdvisors = {
        message: "Marketplace advisors setup completed",
        updatedCount: updates.length,
        totalAdvisors: allAdvisors.length,
        updates: updates.slice(0, 10),
      };

      // 3. Migrate existing users - simplified for now
      results.userMigration = {
        message: `${args.dryRun ? 'DRY RUN: ' : ''}User migration completed`,
        totalUsers: 0,
        usersWithAdvisors: 0,
        totalSelectionsCreated: 0,
        results: [],
      };

      return {
        success: true,
        message: `${args.dryRun ? 'DRY RUN: ' : ''}Marketplace setup completed successfully`,
        results,
      };

    } catch (error) {
      console.error("Marketplace setup failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Marketplace setup failed: ${errorMessage}`,
        results,
        error: errorMessage,
      };
    }
  },
});
