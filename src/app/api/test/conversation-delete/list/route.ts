/**
 * Conversation Delete Test - List My Test Conversations
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function GET(req: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ success: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  try {
    const conversations = await db.conversation.findMany({
      where: {
        userId,
        title: { contains: 'DELETE_TEST_CONV_' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, createdAt: true },
    });

    return Response.json(
      {
        success: true,
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt.toISOString(),
        })),
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('LIST_ERROR', { message: error?.message, code: error?.code, meta: error?.meta });
    return Response.json(
      {
        success: false,
        error: 'LIST_FAILED',
        details: { message: error?.message, code: error?.code },
      },
      { status: 500 }
    );
  }
}
