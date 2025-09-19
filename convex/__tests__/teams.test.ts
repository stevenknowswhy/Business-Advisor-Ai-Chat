/* @jest-environment node */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createFromTemplateHandler } from '../teams';
import { createAdvisorHandler } from '../advisors';

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
        if (idx >= 0) { store[table][idx] = { ...store[table][idx], ...update }; return; }
      }
    },
    query: (table: string) => {
      const filters: Array<[string, any]> = [];
      const qbuilder = { eq(field: string, value: any) { filters.push([field, value]); return qbuilder; } };
      const withIndex = (_name: string, fn: (q: any) => any) => {
        fn(qbuilder);
        const pred = (row: any) => filters.every(([f, v]) => row[f] === v);
        return { first: async () => store[table].find(pred) ?? null, collect: async () => store[table].filter(pred) };
      };
      return { withIndex } as any;
    },
  };
  const ctx: any = {
    auth: { getUserIdentity: async () => (authenticated ? { subject: 'user_123' } : null) },
    db,
    runAction: async (name: string, { payload }: any) => {
      if (name === 'advisors:create') return createAdvisorHandler(ctx, payload);
      throw new Error('Unknown action: ' + name);
    },
    runMutation: async (name: string, args: any) => {
      if (name === 'advisors:_insertAdvisor') return db.insert('advisors', args.doc);
      if (name === 'advisors:_linkUserAdvisor') return db.insert('userAdvisors', { userId: args.userId, advisorId: args.advisorId, source: args.source });
      throw new Error('Unknown mutation: ' + name);
    },
  };
  return { ctx, store } as const;
}

describe('teams.createFromTemplate', () => {
  let ctx: any; let store: any;
  beforeEach(() => ({ ctx, store } = makeCtx(true)));

  it('creates advisors from a valid template', async () => {
    const res = await createFromTemplateHandler(ctx, { templateId: 'startup-squad' });
    expect(res.ok).toBe(true);
    expect(res.advisorIds.length).toBeGreaterThanOrEqual(2);
    expect(store.advisors.length).toBe(res.advisorIds.length);
  });

  it('idempotency returns cached result', async () => {
    const key = 'fixed-key-123';
    const first = await createFromTemplateHandler(ctx, { templateId: 'startup-squad', idempotencyKey: key });
    const countAfterFirst = store.advisors.length;
    const second = await createFromTemplateHandler(ctx, { templateId: 'startup-squad', idempotencyKey: key });
    expect(second.advisorIds).toEqual(first.advisorIds);
    expect(store.advisors.length).toBe(countAfterFirst); // no duplicates
  });

  it('rate limits after 3 calls per minute', async () => {
    await createFromTemplateHandler(ctx, { templateId: 'startup-squad' });
    await createFromTemplateHandler(ctx, { templateId: 'startup-squad' });
    await createFromTemplateHandler(ctx, { templateId: 'startup-squad' });
    await expect(createFromTemplateHandler(ctx, { templateId: 'startup-squad' })).rejects.toThrow('RATE_LIMITED');
  });

  it('throws on invalid template', async () => {
    await expect(createFromTemplateHandler(ctx, { templateId: 'nope' as any })).rejects.toThrow('TEMPLATE_NOT_FOUND');
  });
});

