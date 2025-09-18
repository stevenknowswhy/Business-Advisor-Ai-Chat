import { httpAction, httpRouter } from 'convex/server';

function requireAuth(request) {
  const h = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice('Bearer '.length);
}

export const upsertAdvisor = httpAction(async (ctx, request) => {
  const auth = requireAuth(request);
  if (!auth) return new Response('Unauthorized', { status: 401 });

  const payload = await request.json();
  const args = Array.isArray(payload) ? payload : [payload];

  try {
    const result = await ctx.runMutation('upsertAdvisor', args);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(String(err?.message || err), { status: 500 });
  }
});

export const optionsHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
});

const http = httpRouter();

http.route({
  path: '/v1/action/upsertAdvisor',
  method: 'POST',
  handler: upsertAdvisor,
});

http.route({
  path: '/v1/action/upsertAdvisor',
  method: 'OPTIONS',
  handler: optionsHandler,
});

// Also expose a shorter path for compatibility
http.route({
  path: '/upsertAdvisor',
  method: 'POST',
  handler: upsertAdvisor,
});

http.route({
  path: '/upsertAdvisor',
  method: 'OPTIONS',
  handler: optionsHandler,
});

export default http;
