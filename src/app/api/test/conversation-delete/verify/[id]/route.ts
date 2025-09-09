/**
 * Conversation Delete Test - Verify Deletion
 * Checks that no orphaned records remain after deletion
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ success: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  try {
    const { id: conversationId } = await params;

    const [conv, messages, summaries, memories] = await Promise.all([
      db.conversation.findUnique({ where: { id: conversationId }, select: { id: true, userId: true } }),
      db.message.count({ where: { conversationId } }),
      db.threadSummary.count({ where: { conversationId } }),
      db.advisorMemory.count({ where: { conversationId } }),
    ]);

    // If conversation still exists, check ownership for clarity
    if (conv && conv.userId !== userId) {
      return Response.json({ success: false, error: 'UNAUTHORIZED' }, { status: 403 });
    }

    return Response.json(
      {
        success: true,
        exists: !!conv,
        counts: { messages, summaries, memories },
        conversationId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('VERIFY_ERROR', { message: error?.message, code: error?.code, meta: error?.meta });
    return Response.json(
      {
        success: false,
        error: 'VERIFY_FAILED',
        details: { message: error?.message, code: error?.code },
      },
      { status: 500 }
    );
  }
}
