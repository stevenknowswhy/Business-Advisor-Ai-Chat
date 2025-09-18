/**
 * Conversation Delete Test - Cascade-only Deletion
 * Deletes a conversation using a single conversation.delete() call to validate DB-level cascades
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return Response.json({ success: false, error: 'AUTH_REQUIRED' }, { status: 401 });

  try {
    const { id: conversationId } = await params;

    // Ownership check first
    const conv = await db.conversation.findUnique({ select: { id: true, userId: true }, where: { id: conversationId } });
    if (!conv) return Response.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
    if (conv.userId !== userId) return Response.json({ success: false, error: 'UNAUTHORIZED' }, { status: 403 });

    // Single delete to validate onDelete: Cascade
    await db.conversation.delete({ where: { id: conversationId } });

    return Response.json(
      { success: true, message: 'Cascade deletion executed', conversationId, duration: Date.now() - start },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: 'CASCADE_DELETE_FAILED',
        details: { message: error?.message, code: error?.code, meta: error?.meta },
      },
      { status: 500 }
    );
  }
}

