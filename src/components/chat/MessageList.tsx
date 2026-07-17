/**
 * **Componente** — Lista de mensajes del chat con auto-scroll y render markdown del assistant.
 */
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/lib/chat-types";

export function MessageList({
  messages,
  streaming,
}: {
  messages: ChatMessage[];
  streaming: boolean;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Tu coach personal</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Te conoce. Sabe tus tareas, hábitos, energía y finanzas. Pregúntale lo que sea.
          </p>
          <div className="grid gap-2 text-left">
            {[
              "¿Qué debería priorizar hoy?",
              "¿Por qué crees que mi energía bajó esta semana?",
              "Ayúdame a replantear mi mes",
              "¿Estoy alineado con mi identidad?",
            ].map((s) => (
              <div
                key={s}
                className="px-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-muted-foreground"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                  isUser
                    ? "bg-secondary text-foreground"
                    : "bg-gradient-primary text-primary-foreground shadow-glow"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div
                className={`min-w-0 max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                  isUser
                    ? "bg-primary/15 text-foreground rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm"
                }`}
              >
                {m.content ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex gap-1 items-center py-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
