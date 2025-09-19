/* @jest-environment node */
import { describe, it, expect } from '@jest/globals';
import { slugifyHandle, getUniqueHandle } from '../../utils/handleUtils';

describe('slugifyHandle', () => {
  it('lowercases and replaces spaces/specials with dashes', () => {
    expect(slugifyHandle('CEO Coach! 2025')).toBe('ceo-coach-2025');
  });

  it('trims leading/trailing dashes and limits length', () => {
    const long = 'X'.repeat(200);
    const s = slugifyHandle(long);
    expect(s.length).toBeLessThanOrEqual(40);
    expect(/^-|-$/.test(s)).toBe(false);
  });

  it('ensures min length by suffixing random chunk when too short', () => {
    const s = slugifyHandle('x');
    expect(s.length).toBeGreaterThanOrEqual(3);
  });
});

describe('getUniqueHandle', () => {
  it('returns root when not existing', async () => {
    const h = await getUniqueHandle('CEO Coach', async () => false);
    expect(h).toBe('ceo-coach');
  });

  it('appends numeric suffix on conflict', async () => {
    const existing = new Set(['ceo-coach']);
    const h = await getUniqueHandle('CEO Coach', async (c) => existing.has(c));
    expect(h).toBe('ceo-coach-2');
  });

  it('increments suffix beyond 2 when multiple conflicts', async () => {
    const existing = new Set(['ceo-coach', 'ceo-coach-2', 'ceo-coach-3']);
    const h = await getUniqueHandle('CEO Coach', async (c) => existing.has(c));
    expect(h).toBe('ceo-coach-4');
  });

  it('throws when max attempts exceeded', async () => {
    await expect(getUniqueHandle('X', async () => true, { maxAttempts: 3 })).rejects.toThrow('HANDLE_GENERATION_FAILED');
  });
});

