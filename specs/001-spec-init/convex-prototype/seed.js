#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import convex, { createUser } from './convexMock.js';
import convexClient from './convexClient.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [
  path.resolve(__dirname, '../../../../ai-advisor-chat/prisma/advisors'),
  path.resolve(__dirname, '../../../../../ai-advisor-chat/prisma/advisors'),
  path.resolve(__dirname, '../../../ai-advisor-chat/prisma/advisors'),
  path.resolve(__dirname, '../../ai-advisor-chat/prisma/advisors'),
  path.resolve(__dirname, '../ai-advisor-chat/prisma/advisors'),
  path.resolve(__dirname, '../../../../../Ai\ Advisor\ App/ai-advisor-chat/prisma/advisors')
];

async function findAdvisorsDir() {
  for (const cand of candidates) {
    try {
      const stat = await fs.stat(cand);
      if (stat.isDirectory()) return cand;
    } catch (err) {
      // ignore
    }
  }
  return null;
}

async function readAdvisorFiles(dir) {
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const advisors = [];
  for (const f of jsonFiles) {
    const full = path.join(dir, f);
    const content = await fs.readFile(full, 'utf8');
    try {
      const parsed = JSON.parse(content);
      parsed._sourceFile = f;
      advisors.push(parsed);
    } catch (err) {
      console.error('Failed to parse', f, err);
    }
  }
  return advisors;
}

function upsertAdvisorToStore(advisor) {
  const legacyId = advisor.id || `legacy_${uuidv4()}`;
  const existing = Array.from(convex.advisors.values()).find(a => a.legacyId === legacyId || a.sourceFile === advisor._sourceFile);
  if (existing) {
    existing.name = advisor.name || existing.name;
    existing.persona = advisor.persona || existing.persona;
    existing.modelHint = advisor.modelHint || existing.modelHint;
    existing.imageUrl = advisor.imageUrl || existing.imageUrl;
    existing.updatedAt = new Date().toISOString();
    return { action: 'updated', doc: existing };
  }

  const id = `adv_${uuidv4()}`;
  const doc = {
    id,
    legacyId,
    ownerId: advisor.ownerId || null,
    name: advisor.name || 'Unnamed Advisor',
    persona: advisor.persona || {},
    modelHint: advisor.modelHint || null,
    imageUrl: advisor.imageUrl || null,
    sourceFile: advisor._sourceFile || null,
    createdAt: new Date().toISOString()
  };
  convex.advisors.set(id, doc);
  return { action: 'created', doc };
}

export async function seedAdvisors(advisorsDirOverride) {
  const ADVISORS_DIR = advisorsDirOverride || await findAdvisorsDir();
  if (!ADVISORS_DIR) {
    throw new Error('Could not find advisors directory. Run from repo root or provide an override.');
  }

  console.log('Seeding advisors into mock Convex store from:', ADVISORS_DIR);
  const advisors = await readAdvisorFiles(ADVISORS_DIR);
  if (!advisors.length) {
    console.log('No advisor JSON files found in', ADVISORS_DIR);
    return [];
  }

  const results = [];
  // Try to initialize the convex client so SDK calls can be used when available
  try {
    await convexClient.init();
  } catch (err) {
    // ignore — we'll fall back to HTTP or mock
  }

  for (const adv of advisors) {
    // Prefer SDK client if initialized and in convex mode
    if (convexClient && convexClient.mode && convexClient.mode() === 'convex') {
      try {
        let res;
        if (convexClient.runAction) {
          res = await convexClient.runAction('upsertAdvisor', adv);
        } else if (convexClient.action) {
          res = await convexClient.action('upsertAdvisor', adv);
        } else if (convexClient.mutation) {
          res = await convexClient.mutation('upsertAdvisor', adv);
        } else if (convexClient.upsertAdvisor) {
          res = await convexClient.upsertAdvisor(adv);
        }
        results.push({ file: adv._sourceFile, action: res?.action || 'mutated', id: res?.id || res?.doc?._id || res?.doc?.id || null, legacyId: res?.legacyId || res?.doc?.legacyId || adv.id || adv.advisorId || null });
        continue;
      } catch (err) {
        console.warn('SDK upsertAdvisor failed, falling back to HTTP/mock:', err.message || err);
      }
    }

    // If a self-hosted URL and key exist, call the Convex HTTP action endpoint directly
    if ((process.env.CONVEX_SITE_URL || process.env.CONVEX_SELF_HOSTED_URL || process.env.CONVEX_URL) && (process.env.CONVEX_DEPLOY_KEY || process.env.CONVEX_KEY)) {
      try {
        const res = await httpUpsertAdvisor(adv);
        results.push({ file: adv._sourceFile, action: res.action || 'mutated', id: res.doc?.id || null, legacyId: res.doc?.legacyId || adv.id || null });
        continue;
      } catch (err) {
        console.warn('HTTP upsertAdvisor failed, falling back to mock:', err.message || err);
      }
    }

    const res = upsertAdvisorToStore(adv);
    results.push({ file: adv._sourceFile, action: res.action, id: res.doc.id, legacyId: res.doc.legacyId });
  }

  console.log('Seed results:');
  for (const r of results) {
    console.log('-', r.file, r.action, r.id, r.legacyId);
  }

  if (convexClient && convexClient.mode && convexClient.mode() === 'convex') {
    console.log('Seed completed using Convex SDK (remote). Verify via `npx convex run advisors:listAdvisors --env-file .env.deploy`.');
  } else {
    console.log('Total advisors in store:', convex.advisors.size);
  }
  return results;
}

async function httpUpsertAdvisor(advisor) {
  // Prefer the public site URL for HTTP Actions (CONVEX_SITE_URL), then fall back to SELF_HOSTED/CLOUD URL
  const base = process.env.CONVEX_SITE_URL || process.env.CONVEX_SELF_HOSTED_URL || process.env.CONVEX_URL;
  const key = process.env.CONVEX_DEPLOY_KEY || process.env.CONVEX_KEY;
  if (!base || !key) throw new Error('Convex URL or key not set');
  const url = `${base.replace(/\/$/, '')}/v1/action/upsertAdvisor`;
  const body = JSON.stringify([advisor]);
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body });
  if (!res.ok) {
    const txt = await res.text().catch(()=>null);
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }
  const json = await res.json();
  return json;
}

// CLI entrypoint
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedAdvisors().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
