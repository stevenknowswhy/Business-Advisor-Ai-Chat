#!/usr/bin/env node
import { createConversationAction, appendMessageAction, listMessagesAction } from './actions.js';

async function run() {
  console.log('Running Convex prototype tests...');

  const ownerClerkId = 'clerk_user_123';
  const { success, conversation } = await createConversationAction({ ownerClerkId, title: 'Prototype conv', advisorIds: [] });
  if (!success) throw new Error('createConversationAction failed');

  console.log('Created conversation:', conversation.id);

  const append1 = await appendMessageAction({ conversationId: conversation.id, senderId: conversation.ownerId, role: 'user', content: 'Hello advisor', partial: false });
  if (!append1.success) throw new Error('appendMessageAction failed (1)');

  const append2 = await appendMessageAction({ conversationId: conversation.id, senderId: 'conv_assistant_1', role: 'assistant', content: 'Hi, I am your advisor', partial: false });
  if (!append2.success) throw new Error('appendMessageAction failed (2)');

  const msgs = await listMessagesAction({ conversationId: conversation.id });
  console.log('Messages for conversation:', msgs.map(m => ({ id: m.id, role: m.role, content: m.content })));

  console.log('All tests passed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
