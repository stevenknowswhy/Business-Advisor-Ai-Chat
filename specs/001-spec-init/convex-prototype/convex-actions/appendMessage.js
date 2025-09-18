// Convex server-side action (example)
// export default function appendMessage(ctx, { conversationId, senderId, role, content, partial }) {
//   const { db } = ctx;
//   const msg = db.table('messages').insert({ conversationId, senderId, role, content, partial, createdAt: new Date().toISOString() });
//   db.table('conversations').update(conversationId, { lastMessageAt: new Date().toISOString() });
//   return msg;
// }

// Adjust to the server SDK API shape for your Convex version.
