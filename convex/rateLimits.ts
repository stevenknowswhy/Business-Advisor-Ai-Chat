// Rate limiting helper (scaffold)
// Requires a collection named "rateLimits" in your Convex schema with fields:
// { userId: string, action: string, windowStart: number, count: number }

import type { ActionCtx } from "./_generated/server";

export interface RateLimitConfig {
  limit: number; // max count per window
  windowMs: number; // window size in ms
}

export async function enforceRateLimit(
  ctx: ActionCtx,
  userId: string,
  action: string,
  { limit, windowMs }: RateLimitConfig
): Promise<void> {
  const now = Date.now();
  const windowStart = now - (now % windowMs); // fixed window for scaffold

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex?.("by_user_action", (q: any) => q.eq("userId", userId).eq("action", action))
    .first?.();

  if (!existing) {
    await ctx.db.insert("rateLimits", { userId, action, windowStart, count: 1 } as any);
    return;
  }

  if (existing.windowStart === windowStart) {
    if (existing.count >= limit) {
      throw new Error("RATE_LIMITED");
    }
    await ctx.db.patch(existing._id, { count: existing.count + 1 } as any);
    return;
  }

  // New window
  await ctx.db.patch(existing._id, { windowStart, count: 1 } as any);
}

