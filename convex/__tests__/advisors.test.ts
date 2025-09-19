/* @jest-environment node */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createAdvisorHandler } from '../advisors';

// In-memory mock DB and ctx
function makeCtx(authenticated = true) {
  let idSeq = 0;
  const store: Record<string, any[]> = {
    advisors: [],
    userAdvisors: [],
    idempotencyKeys: [],
    rateLimits: [],
  };
  const db = {
    insert: async (table: string, doc: any) => {
      const _id = `${table}_${++idSeq}`;
      const row = { _id, ...doc };
      store[table].push(row);
      return _id;
    },
    patch: async (id: string, update: any) => {
      for (const table of Object.keys(store)) {
        const idx = store[table].findIndex(r => r._id === id);
        if (idx >= 0) {
          store[table][idx] = { ...store[table][idx], ...update };
          return;
        }
      }
    },
    query: (table: string) => {
      const filters: Array<[string, any]> = [];
      const qbuilder = {
        eq(field: string, value: any) {
          filters.push([field, value]);
          return qbuilder;
        },
      };
      const withIndex = (_name: string, fn: (q: any) => any) => {
        fn(qbuilder);
        const pred = (row: any) => filters.every(([f, v]) => row[f] === v);
        return {
          first: async () => store[table].find(pred) ?? null,
          collect: async () => store[table].filter(pred),
        };
      };
      return { withIndex } as any;
    },
  };
  const ctx: any = {
    auth: { getUserIdentity: async () => (authenticated ? { subject: 'user_123' } : null) },
    db,
    runMutation: async (name: string, args: any) => {
      if (name === 'advisors:_insertAdvisor') return db.insert('advisors', args.doc);
      if (name === 'advisors:_linkUserAdvisor') return db.insert('userAdvisors', { ...args, advisorId: args.advisorId });
      throw new Error('Unknown mutation: ' + name);
    },
  };
  return { ctx, store } as const;
}

describe('advisors.create (handler)', () => {
  let ctx: any; let store: any;
  beforeEach(() => ({ ctx, store } = makeCtx(true)));

  it('creates advisor with valid payload', async () => {
    const res = await createAdvisorHandler(ctx, {
      name: 'CEO Coach', oneLiner: 'Leadership & vision', mission: 'Guide CEOs',
    });
    expect(res.ok).toBe(true);
    expect(res.advisorId).toBeTruthy();
    expect(store.advisors.length).toBe(1);
  });

  it('throws INVALID_PAYLOAD for bad payload', async () => {
    await expect(createAdvisorHandler(ctx, { name: '', oneLiner: '', mission: '' })).rejects.toThrow('INVALID_PAYLOAD');
  });

  it('throws UNAUTHENTICATED when not logged in', async () => {
    const { ctx: unauth } = makeCtx(false);
    await expect(createAdvisorHandler(unauth, { name: 'X', oneLiner: 'Y', mission: 'Z' })).rejects.toThrow('UNAUTHENTICATED');
  });

  it('generates unique handle when conflict exists', async () => {
    // Pre-insert advisor with handle for same owner
    const handle = 'ceo-coach';
    await ctx.db.insert('advisors', { ownerId: 'user_123', handle, name: 'Existing', oneLiner: 'x', mission: 'm', createdAt: Date.now() });

    const res = await createAdvisorHandler(ctx, { name: 'CEO Coach', oneLiner: 'Leadership & vision', mission: 'Mission OK' });
    const created = store.advisors.find((a: any) => a._id === res.advisorId);
    expect(created.handle === handle).toBe(false);
    expect(created.handle.startsWith(handle)).toBe(true); // e.g., ceo-coach-2
  });
});

