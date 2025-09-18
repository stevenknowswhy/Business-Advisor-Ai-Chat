Subscription demo (frontend)

This file describes a minimal approach to subscribing to conversation messages from the frontend using the Convex SDK (adapt to your SDK version).

1. Convex server-side function `listMessagesForConversation(conversationId)` should return an ordered list of messages for a conversation.

2. Create a client subscription in the frontend that listens to `listMessagesForConversation` with the conversationId as the parameter. SDK example pseudocode:

```js
import { ConvexReactClient } from 'convex/react';
const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function useConversationMessages(conversationId) {
  return client.useQuery('listMessagesForConversation', [conversationId]);
}
```

3. For streaming partial updates, the server can either:

- Emit partial message documents with `partial=true` and the frontend assembles them by message id.

- Or the server can write incremental token updates to a single message document (update content field) and the subscription will receive updates.

4. Handle deduplication & ordering on the client. Prefer using `createdAt` and `partial` flag.

Notes:

- Subscription semantics and naming depend on the Convex SDK version; adapt the code accordingly.
- If using the Node streaming fallback, it should write partial messages via the same `appendMessage` Convex action so subscriptions receive updates consistently.
