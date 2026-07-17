/**
 * **Ruta** — Chat con la IA (Lovable AI Gateway).
 */
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Menu } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat con tu coach — ENKI LIFE OS" },
      { name: "description", content: "Conversa con tu coach personal de IA. Conoce tu vida y te ayuda a decidir." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const {
    conversations,
    currentId,
    messages,
    streaming,
    error,
    sendMessage,
    newConversation,
    selectConversation,
    deleteConversation,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100dvh-5rem)] md:h-screen w-full overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex">
        <ChatSidebar
          conversations={conversations}
          currentId={currentId}
          onNew={newConversation}
          onSelect={selectConversation}
          onDelete={deleteConversation}
        />
      </div>

      {/* Sidebar móvil (drawer) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-72 max-w-[85%] h-full bg-background" onClick={(e) => e.stopPropagation()}>
            <ChatSidebar
              conversations={conversations}
              currentId={currentId}
              onNew={() => { newConversation(); setSidebarOpen(false); }}
              onSelect={(id) => { selectConversation(id); setSidebarOpen(false); }}
              onDelete={deleteConversation}
            />
          </div>
        </div>
      )}

      {/* Panel principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border flex items-center px-3 gap-2 bg-background/80 backdrop-blur">
          <Link
            to="/"
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Conversaciones"
          >
            <Menu className="w-4 h-4" />
          </button>
          <h1 className="font-display font-bold text-base truncate flex-1">
            {currentId
              ? conversations.find((c) => c.id === currentId)?.title ?? "Chat"
              : "Coach personal"}
          </h1>
        </header>

        <MessageList messages={messages} streaming={streaming} />
        <ChatInput onSend={sendMessage} disabled={streaming} />
      </div>
    </div>
  );
}
