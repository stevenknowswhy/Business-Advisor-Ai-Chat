// Minimal example of calling listMy* queries using Convex React client.
// Assumes your app is wrapped with <ConvexProvider client={convex}> and Clerk auth is configured.
// This component demonstrates:
// - Ensuring a user row exists via users:ensureCurrentUser
// - Listing current user's advisors and conversations
// - Listing messages for a selected conversation

import React from "react";
import { useQuery, useMutation } from "convex/react";

export default function ConvexMyDataExample() {
  const ensureCurrentUser = useMutation("users:ensureCurrentUser");

  React.useEffect(() => {
    // Best-effort ensure; ignores errors if unauthenticated
    ensureCurrentUser({}).catch(() => {});
  }, [ensureCurrentUser]);

  const advisors = useQuery("advisors:listMyAdvisors", {});
  const conversations = useQuery("conversations:listMyConversations", {});

  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const messages = useQuery(
    "messages:listMyMessagesForConversation",
    conversationId ? { conversationId } : ("skip" as any) // skip until selected
  );

  return (
    <div className="space-y-4">
      <section>
        <h2 className="font-semibold">My Advisors</h2>
        {advisors === undefined ? (
          <div>Loading…</div>
        ) : (
          <ul className="list-disc pl-6">
            {advisors?.map((a: any) => (
              <li key={a._id}>{a.name ?? a.personaName ?? a.legacyId ?? a._id}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">My Conversations</h2>
        {conversations === undefined ? (
          <div>Loading…</div>
        ) : (
          <ul className="list-disc pl-6">
            {conversations?.map((c: any) => (
              <li key={c._id}>
                <button
                  className="underline"
                  onClick={() => setConversationId(c._id)}
                  title="View messages"
                >
                  {c.title || c._id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Messages</h2>
        {!conversationId ? (
          <div>Select a conversation</div>
        ) : messages === undefined ? (
          <div>Loading…</div>
        ) : (
          <ol className="list-decimal pl-6">
            {messages?.map((m: any) => (
              <li key={m._id}>{m.content}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

