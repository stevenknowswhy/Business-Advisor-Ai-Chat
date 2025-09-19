import { v } from "convex/values";
import { action } from "./_generated/server";
import { withIdempotency } from "./idempotencyKeys";
import { enforceRateLimit } from "./rateLimits";

/**
 * teams.createFromTemplate (scaffold)
 * - Validates Clerk auth via Convex ctx.auth
 * - Supports optional idempotencyKey to prevent duplicate creation
 * - Applies rate limit guard via helper
 * - Spawns advisors from a versioned template blueprint
 */

export async function createFromTemplateHandler(ctx: any, { templateId, idempotencyKey }: { templateId: string; idempotencyKey?: string }) {
  // Auth: Clerk-Convex integration; requires JWT template named "convex"
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHENTICATED");
  }
  const userId = identity.subject; // Clerk user id

  // Rate limit: max 3 team spawns per minute
  await enforceRateLimit(ctx, userId, "teams.createFromTemplate", { limit: 3, windowMs: 60_000 });

  // Template blueprint registry
  const templates: Record<string, {
    version: string;
    category: string;
    advisors: Array<{ name: string; oneLiner: string; mission: string; specialties?: string[]; adviceStyle?: { voice: string; tone?: string } }>;
  }> = {
    "startup-squad": {
      version: "v1",
      category: "startup",
      advisors: [
        { name: "CEO Coach", oneLiner: "Leadership & vision", mission: "Coach founders on strategy, org design, and decision making.", specialties: ["leadership","strategy"], adviceStyle: { voice: "Direct", tone: "Supportive" } },
        { name: "PM Coach", oneLiner: "Prioritization & roadmap", mission: "Drive discovery, backlog health, and outcome-driven roadmaps.", specialties: ["product","discovery"], adviceStyle: { voice: "Guiding", tone: "Pragmatic" } },
        { name: "GTM Coach", oneLiner: "Positioning & launch", mission: "Shape messaging, ICP, and repeatable launches.", specialties: ["marketing","growth"], adviceStyle: { voice: "Persuasive", tone: "Energetic" } },
      ],
    },
    "enterprise-trio": {
      version: "v1",
      category: "enterprise",
      advisors: [
        { name: "Sales Architect", oneLiner: "Enterprise sales mechanics", mission: "Build scalable enterprise sales motions.", specialties: ["sales","enterprise"], adviceStyle: { voice: "Authoritative", tone: "Calm" } },
        { name: "Security Advisor", oneLiner: "Risk & compliance", mission: "Guide SOC2/ISO and vendor security reviews.", specialties: ["security","compliance"], adviceStyle: { voice: "Cautious", tone: "Precise" } },
        { name: "Platform PM", oneLiner: "Platform-as-a-product", mission: "Evolve internal platforms with strong SLOs.", specialties: ["platform","sre"], adviceStyle: { voice: "Analytical", tone: "Neutral" } },
      ],
    },
    "creative-studio": {
      version: "v1",
      category: "creative",
      advisors: [
        { name: "Brand Strategist", oneLiner: "Narrative & identity", mission: "Craft brand strategy and identity systems.", specialties: ["brand","identity"], adviceStyle: { voice: "Inspirational", tone: "Warm" } },
        { name: "Content Director", oneLiner: "Editorial excellence", mission: "Lead content ops and editorial standards.", specialties: ["content","editorial"], adviceStyle: { voice: "Editorial", tone: "Clear" } },
      ],
    },
    "growth-pod": {
      version: "v1",
      category: "growth",
      advisors: [
        { name: "Acquisition Lead", oneLiner: "Paid & organic", mission: "Scale acquisition with ROI discipline.", specialties: ["paid","seo"], adviceStyle: { voice: "Data-driven", tone: "Crisp" } },
        { name: "Lifecycle PMM", oneLiner: "Activation to retention", mission: "Optimize onboarding, activation, and retention loops.", specialties: ["lifecycle","pmm"], adviceStyle: { voice: "Empathetic", tone: "Practical" } },
      ],
    },
  };

  const tpl = templates[templateId];
  if (!tpl) throw new Error("TEMPLATE_NOT_FOUND");

  const run = async () => {
    const createdAdvisorIds: string[] = [];
    for (const bp of tpl.advisors) {
      const payload = {
        name: bp.name,
        title: undefined,
        oneLiner: bp.oneLiner,
        avatarUrl: undefined,
        handle: undefined,
        tags: [],
        specialties: bp.specialties ?? [],
        expertise: [],
        traits: [],
        mission: bp.mission,
        scopeIn: [],
        scopeOut: [],
        kpis: [],
        adviceStyle: bp.adviceStyle ?? { voice: "Supportive", tone: "Pragmatic" },
        metadata: { templateId, templateVersion: tpl.version, source: "team" },
        isPublic: true,
        category: tpl.category,
      };
      const res = await ctx.runAction("advisors:create", { payload });
      if ((res as any)?.ok) createdAdvisorIds.push((res as any).advisorId as string);
    }
    return { ok: true as const, templateId, version: tpl.version, advisorIds: createdAdvisorIds };
  };

  const idemKey = `${userId}:${templateId}:${idempotencyKey ?? "_"}`;
  const result = await withIdempotency(ctx, idemKey, 10 * 60_000, run);
  return result;
}

export const createFromTemplate = action({
  args: {
    templateId: v.string(),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, { templateId, idempotencyKey }) => {
    return createFromTemplateHandler(ctx, { templateId, idempotencyKey });
  },
});

