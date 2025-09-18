/**
 * Conversation Delete Test - Create Data
 * Creates a conversation with dependent records (messages, summaries, memories) for the current user
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth, currentUser } from '@clerk/nextjs/server';

const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('User not authenticated');
  const cu = await currentUser();
  if (!cu) throw new Error('User details not found');
  const user = await db.user.upsert({
    where: { id: userId },
    update: {
      email: cu.emailAddresses[0]?.emailAddress || null,
      name: cu.fullName || null,
      image: cu.imageUrl || null,
    },
    create: {
      id: userId,
      email: cu.emailAddresses[0]?.emailAddress || null,
      name: cu.fullName || null,
      image: cu.imageUrl || null,
      plan: 'free',
    },
  });
  return user;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireUser();

    // Ensure we have at least one Advisor to attach memories/messages to
    let advisor = await db.advisor.findFirst();
    if (!advisor) {
      advisor = await db.advisor.create({
        data: {
          id: `test-advisor-${Date.now()}`,
          schemaVersion: 'v1',
          persona: { name: 'Test Advisor' },
          components: {},
          metadata: { source: 'test' },
          tags: ['test'],
          modelHint: 'gpt-4o-mini',
          status: 'active',
        },
      });
    }

    // Create conversation for this user
    const conversation = await db.conversation.create({
      data: {
        title: `DELETE_TEST_CONV_${Date.now()}`,
        userId: user.id,
        activeAdvisorId: advisor.id,
      },
    });

    // Create messages
    const messages = await db.$transaction(
      Array.from({ length: 5 }).map((_, i) =>
        db.message.create({
          data: {
            conversationId: conversation.id,
            sender: i % 2 === 0 ? 'user' : 'advisor',
            advisorId: i % 2 === 0 ? null : advisor.id,
            content: `DELETE_TEST_MESSAGE_${i}_${Date.now()}`,
          },
        })
      )
    );

    // Create summaries
    const summaries = await db.$transaction(
      Array.from({ length: 2 }).map((_, i) =>
        db.threadSummary.create({
          data: {
            conversationId: conversation.id,
            content: `DELETE_TEST_SUMMARY_${i}_${Date.now()}`,
          },
        })
      )
    );

    // Create advisor memories
    const memories = await db.$transaction(
      Array.from({ length: 3 }).map((_, i) =>
        db.advisorMemory.create({
          data: {
            conversationId: conversation.id,
            advisorId: advisor.id,
            key: `TEST_MEMORY_${i}`,
            value: { note: `Memory ${i} created at ${new Date().toISOString()}` },
          },
        })
      )
    );

    return Response.json(
      {
        success: true,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt.toISOString(),
        },
        counts: {
          messages: messages.length,
          summaries: summaries.length,
          memories: memories.length,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('CREATE_DATA_ERROR', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return Response.json(
      {
        success: false,
        error: 'CREATE_DATA_FAILED',
        details: { message: error?.message, code: error?.code },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      },
      { status: 500 }
    );
  }
}
