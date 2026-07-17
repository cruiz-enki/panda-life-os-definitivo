/**
 * Tipos del **chat con IA** (rol, mensaje, conversación).
 */
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

export type ChatConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};
