// Idempotency helper (scaffold)
// Requires a collection named "idempotencyKeys" in your Convex schema with fields:
// { key: string, result: any, createdAt: number, expiresAt: number }

import type { ActionCtx } from "./_generated/server";

export interface IdempotencyRecord<T = unknown> {
  key: string;
  result: T;
  createdAt: number;
  expiresAt: number;
}

export async function withIdempotency<T>(
  ctx: ActionCtx,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = await ctx.db
    .query("idempotencyKeys")
    .withIndex?.("by_key", (q: any) => q.eq("key", key))
    .first?.();

  if (existing && existing.expiresAt > now) {
    return existing.result as T;
  }

  const result = await fn();
  await ctx.db.insert("idempotencyKeys", {
    key,
    result,
    createdAt: now,
    expiresAt: now + ttlMs,
  } as any);
  return result;
}

