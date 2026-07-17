/**
 * Hook del **chat con IA**: conversaciones, mensajes y streaming SSE
 * desde la edge function `ai-chat`. Conversaciones y mensajes se cachean
 * con TanStack Query; el streaming actualiza la caché incrementalmente.
 */
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ChatConversation, ChatMessage } from "../lib/chat-types";

/**
 * Hook principal del chat. Expone conversaciones, mensajes de la
 * actual, estado de streaming, error, y acciones para enviar,
 * seleccionar, crear o borrar conversaciones.
 */
export function useChat() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      return (data ?? []) as ChatConversation[];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", currentId],
    enabled: !!currentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", currentId!)
        .order("created_at", { ascending: true });
      return (data ?? []) as ChatMessage[];
    },
  });

  const setMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      if (!currentId) return;
      qc.setQueryData<ChatMessage[]>(["chat-messages", currentId], (prev) =>
        updater(prev ?? []),
      );
    },
    [qc, currentId],
  );

  const newConversation = useCallback(() => {
    setCurrentId(null);
    setError(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
    setError(null);
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      await supabase.from("chat_conversations").delete().eq("id", id);
      if (currentId === id) newConversation();
      qc.invalidateQueries({ queryKey: ["chat-conversations", userId] });
    },
    [currentId, newConversation, qc, userId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !text.trim() || streaming) return;
      setError(null);
      setStreaming(true);

      let convId = currentId;
      try {
        if (!convId) {
          const title = text.slice(0, 60);
          const { data: convData, error: convErr } = await supabase
            .from("chat_conversations")
            .insert({ user_id: user.id, title })
            .select()
            .single();
          if (convErr) throw convErr;
          convId = convData.id;
          setCurrentId(convId);
          qc.setQueryData<ChatConversation[]>(
            ["chat-conversations", userId],
            (prev) => [convData as ChatConversation, ...(prev ?? [])],
          );
          qc.setQueryData<ChatMessage[]>(["chat-messages", convId], []);
        }

        const { data: userMsg, error: msgErr } = await supabase
          .from("chat_messages")
          .insert({ conversation_id: convId, role: "user", content: text })
          .select()
          .single();
        if (msgErr) throw msgErr;
        qc.setQueryData<ChatMessage[]>(["chat-messages", convId], (prev) => [
          ...(prev ?? []),
          userMsg as ChatMessage,
        ]);

        const tempId = `temp-${Date.now()}`;
        const placeholder: ChatMessage = {
          id: tempId,
          conversation_id: convId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<ChatMessage[]>(["chat-messages", convId], (prev) => [
          ...(prev ?? []),
          placeholder,
        ]);

        const history = [...messages, userMsg as ChatMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: history, userId: user.id }),
        });

        if (!resp.ok || !resp.body) {
          let msg = "Error al contactar la IA";
          try {
            const j = await resp.json();
            if (j?.error) msg = j.error;
          } catch {
            /* noop */
          }
          if (resp.status === 429) msg = "Demasiadas solicitudes. Espera un momento.";
          if (resp.status === 402) msg = "Sin créditos de IA disponibles.";
          throw new Error(msg);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        let done = false;

        const updateAssistant = (txt: string) => {
          qc.setQueryData<ChatMessage[]>(["chat-messages", convId!], (prev) =>
            (prev ?? []).map((m) => (m.id === tempId ? { ...m, content: txt } : m)),
          );
        };

        while (!done) {
          const { done: rDone, value } = await reader.read();
          if (rDone) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || !line.trim()) continue;
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantText += delta;
                updateAssistant(assistantText);
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        if (assistantText.trim()) {
          const { data: savedMsg } = await supabase
            .from("chat_messages")
            .insert({
              conversation_id: convId,
              role: "assistant",
              content: assistantText,
            })
            .select()
            .single();
          if (savedMsg) {
            qc.setQueryData<ChatMessage[]>(["chat-messages", convId], (prev) =>
              (prev ?? []).map((m) => (m.id === tempId ? (savedMsg as ChatMessage) : m)),
            );
          }
          await supabase
            .from("chat_conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId);
          qc.invalidateQueries({ queryKey: ["chat-conversations", userId] });
        } else {
          qc.setQueryData<ChatMessage[]>(["chat-messages", convId], (prev) =>
            (prev ?? []).filter((m) => m.id !== tempId),
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setError(msg);
        if (convId) {
          qc.setQueryData<ChatMessage[]>(["chat-messages", convId], (prev) =>
            (prev ?? []).filter((m) => !(m.id.startsWith("temp-") && !m.content)),
          );
        }
      } finally {
        setStreaming(false);
      }
    },
    [user, userId, currentId, messages, streaming, qc],
  );

  return {
    conversations,
    currentId,
    messages,
    streaming,
    error,
    sendMessage,
    newConversation,
    selectConversation,
    deleteConversation,
  };
}
