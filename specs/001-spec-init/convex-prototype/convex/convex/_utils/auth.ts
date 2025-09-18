import { v } from "convex/values";
// Lightweight auth helpers usable from any Convex function module

export type Ctx = {
  db: any;
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
};

export async function requireUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  const clerkId = identity.subject;
  const existing = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkId"), clerkId))
    .first();
  if (existing) return existing;

  const now = Date.now();
  const _id = await ctx.db.insert("users", {
    clerkId,
    legacyId: null,
    email: null,
    name: null,
    image: null,
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });
  return await ctx.db.get(_id);
}

