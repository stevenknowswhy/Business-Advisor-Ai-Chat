export default async function listMessagesForConversation(ctx, conversationId) {
  const { db } = ctx;
  // Use an index on conversationId for performance
  const msgs = await db.table('messages').getIndex('byConversation').list(conversationId).run();
  // Ensure messages are ordered by createdAt
  msgs.sort((a,b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  return msgs;
}
