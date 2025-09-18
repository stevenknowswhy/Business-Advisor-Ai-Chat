// Convex server-side action (example) - place in Convex functions folder
// This is an example using the Convex JS SDK (server-side functions) API

// export default function upsertAdvisor(ctx, advisor) {
//   const { db } = ctx;
//   // upsert by legacyId if present, else create new doc
//   if (advisor.legacyId) {
//     const existing = db.table('advisors').getIndex('legacyId').get(advisor.legacyId);
//     if (existing) {
//       return db.table('advisors').update(existing._id, {
//         name: advisor.name,
//         persona: advisor.persona,
//         modelHint: advisor.modelHint,
//         imageUrl: advisor.imageUrl,
//         updatedAt: new Date().toISOString()
//       });
//     }
//   }
//   return db.table('advisors').insert({
//     legacyId: advisor.legacyId || null,
//     ownerId: advisor.ownerId || null,
//     name: advisor.name || 'Unnamed Advisor',
//     persona: advisor.persona || {},
//     modelHint: advisor.modelHint || null,
//     imageUrl: advisor.imageUrl || null,
//     createdAt: new Date().toISOString()
//   });
// }

// Note: The exact Convex server API (db.*) depends on the Convex SDK version. Adjust accordingly.
