import { ChatInterface } from "~/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="h-screen bg-gray-50">
      <ChatInterface />
    </div>
  );
}

export const metadata = {
  title: "AI Advisor Chat",
  description: "Chat with your AI advisory board",
};
