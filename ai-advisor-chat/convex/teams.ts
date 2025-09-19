import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireUser } from "./auth";

/**
 * Team Management Functions
 *
 * These functions handle team creation and management operations.
 * Implements one-click team creation from predefined templates.
 */

// Predefined team templates with advisor configurations
const TEAM_TEMPLATES = {
  "startup-founding-team": {
    name: "Startup Founding Team",
    description: "Complete founding team with CEO, CTO, CMO, and CFO advisors",
    category: "startup",
    icon: "🚀",
    advisors: [
      {
        name: "Sarah Chen",
        title: "CEO & Growth Strategist",
        oneLiner: "Serial entrepreneur focused on scaling SaaS businesses",
        expertise: ["Business Strategy", "Fundraising", "Go-to-Market"],
        persona: {
          name: "Sarah Chen",
          title: "CEO & Growth Strategist",
          oneLiner: "Serial entrepreneur focused on scaling SaaS businesses",
          description: "Help startups build sustainable growth engines and scale effectively",
          expertise: ["Business Strategy", "Fundraising", "Go-to-Market", "Leadership"],
          personality: ["Visionary", "Results-oriented", "Mentor"],
        },
      },
      {
        name: "Marcus Rodriguez",
        title: "CTO & Technical Architect",
        oneLiner: "Full-stack engineer and system architecture expert",
        expertise: ["Technical Architecture", "Scalability", "Engineering Leadership"],
        persona: {
          name: "Marcus Rodriguez",
          title: "CTO & Technical Architect",
          mission: "Build robust, scalable technical foundations for growing businesses",
          scopeIn: "System architecture, technology stack, engineering processes, scalability",
          scopeOut: "Business strategy, marketing, financial planning",
          adviceStyle: "Technical and thorough with practical implementation details",
          expertise: ["Technical Architecture", "Scalability", "Engineering Leadership", "DevOps"],
          personality: ["Analytical", "Methodical", "Innovative"],
          kpis: ["System Performance", "Code Quality", "Team Productivity", "Technical Debt"],
        },
      },
      {
        name: "Emily Watson",
        title: "CMO & Growth Marketer",
        oneLiner: "Digital marketing specialist with focus on B2B SaaS",
        expertise: ["Marketing Strategy", "Growth Hacking", "Brand Building"],
        persona: {
          name: "Emily Watson",
          title: "CMO & Growth Marketer",
          mission: "Build powerful brands and drive sustainable customer acquisition",
          scopeIn: "Marketing strategy, brand development, customer acquisition, growth analytics",
          scopeOut: "Technical implementation, financial planning, HR management",
          adviceStyle: "Creative and data-driven with focus on measurable results",
          expertise: ["Marketing Strategy", "Growth Hacking", "Brand Building", "Content Marketing"],
          personality: ["Creative", "Data-driven", "Strategic"],
          kpis: ["Customer Acquisition Cost", "Conversion Rate", "Brand Awareness", "Marketing ROI"],
        },
      },
      {
        name: "David Park",
        title: "CFO & Financial Strategist",
        oneLiner: "Financial planning and fundraising specialist",
        expertise: ["Financial Planning", "Fundraising", "Cash Flow Management"],
        persona: {
          name: "David Park",
          title: "CFO & Financial Strategist",
          mission: "Ensure financial health and optimize resource allocation for sustainable growth",
          scopeIn: "Financial planning, fundraising, cash flow management, investor relations",
          scopeOut: "Marketing, technical implementation, product development",
          adviceStyle: "Conservative and strategic with emphasis on risk management",
          expertise: ["Financial Planning", "Fundraising", "Cash Flow Management", "Investor Relations"],
          personality: ["Analytical", "Risk-averse", "Strategic"],
          kpis: ["Burn Rate", "Runway", "Revenue Growth", "Profitability"],
        },
      },
    ],
  },
  "marketing-dream-team": {
    name: "Marketing Dream Team",
    description: "Complete marketing team covering strategy, content, and growth",
    category: "marketing",
    icon: "📈",
    advisors: [
      {
        name: "Lisa Thompson",
        title: "Head of Marketing Strategy",
        oneLiner: "Strategic marketing leader with focus on brand building",
        expertise: ["Marketing Strategy", "Brand Building", "Market Positioning"],
        persona: {
          name: "Lisa Thompson",
          title: "Head of Marketing Strategy",
          mission: "Build powerful brands that resonate with target audiences",
          scopeIn: "Brand strategy, market positioning, marketing planning, competitive analysis",
          scopeOut: "Technical implementation, financial planning, HR management",
          adviceStyle: "Strategic and brand-focused with emphasis on long-term value",
          expertise: ["Marketing Strategy", "Brand Building", "Market Positioning", "Competitive Analysis"],
          personality: ["Strategic", "Creative", "Brand-focused"],
          kpis: ["Brand Awareness", "Market Share", "Customer Loyalty", "Brand Equity"],
        },
      },
      {
        name: "Alex Kim",
        title: "Growth Marketing Specialist",
        oneLiner: "Data-driven growth marketer focused on acquisition",
        expertise: ["Growth Hacking", "Performance Marketing", "Analytics"],
        persona: {
          name: "Alex Kim",
          title: "Growth Marketing Specialist",
          mission: "Drive measurable customer acquisition and revenue growth",
          scopeIn: "Performance marketing, growth hacking, analytics, conversion optimization",
          scopeOut: "Brand strategy, creative development, public relations",
          adviceStyle: "Data-driven and experimental with focus on rapid iteration",
          expertise: ["Growth Hacking", "Performance Marketing", "Analytics", "Conversion Optimization"],
          personality: ["Analytical", "Experimental", "Results-driven"],
          kpis: ["Customer Acquisition Cost", "Conversion Rate", "Return on Ad Spend", "Revenue Growth"],
        },
      },
      {
        name: "Sofia Martinez",
        title: "Content Marketing Lead",
        oneLiner: "Content strategist and storyteller",
        expertise: ["Content Strategy", "SEO", "Social Media"],
        persona: {
          name: "Sofia Martinez",
          title: "Content Marketing Lead",
          mission: "Create compelling content that engages and converts audiences",
          scopeIn: "Content strategy, SEO, social media, email marketing, copywriting",
          scopeOut: "Technical implementation, financial planning, HR management",
          adviceStyle: "Creative and audience-focused with emphasis on storytelling",
          expertise: ["Content Strategy", "SEO", "Social Media", "Email Marketing", "Copywriting"],
          personality: ["Creative", "Audience-focused", "Storyteller"],
          kpis: ["Content Engagement", "SEO Rankings", "Social Media Reach", "Email Open Rates"],
        },
      },
    ],
  },
  "product-development-team": {
    name: "Product Development Team",
    description: "Complete product team with PM, designer, and engineering leads",
    category: "development",
    icon: "💻",
    advisors: [
      {
        name: "Rachel Green",
        title: "Head of Product",
        oneLiner: "Product strategy and user experience expert",
        expertise: ["Product Strategy", "User Research", "Product Management"],
        persona: {
          name: "Rachel Green",
          title: "Head of Product",
          mission: "Build products that users love and that drive business value",
          scopeIn: "Product strategy, user research, product management, roadmap planning",
          scopeOut: "Technical implementation, marketing, financial planning",
          adviceStyle: "User-centric and strategic with emphasis on business impact",
          expertise: ["Product Strategy", "User Research", "Product Management", "Roadmap Planning"],
          personality: ["User-focused", "Strategic", "Collaborative"],
          kpis: ["User Satisfaction", "Product Adoption", "Feature Usage", "Revenue Impact"],
        },
      },
      {
        name: "James Wilson",
        title: "UX/UI Design Lead",
        oneLiner: "User experience and interface design specialist",
        expertise: ["UX Design", "UI Design", "User Research"],
        persona: {
          name: "James Wilson",
          title: "UX/UI Design Lead",
          mission: "Create intuitive and beautiful user experiences",
          scopeIn: "UX design, UI design, user research, design systems, prototyping",
          scopeOut: "Technical implementation, marketing, business strategy",
          adviceStyle: "User-centered and design-focused with emphasis on usability",
          expertise: ["UX Design", "UI Design", "User Research", "Design Systems", "Prototyping"],
          personality: ["User-centered", "Creative", "Detail-oriented"],
          kpis: ["User Satisfaction", "Task Success Rate", "Design Consistency", "Usability Scores"],
        },
      },
      {
        name: "Michael Chang",
        title: "Engineering Lead",
        oneLiner: "Full-stack engineering and team leadership",
        expertise: ["Engineering Management", "Technical Architecture", "Agile"],
        persona: {
          name: "Michael Chang",
          title: "Engineering Lead",
          mission: "Build high-quality software through effective engineering practices",
          scopeIn: "Engineering management, technical architecture, agile processes, team leadership",
          scopeOut: "Business strategy, marketing, financial planning",
          adviceStyle: "Technical and process-focused with emphasis on quality and delivery",
          expertise: ["Engineering Management", "Technical Architecture", "Agile", "Team Leadership"],
          personality: ["Technical", "Process-oriented", "Leadership-focused"],
          kpis: ["Code Quality", "Delivery Velocity", "Team Productivity", "System Reliability"],
        },
      },
    ],
  },
};

// Get all available team templates
export const getTeamTemplates = query({
  args: {},
  handler: async (ctx) => {
    // Return predefined team templates
    return Object.entries(TEAM_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      advisorCount: template.advisors.length,
      featured: id === "startup-founding-team", // Feature the startup team
      sortOrder: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  },
});

// Get specific team template by ID
export const getTeamTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const template = TEAM_TEMPLATES[args.templateId as keyof typeof TEAM_TEMPLATES];
    if (!template) {
      throw new Error("Team template not found");
    }

    return {
      id: args.templateId,
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      advisors: template.advisors,
      advisorCount: template.advisors.length,
    };
  },
});

// Create team from template - main action
export const createFromTemplate = action({
  args: {
    templateId: v.string(),
    idempotencyKey: v.string(),
    selectedAdvisors: v.optional(v.array(v.object({
      id: v.string(),
      selected: v.boolean(),
      customName: v.optional(v.string()),
      customTitle: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const template = TEAM_TEMPLATES[args.templateId as keyof typeof TEAM_TEMPLATES];
    if (!template) {
      throw new Error("Team template not found");
    }

    // Get user identity from auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const userId = identity.subject;

    // Filter advisors based on selection if provided, otherwise use all
    const advisorsToCreate = args.selectedAdvisors
      ? template.advisors.filter((advisor, index) =>
          args.selectedAdvisors?.find(sel => sel.id === index.toString())?.selected
        ).map((advisor, index) => {
          const selection = args.selectedAdvisors?.find(sel => sel.id === index.toString());
          return {
            ...advisor,
            name: selection?.customName || advisor.name,
            title: selection?.customTitle || advisor.title,
          };
        })
      : template.advisors;

    if (advisorsToCreate.length === 0) {
      throw new Error("No advisors selected for team creation");
    }

    // Create advisors and get their IDs
    const advisorIds: string[] = [];

    for (const advisorData of advisorsToCreate) {
      try {
        // Create the advisor via mutation
        const result = await ctx.runMutation(api.advisors.createAdvisorFromTeam, {
          advisorData,
          userId,
          source: "team",
          teamId: `${args.templateId}-${args.idempotencyKey}`,
        });

        advisorIds.push(result.advisorId);
      } catch (error) {
        console.error("Failed to create advisor:", error);
        // Continue with other advisors even if one fails
      }
    }

    return {
      ok: true,
      templateId: args.templateId,
      version: "1.0.0",
      advisorIds,
      advisors: advisorsToCreate.map((advisor, index) => ({
        _id: advisorIds[index] || `temp-${index}`,
        name: advisor.name,
        title: advisor.title,
        oneLiner: advisor.oneLiner,
        handle: advisor.name.toLowerCase().replace(/\s+/g, "-"),
        category: template.category,
      })),
    };
  },
});

// Get user's teams (based on userAdvisors with team source)
export const getUserTeams = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;

    // Get user record from clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      return [];
    }

    // Get user's team-based advisors
    const teamAdvisors = await ctx.db
      .query("userAdvisors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("source"), "team"))
      .collect();

    // Group by teamId to form teams
    const teamsMap = new Map<string, any>();

    for (const userAdvisor of teamAdvisors) {
      const advisor = await ctx.db.get(userAdvisor.advisorId);
      if (!advisor || !userAdvisor.teamId) continue;

      if (!teamsMap.has(userAdvisor.teamId)) {
        teamsMap.set(userAdvisor.teamId, {
          teamId: userAdvisor.teamId,
          advisors: [],
          createdAt: userAdvisor.selectedAt,
        });
      }

      teamsMap.get(userAdvisor.teamId).advisors.push({
        _id: advisor._id,
        name: advisor.persona.name,
        title: advisor.persona.title,
        oneLiner: advisor.persona.oneLiner || advisor.persona.description?.substring(0, 100) + "...",
        handle: advisor.persona.name.toLowerCase().replace(/\s+/g, "-"),
        imageUrl: advisor.imageUrl,
        category: advisor.category,
      });
    }

    return Array.from(teamsMap.values()).map(team => ({
      ...team,
      advisorCount: team.advisors.length,
    }));
  },
});

// Check if a specific team template exists
export const teamTemplateExists = query({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    return args.templateId in TEAM_TEMPLATES;
  },
});