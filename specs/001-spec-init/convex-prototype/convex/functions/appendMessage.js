export default async function appendMessage(ctx, { conversationId, senderId, role = 'user', content = '', partial = false }) {
  const { db } = ctx;
  const msg = await db.table('messages').insert({
    conversationId,
    senderId,
    role,
    content,
    partial,
    createdAt: new Date().toISOString()
  });
  try {
    await db.table('conversations').update(conversationId, { lastMessageAt: new Date().toISOString() });
  } catch (err) {
    // conversationId might be an internal Convex id; if update fails, ignore for now
  }
  return msg;
}
