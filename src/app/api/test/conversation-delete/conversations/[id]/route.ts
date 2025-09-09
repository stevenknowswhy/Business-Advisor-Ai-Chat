/**
 * Conversation Delete Test - Transactional Deletion
 * Deletes a conversation and its dependents in a single transaction
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export async function DELETE(
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
    if (!conversationId || conversationId.length < 10) {
      return Response.json({ success: false, error: 'INVALID_ID' }, { status: 400 });
    }

    // Ensure the conversation belongs to the user
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, title: true },
    });
    if (!conversation) {
      return Response.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
    }
    if (conversation.userId !== userId) {
      return Response.json({ success: false, error: 'UNAUTHORIZED' }, { status: 403 });
    }

    // Transactional deletion: delete children first then the conversation
    console.log('TX_DELETE_START', { conversationId });
    await db.$transaction([
      db.message.deleteMany({ where: { conversationId } }),
      db.threadSummary.deleteMany({ where: { conversationId } }),
      db.advisorMemory.deleteMany({ where: { conversationId } }),
      db.conversation.delete({ where: { id: conversationId } }),
    ]);
    console.log('TX_DELETE_SUCCESS', { conversationId });

    return Response.json(
      {
        success: true,
        message: 'Conversation and dependents deleted',
        conversationId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Detailed Prisma error logging
    console.error('TX_DELETE_ERROR', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      name: error?.constructor?.name,
    });

    // Map Prisma error codes for clarity
    let status = 500;
    let err = 'DELETE_FAILED';
    if (error?.code === 'P2003') {
      err = 'FOREIGN_KEY_CONSTRAINT';
    } else if (error?.code === 'P2025') {
      err = 'RECORD_NOT_FOUND';
      status = 404;
    }

    return Response.json(
      {
        success: false,
        error: err,
        details: {
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      },
      { status }
    );
  }
}
