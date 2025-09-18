#!/usr/bin/env node
import convexClient from './convexClient.js';

async function run() {
  await convexClient.init();
  console.log('Running streaming fallback simulation (writes partial tokens)');

  // Create a conversation to write into
  const conv = await convexClient.createConversation('sim_user_1', { title: 'Streaming test', advisorIds: [] });
  console.log('Conversation created:', conv.id || conv);

  // Simulate token-by-token streaming for assistant response
  const assistantId = 'conv_assistant_streamer';
  const tokens = ['Hello', ',', ' I', ' am', ' your', ' assistant', '.'];

  let accumulated = '';
  for (let i = 0; i < tokens.length; i++) {
    accumulated += tokens[i];
    const partial = i < tokens.length - 1;
    const msg = await convexClient.appendMessage({ conversationId: conv.id || conv, senderId: assistantId, role: 'assistant', content: accumulated, partial });
    console.log('Wrote partial:', msg.id, 'partial=', partial, 'content="' + msg.content + '"');
    // small delay to simulate streaming
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('Streaming simulation complete. Messages:');
  const msgs = await convexClient.listMessages(conv.id || conv);
  console.log(msgs.map(m => ({ id: m.id, partial: m.partial, content: m.content })));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
