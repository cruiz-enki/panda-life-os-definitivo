/**
 * Tipos del motor de notificaciones tipo Duolingo.
 */

export type ModuleKey =
  | "learning"
  | "home"
  | "money"
  | "health"
  | "goals"
  | "journal"
  | "relationship"
  | "habits"
  | "identity";

export type StreakStatus = "active" | "at_risk" | "frozen" | "lost";

export type NotificationType =
  | "reminder"
  | "streak"
  | "streak_at_risk"
  | "streak_saved"
  | "quest"
  | "insight"
  | "reward"
  | "warning"
  | "future_self"
  | "recovery"
  | "momentum";

export type NotificationTone =
  | "friendly"
  | "funny"
  | "emotional"
  | "serious"
  | "epic"
  | "panda";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "cancelled"
  | "skipped";

export type NotificationEventType =
  | "sent"
  | "opened"
  | "dismissed"
  | "failed"
  | "clicked";

export type Streak = {
  id: string;
  user_id: string;
  module_key: ModuleKey;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  streak_status: StreakStatus;
  freeze_days_available: number;
  created_at: string;
  updated_at: string;
};

export type NotificationTemplate = {
  id: string;
  module_key: string;
  notification_type: NotificationType;
  tone: NotificationTone;
  title: string;
  body: string;
  trigger_condition: string | null;
  priority: number;
  deep_link: string | null;
  is_active: boolean;
  created_at: string;
};

export type NotificationQueueRow = {
  id: string;
  user_id: string;
  module_key: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  tone: NotificationTone | null;
  priority: number;
  deep_link: string | null;
  scheduled_for: string;
  sent_at: string | null;
  status: NotificationStatus;
  onesignal_response: Record<string, unknown> | null;
  error_message: string | null;
  dedupe_key: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationEvent = {
  id: string;
  user_id: string;
  notification_id: string | null;
  event_type: NotificationEventType;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  learning: "Aprendizaje",
  home: "Casa",
  money: "Dinero",
  health: "Salud",
  goals: "Metas",
  journal: "Journal",
  relationship: "Relaciones",
  habits: "Hábitos",
  identity: "Identidad",
};

export const MODULE_EMOJI: Record<ModuleKey, string> = {
  learning: "📚",
  home: "🏠",
  money: "💰",
  health: "💪",
  goals: "🎯",
  journal: "✍️",
  relationship: "💞",
  habits: "🔁",
  identity: "👑",
};

export const STREAK_STATUS_LABEL: Record<StreakStatus, string> = {
  active: "Activa",
  at_risk: "En riesgo",
  frozen: "Protegida",
  lost: "Perdida",
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  reminder: "Recordatorio",
  streak: "Racha",
  streak_at_risk: "Racha en riesgo",
  streak_saved: "Racha salvada",
  quest: "Misión",
  insight: "Insight",
  reward: "Recompensa",
  warning: "Aviso",
  future_self: "Yo del futuro",
  recovery: "Vuelve",
  momentum: "Momentum",
};
