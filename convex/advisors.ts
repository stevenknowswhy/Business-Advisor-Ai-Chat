import { action, internalMutation } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { z } from "zod";
import { getUniqueHandle, slugifyHandle } from "./utils/handleUtils";

// Server-side Zod validation mirroring client schema (kept minimal for scaffold)
const NonEmptyString = z.string().trim().min(1);
const Slug = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const UrlString = z.string().trim().url().optional();

export const AdvisorCreatePayloadSchema = z.object({
  name: NonEmptyString.min(2),
  title: z.string().trim().max(80).optional(),
  oneLiner: NonEmptyString.min(6),
  avatarUrl: UrlString,
  handle: Slug.optional(),
  tags: z.array(z.string().trim().min(2)).optional().default([]),
  specialties: z.array(z.string().trim().min(2)).optional().default([]),
  expertise: z.array(z.string().trim().min(2)).optional().default([]),
  traits: z.array(z.string().trim().min(2)).optional().default([]),
  mission: NonEmptyString.min(10),
  scopeIn: z.array(z.string().trim().min(2)).optional().default([]),
  scopeOut: z.array(z.string().trim().min(2)).optional().default([]),
  kpis: z.array(z.string().trim().min(2)).optional().default([]),
  adviceStyle: z
    .object({
      voice: NonEmptyString.min(2),
      tone: z.string().trim().min(2).optional(),
    })
    .optional(),
  metadata: z
    .object({
      templateId: z.string().optional(),
      templateVersion: z.string().optional(),
      source: z.enum(["wizard", "team", "import"]).optional(),
    })
    .optional(),
  // Marketplace flags (optional)
  isPublic: z.boolean().optional(),
  featured: z.boolean().optional(),
  category: z.string().trim().optional(),
});
export type AdvisorCreatePayload = z.infer<typeof AdvisorCreatePayloadSchema>;

// handle generation moved to shared/utils/handleUtils.ts

// Internal mutations to write data
export const _insertAdvisor = internalMutation({
  args: {
    doc: v.object({
      ownerId: v.string(),
      name: v.string(),
      title: v.optional(v.string()),
      oneLiner: v.string(),
      avatarUrl: v.optional(v.string()),
      handle: v.string(),
      tags: v.optional(v.array(v.string())),
      specialties: v.optional(v.array(v.string())),
      expertise: v.optional(v.array(v.string())),
      traits: v.optional(v.array(v.string())),
      mission: v.string(),
      scopeIn: v.optional(v.array(v.string())),
      scopeOut: v.optional(v.array(v.string())),
      kpis: v.optional(v.array(v.string())),
      adviceStyle: v.optional(v.object({ voice: v.string(), tone: v.optional(v.string()) })),
      metadata: v.optional(v.object({ templateId: v.optional(v.string()), templateVersion: v.optional(v.string()), source: v.optional(v.string()) })),
      isPublic: v.optional(v.boolean()),
      featured: v.optional(v.boolean()),
      category: v.optional(v.string()),
      createdAt: v.number(),
    }),
  },
  handler: async (ctx, { doc }) => {
    const advisorId = await ctx.db.insert("advisors", doc);
    return advisorId as string;
  },
});

export const _linkUserAdvisor = internalMutation({
  args: {
    userId: v.string(),
    advisorId: v.id("advisors"),
    source: v.optional(v.string()),
    teamKey: v.optional(v.string()),
  },
  handler: async (ctx, { userId, advisorId, source, teamKey }) => {
    await ctx.db.insert("userAdvisors", {
      userId,
      advisorId,
      source: source ?? "wizard",
      teamKey,
      createdAt: Date.now(),
    });
  },
});

export async function createAdvisorHandler(ctx: ActionCtx, payload: unknown) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  const ownerId = identity.subject;

  const parsed = AdvisorCreatePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`INVALID_PAYLOAD: ${parsed.error.message}`);
  }
  const data = parsed.data;

  // Ensure unique handle using centralized guard
  const baseHandle = data.handle ?? slugifyHandle(data.name);
  const finalHandle = await getUniqueHandle(baseHandle, async (candidate) => {
    const existing = await ctx.db
      .query("advisors")
      .withIndex("by_owner_handle", (q: any) => q.eq("ownerId", ownerId).eq("handle", candidate))
      .first();
    return !!existing;
  });

  const advisorId = await ctx.runMutation("advisors:_insertAdvisor", {
    doc: {
      ownerId,
      name: data.name,
      title: data.title,
      oneLiner: data.oneLiner,
      avatarUrl: data.avatarUrl,
      handle: finalHandle,
      tags: data.tags ?? [],
      specialties: data.specialties ?? [],
      expertise: data.expertise ?? [],
      traits: data.traits ?? [],
      mission: data.mission,
      scopeIn: data.scopeIn ?? [],
      scopeOut: data.scopeOut ?? [],
      kpis: data.kpis ?? [],
      adviceStyle: data.adviceStyle,
      metadata: data.metadata ?? { source: "wizard" },
      // Marketplace flags if provided
      isPublic: (data as any).isPublic ?? undefined,
      featured: (data as any).featured ?? undefined,
      category: (data as any).category ?? undefined,
      createdAt: Date.now(),
    },
  });

  await ctx.runMutation("advisors:_linkUserAdvisor", {
    userId: ownerId,
    advisorId: advisorId as any,
    source: data.metadata?.source ?? "wizard",
  });

  return { ok: true as const, advisorId };
}

// Public action to validate/auth and create advisor + link
export const create = action({
  args: { payload: v.any() },
  handler: async (ctx, { payload }) => {
    return createAdvisorHandler(ctx, payload);
  },
});

// Public action to fetch multiple advisors by IDs (owned by the current user)
export const getMany = action({
  args: { ids: v.array(v.id("advisors")) },
  handler: async (ctx, { ids }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");
    const ownerId = identity.subject;

    const advisors: Array<{
      _id: string;
      name: string;
      oneLiner: string;
      handle: string;
      category?: string;
      avatarUrl?: string;
    }> = [];

    for (const id of ids) {
      const doc = await ctx.db.get(id);
      if (doc && (doc as any).ownerId === ownerId) {
        advisors.push({
          _id: id as unknown as string,
          name: (doc as any).name,
          oneLiner: (doc as any).oneLiner,
          handle: (doc as any).handle,
          category: (doc as any).category,
          avatarUrl: (doc as any).avatarUrl,
        });
      }
    }

    return { ok: true as const, advisors };
  },
});

