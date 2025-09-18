// Convex client shim: uses real Convex SDK if CONVEX_URL+CONVEX_KEY present and SDK installed,
// otherwise falls back to the local mock store.
import convexMock from './convexMock.js';

let mode = 'mock';
let convexClient = null;

async function init() {
  // Accept multiple env var names: prefer CONVEX_URL / CONVEX_KEY, fall back to SELF_HOSTED / DEPLOY variants
  const url = process.env.CONVEX_URL || process.env.CONVEX_SELF_HOSTED_URL || process.env.CONVEX_SITE_URL;
  const key = process.env.CONVEX_KEY || process.env.CONVEX_DEPLOY_KEY;
  if (url && key) {
    try {
      // Try importing the Convex SDK server-side client first from the official package,
      // then fall back to the concrete ESM file URL if needed.
      try {
        let ConvexHttpClient = null;
        try {
          const httpMod = await import('convex/browser');
          ConvexHttpClient = httpMod.ConvexHttpClient || httpMod.default?.ConvexHttpClient || null;
          if (ConvexHttpClient) {
            console.log('convexClient: using ConvexHttpClient from convex/browser');
          }
        } catch (e) {
          console.warn('convexClient: failed to import convex/browser:', e?.message || e);
        }

        if (!ConvexHttpClient) {
          // Fallback: import the concrete HTTP client implementation from the installed convex package (file URL)
          const clientModuleUrl = new URL('./convex/node_modules/convex/dist/esm/browser/http_client.js', import.meta.url).href;
          console.log('convexClient: attempting to import concrete http client from', clientModuleUrl);
          const httpMod = await import(clientModuleUrl);
          ConvexHttpClient = httpMod.ConvexHttpClient || httpMod.default?.ConvexHttpClient || null;
        }

        if (ConvexHttpClient) {
          const client = new ConvexHttpClient(url, { auth: undefined });
          // If the provided key looks like a dev/admin key (Convex deploy key), use setAdminAuth
          try {
            if (typeof key === 'string' && key.startsWith('dev:')) {
              client.setAdminAuth(key);
              console.log('convexClient: set admin auth (deploy key)');
            } else {
              client.setAuth(key);
              console.log('convexClient: set auth (jwt)');
            }
          } catch (e) {
            console.warn('convexClient: failed to set auth on client:', e?.message || e);
          }
          console.log('convexClient: instantiated ConvexHttpClient for', url, 'with key=', (key && key.length) ? `${key.slice(0,6)}...${key.slice(-6)}` : 'NONE');
          convexClient = {
            _raw: client,
            // Spread array args for server-style function signatures (e.g., [adv])
            mutation: (name, args) => Array.isArray(args) ? client.mutation(name, ...args) : client.mutation(name, args),
            query: (name, args) => Array.isArray(args) ? client.query(name, ...args) : client.query(name, args),
            action: (name, args) => Array.isArray(args) ? client.action(name, ...args) : client.action(name, args),
            runAction: async (actionName, args) => client.action
              ? (Array.isArray(args) ? client.action(actionName, ...args) : client.action(actionName, args))
              : (Array.isArray(args) ? client.mutation(actionName, ...args) : client.mutation(actionName, args))
          };
          mode = 'convex';
          console.log('convexClient: using real Convex SDK (mode=convex)');
          return;
        }
        console.warn('convexClient: could not load ConvexHttpClient from either convex/browser or concrete file URL');
      } catch (err) {
        console.warn('convexClient: Convex SDK import failed; falling back to mock.', err?.message || err);
      }
    } catch (err) {
      console.warn('convexClient: Convex SDK import failed; falling back to mock.', err?.message || err);
    }
  } else {
    // Not enough env vars to attempt SDK mode
    console.log('convexClient: no CONVEX_URL/CONVEX_KEY or SELF_HOSTED/DEPLOY key found in env; skipping SDK init');
  }
  convexClient = convexMock;
  mode = 'mock';
  console.log('convexClient: using mock store (mode=mock)');
}

async function ensureInit() {
  if (!convexClient) await init();
}

export async function upsertAdvisor(advisor) {
  await ensureInit();
  if (mode === 'convex') {
    // Expect a mutation named 'upsertAdvisor' implemented server-side in Convex functions
    if (!convexClient.mutation) throw new Error('convexClient: real Convex client missing mutation method');
    // Server-style function signatures expect args array: [advisor]
    return convexClient.mutation('advisors:upsertAdvisor', [advisor]);
  }
  // mock: upsert into local store
  const existing = Array.from(convexClient.advisors.values()).find(a => a.legacyId === (advisor.id || advisor.legacyId) || a.sourceFile === advisor._sourceFile);
  if (existing) {
    Object.assign(existing, { name: advisor.name || existing.name, persona: advisor.persona || existing.persona, modelHint: advisor.modelHint || existing.modelHint, imageUrl: advisor.imageUrl || existing.imageUrl, updatedAt: new Date().toISOString() });
    return { action: 'updated', doc: existing };
  }
  const id = `adv_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const doc = { id, legacyId: advisor.id || advisor.legacyId || null, ownerId: advisor.ownerId || null, name: advisor.name || 'Unnamed Advisor', persona: advisor.persona || {}, modelHint: advisor.modelHint || null, imageUrl: advisor.imageUrl || null, sourceFile: advisor._sourceFile || null, createdAt: new Date().toISOString() };
  convexClient.advisors.set(id, doc);
  return { action: 'created', doc };
}

export async function createConversation(ownerId, { title = '', advisorIds = [] } = {}) {
  await ensureInit();
  if (mode === 'convex') {
    if (!convexClient.mutation) throw new Error('convexClient: real Convex client missing mutation method');
    // Pass as array to match (ctx, { ... }) signature
    return convexClient.mutation('conversations:createConversation', [{ ownerId, title, advisorIds }]);
  }
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const doc = { id, ownerId, title, advisorIds, createdAt: new Date().toISOString() };
  convexClient.conversations.set(id, doc);
  return doc;
}

export async function appendMessage({ conversationId, senderId, role = 'user', content = '', partial = false }) {
  await ensureInit();
  if (mode === 'convex') {
    if (!convexClient.mutation) throw new Error('convexClient: real Convex client missing mutation method');
    // Pass as array to match (ctx, { ... }) signature
    return convexClient.mutation('messages:appendMessage', [{ conversationId, senderId, role, content, partial }]);
  }
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const doc = { id, conversationId, senderId, role, content, partial, createdAt: new Date().toISOString() };
  convexClient.messages.set(id, doc);
  const conv = convexClient.conversations.get(conversationId);
  if (conv) conv.lastMessageAt = doc.createdAt;
  return doc;
}

export async function listMessages(conversationId) {
  await ensureInit();
  if (mode === 'convex') {
    if (!convexClient.query) throw new Error('convexClient: real Convex client missing query method');
    // Pass as array to match (ctx, conversationId) signature
    return convexClient.query('messages:listMessagesForConversation', [conversationId]);
  }
  return Array.from(convexClient.messages.values()).filter(m => m.conversationId === conversationId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
}

export default { upsertAdvisor, createConversation, appendMessage, listMessages, init, mode: () => mode };
