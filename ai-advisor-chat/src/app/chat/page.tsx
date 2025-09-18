import { ChatInterface } from "~/components/chat/ChatInterface";
import { SidebarProvider } from "~/contexts/SidebarContext";

export default function ChatPage() {
  return (
    <div className="h-screen bg-gray-50">
      <SidebarProvider>
        <ChatInterface />
      </SidebarProvider>
    </div>
  );
}

export const metadata = {
  title: "AI Advisor Chat",
  description: "Chat with your AI advisory board",
};
