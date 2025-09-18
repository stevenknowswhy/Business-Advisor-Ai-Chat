import { PrismaClient } from '@prisma/client';
import { DELETE as deleteConversationHandler } from '@/app/api/conversations/[id]/route';

const db = new PrismaClient();

// Helpers to control Clerk mocks per test
jest.mock('@clerk/nextjs/server', () => require('./mocks/clerk'));
const { auth, currentUser } = jest.requireMock('@clerk/nextjs/server');

async function createConversationGraph(userId: string) {
  // Ensure user exists (FK requirement)
  await db.user.upsert({
    where: { id: userId },
    update: { name: 'Test User', email: `${userId}@example.com` },
    create: { id: userId, name: 'Test User', email: `${userId}@example.com`, plan: 'free' },
  });

  // Ensure an advisor exists
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

  const conversation = await db.conversation.create({
    data: {
      title: `TEST_CONV_${Date.now()}`,
      userId,
      activeAdvisorId: advisor.id,
    },
  });

  await db.$transaction([
    ...Array.from({ length: 5 }).map((_, i) =>
      db.message.create({
        data: {
          conversationId: conversation.id,
          sender: i % 2 === 0 ? 'user' : 'advisor',
          advisorId: i % 2 === 0 ? null : advisor.id,
          content: `TEST_MESSAGE_${i}_${Date.now()}`,
        },
      })
    ),
    ...Array.from({ length: 2 }).map((_, i) =>
      db.threadSummary.create({
        data: {
          conversationId: conversation.id,
          content: `TEST_SUMMARY_${i}_${Date.now()}`,
        },
      })
    ),
    ...Array.from({ length: 3 }).map((_, i) =>
      db.advisorMemory.create({
        data: {
          conversationId: conversation.id,
          advisorId: advisor.id,
          key: `TEST_MEMORY_${i}`,
          value: { any: `value_${i}` },
        },
      })
    ),
  ]);

  return conversation;
}

function makeReq(url: string, method = 'DELETE') {
  return new Request(url, { method });
}

describe('Conversation deletion API', () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  test('deletes conversation with dependents (204)', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: 'user_A' });
    (currentUser as jest.Mock).mockResolvedValueOnce({
      id: 'user_A',
      fullName: 'User A',
      imageUrl: '',
      emailAddresses: [{ emailAddress: 'usera@example.com' }],
    });

    const conv = await createConversationGraph('user_A');

    const res = await deleteConversationHandler(
      makeReq(`http://localhost/api/conversations/${conv.id}`),
      { params: Promise.resolve({ id: conv.id }) }
    );

    expect(res.status).toBe(204);

    const [stillConv, msgCount, sumCount, memCount] = await Promise.all([
      db.conversation.findUnique({ where: { id: conv.id } }),
      db.message.count({ where: { conversationId: conv.id } }),
      db.threadSummary.count({ where: { conversationId: conv.id } }),
      db.advisorMemory.count({ where: { conversationId: conv.id } }),
    ]);

    expect(stillConv).toBeNull();
    expect(msgCount).toBe(0);
    expect(sumCount).toBe(0);
    expect(memCount).toBe(0);
  });

  test('non-existent conversation returns 404', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: 'user_B' });
    (currentUser as jest.Mock).mockResolvedValueOnce({
      id: 'user_B',
      fullName: 'User B',
      imageUrl: '',
      emailAddresses: [{ emailAddress: 'userb@example.com' }],
    });

    // Use an ID that passes format check but doesn't exist
    const fakeId = 'cm_nonexistent_0000000000000';
    const res = await deleteConversationHandler(
      makeReq(`http://localhost/api/conversations/${fakeId}`),
      { params: Promise.resolve({ id: fakeId }) }
    );
    expect([404]).toContain(res.status);
  });

  test('unauthorized user returns 403', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: 'user_C' });
    (currentUser as jest.Mock).mockResolvedValueOnce({
      id: 'user_C',
      fullName: 'User C',
      imageUrl: '',
      emailAddresses: [{ emailAddress: 'userc@example.com' }],
    });

    const conv = await createConversationGraph('user_D'); // different owner

    const res = await deleteConversationHandler(
      makeReq(`http://localhost/api/conversations/${conv.id}`),
      { params: Promise.resolve({ id: conv.id }) }
    );
    expect(res.status).toBe(403);

    // cleanup as owner so DB doesn’t accumulate test data
    (auth as jest.Mock).mockResolvedValueOnce({ userId: 'user_D' });
    (currentUser as jest.Mock).mockResolvedValueOnce({
      id: 'user_D', fullName: 'User D', imageUrl: '', emailAddresses: [{ emailAddress: 'userd@example.com' }]
    });
    await deleteConversationHandler(
      makeReq(`http://localhost/api/conversations/${conv.id}`),
      { params: Promise.resolve({ id: conv.id }) }
    );
  });

  test('unauthenticated returns 401', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const validLookingId = 'cm_valid_like_id_1234567890';
    const res = await deleteConversationHandler(
      makeReq(`http://localhost/api/conversations/${validLookingId}`),
      { params: Promise.resolve({ id: validLookingId }) }
    );

    expect(res.status).toBe(401);
  });
});

