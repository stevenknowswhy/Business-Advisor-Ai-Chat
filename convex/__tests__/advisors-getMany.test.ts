/* @jest-environment node */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { getMany } from '../advisors';

function makeCtx(authenticated = true) {
  let idSeq = 0;
  const store: Record<string, any[]> = {
    advisors: [],
    userAdvisors: [],
  };
  const db = {
    insert: async (table: string, doc: any) => {
      const _id = `${table}_${++idSeq}`;
      const row = { _id, ...doc };
      store[table].push(row);
      return _id;
    },
    get: async (id: string) => {
      for (const table of Object.keys(store)) {
        const row = store[table].find((r) => r._id === id);
        if (row) return row;
      }
      return null;
    },
  } as any;
  const ctx: any = {
    auth: { getUserIdentity: async () => (authenticated ? { subject: 'user_123' } : null) },
    db,
  };
  return { ctx, store } as const;
}

describe('advisors.getMany', () => {
  let ctx: any; let store: any;
  beforeEach(() => ({ ctx, store } = makeCtx(true)));

  it('returns details for owned advisors only', async () => {
    // Insert advisors: two owned and one by another user
    const owned1 = await ctx.db.insert('advisors', { ownerId: 'user_123', name: 'A', oneLiner: 'x', handle: 'a', createdAt: Date.now() });
    const owned2 = await ctx.db.insert('advisors', { ownerId: 'user_123', name: 'B', oneLiner: 'y', handle: 'b', createdAt: Date.now() });
    const other = await ctx.db.insert('advisors', { ownerId: 'user_999', name: 'C', oneLiner: 'z', handle: 'c', createdAt: Date.now() });

    const res = await (getMany as any).handler(ctx, { ids: [owned1, owned2, other] });
    expect(res.ok).toBe(true);
    expect(res.advisors).toHaveLength(2);
    const ids = res.advisors.map((a: any) => a._id);
    expect(ids).toContain(owned1);
    expect(ids).toContain(owned2);
    expect(ids).not.toContain(other);
  });

  it('throws UNAUTHENTICATED if no session', async () => {
    const { ctx: unauth } = makeCtx(false);
    await expect((getMany as any).handler(unauth, { ids: [] })).rejects.toThrow('UNAUTHENTICATED');
  });
});

