/**
 * **Componente** — Sidebar del chat: lista de conversaciones + crear/borrar/seleccionar.
 */
import { Plus, Trash2, MessageSquare } from "lucide-react";
import type { ChatConversation } from "@/lib/chat-types";

export function ChatSidebar({
  conversations,
  currentId,
  onNew,
  onSelect,
  onDelete,
}: {
  conversations: ChatConversation[];
  currentId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex flex-col w-full md:w-72 shrink-0 border-r border-border bg-card/40 h-full">
      <div className="p-3 border-b border-border">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {conversations.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8 px-3">
            Aún no tienes conversaciones. Empieza una nueva.
          </div>
        )}
        {conversations.map((c) => {
          const active = c.id === currentId;
          return (
            <div
              key={c.id}
              className={`group flex items-center gap-2 rounded-lg transition-colors ${
                active ? "bg-primary/15 text-primary" : "hover:bg-secondary/60 text-foreground"
              }`}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-left text-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.title}</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("¿Borrar esta conversación?")) onDelete(c.id);
                }}
                className="px-2 py-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                aria-label="Borrar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
