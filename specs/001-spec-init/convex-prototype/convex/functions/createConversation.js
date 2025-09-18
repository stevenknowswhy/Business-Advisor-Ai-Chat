export default async function createConversation(ctx, { ownerId, title = '', advisorIds = [] } = {}) {
  const { db } = ctx;
  const conv = await db.table('conversations').insert({
    ownerId,
    title,
    advisorIds,
    createdAt: new Date().toISOString(),
    lastMessageAt: null
  });
  return conv;
}
