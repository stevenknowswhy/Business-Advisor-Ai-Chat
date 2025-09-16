import { ConvexChatInterface } from "~/components/chat/ConvexChatInterface";
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
// Updated to fix blank screen issue

export default function ChatPage() {
  return (
    <div className="h-screen bg-gray-50">
      <ErrorBoundary>
        <ConvexChatInterface />
      </ErrorBoundary>
    </div>
  );
}

export const metadata = {
  title: "AI Advisor Chat",
  description: "Chat with your AI advisory board",
};
