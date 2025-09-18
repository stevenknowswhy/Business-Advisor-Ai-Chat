// Upsert an advisor document by legacyId or create a new one.
// This file targets Convex server functions. Adjust API if your Convex SDK version differs.
export default async function upsertAdvisor(ctx, advisor) {
  const { db } = ctx;
  // Prefer legacyId if present
  if (advisor.legacyId) {
    const found = await db.table('advisors').getIndex('legacyId').get(advisor.legacyId).run();
    if (found) {
      const updated = await db.table('advisors').update(found._id, {
        name: advisor.name,
        persona: advisor.persona,
        modelHint: advisor.modelHint,
        imageUrl: advisor.imageUrl,
        updatedAt: new Date().toISOString()
      });
      return { action: 'updated', doc: updated };
    }
  }
  const inserted = await db.table('advisors').insert({
    legacyId: advisor.legacyId || null,
    ownerId: advisor.ownerId || null,
    name: advisor.name || 'Unnamed Advisor',
    persona: advisor.persona || {},
    modelHint: advisor.modelHint || null,
    imageUrl: advisor.imageUrl || null,
    sourceFile: advisor._sourceFile || null,
    createdAt: new Date().toISOString()
  });
  return { action: 'created', doc: inserted };
}
