import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  AdvisorIdentitySchema,
  AdvisorExpertiseSchema,
  AdvisorRoleSchema,
  AdvisorWizardSchema,
  type AdvisorWizardInput,
  mapWizardToCreatePayload,
} from '../../forms/schemas';

function validWizard(): AdvisorWizardInput {
  return {
    identity: { name: 'CEO Coach', title: 'Coach', oneLiner: 'Leadership & vision', avatarUrl: undefined, handle: undefined, tags: ['leadership'] },
    expertise: { specialties: ['leadership'], expertise: ['strategy'], traits: ['decisive'] },
    role: { mission: 'Help CEOs make better decisions', scopeIn: ['org'], scopeOut: [], kpis: ['clarity'], adviceStyle: { voice: 'Direct', tone: 'Supportive' } },
  };
}

describe('Zod Schemas', () => {
  it('validates AdvisorIdentitySchema', () => {
    const good = AdvisorIdentitySchema.safeParse(validWizard().identity);
    expect(good.success).toBe(true);

    const bad = AdvisorIdentitySchema.safeParse({ name: '', title: '', oneLiner: '' });
    expect(bad.success).toBe(false);
  });

  it('requires at least one specialty', () => {
    const res = AdvisorExpertiseSchema.safeParse({ specialties: [], expertise: [], traits: [] });
    expect(res.success).toBe(false);
  });

  it('validates AdvisorRoleSchema boundary values', () => {
    const res = AdvisorRoleSchema.safeParse({ mission: 'x'.repeat(10), scopeIn: [], scopeOut: [], kpis: [], adviceStyle: { voice: 'OK' } });
    expect(res.success).toBe(true);

    const bad = AdvisorRoleSchema.safeParse({ mission: 'short', scopeIn: [], scopeOut: [], kpis: [] });
    expect(bad.success).toBe(false);
  });

  it('validates AdvisorWizardSchema end-to-end', () => {
    const res = AdvisorWizardSchema.safeParse(validWizard());
    expect(res.success).toBe(true);
  });
});

describe('mapWizardToCreatePayload', () => {
  it('maps valid wizard input to server payload', () => {
    const payload = mapWizardToCreatePayload(validWizard());
    expect(payload).toMatchObject({ name: 'CEO Coach', oneLiner: 'Leadership & vision', mission: expect.any(String) });
    // optional fields preserved as arrays
    expect(Array.isArray(payload.specialties)).toBe(true);
  });

  it('rejects invalid wizard input via schema', () => {
    const bad: any = { identity: { name: '', oneLiner: '' }, expertise: { specialties: [] }, role: { mission: '' } };
    const parsed = AdvisorWizardSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });
});

