/**
 * Capa de **sincronización con Supabase**. Mantiene la API local-first y
 * persiste cambios en la nube de forma transparente.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AppState,
  Habit,
  Task,
  TaskList,
  Tag,
  Note,
  Learning,
  EnergyEntry,
  Priority,
  TaskStatus,
  Recurrence,
  ReminderOffset,
  Subtask,
  NoteType,
  NoteCategory,
  NoteImportance,
  NoteChecklistItem,
  LearningCategory,
} from "./storage-types";

type DBSubtask = { id: string; title: string; done: boolean };
type DBChecklist = { id: string; text: string; done: boolean };

function mapHabit(r: Record<string, unknown>): Habit {
  return {
    id: r.id as string,
    name: r.name as string,
    emoji: (r.emoji as string) ?? "✨",
    points: (r.points as number) ?? 10,
    streak: (r.streak as number) ?? 0,
    lastCompleted: (r.last_completed as string | null) ?? null,
    history: ((r.history as string[]) ?? []) as string[],
    frequency: ((r.frequency as Habit["frequency"]) ?? "daily"),
    targetCount: (r.target_count as number) ?? 1,
  };
}
function mapTaskList(r: Record<string, unknown>): TaskList {
  return {
    id: r.id as string,
    name: r.name as string,
    emoji: r.emoji as string,
    color: r.color as string,
    parentId: (r.parent_id as string) ?? null,
    sortOrder: (r.sort_order as number) ?? undefined,
  };
}
function mapTag(r: Record<string, unknown>): Tag {
  return { id: r.id as string, name: r.name as string, color: r.color as string };
}
function mapTask(r: Record<string, unknown>): Task {
  const remindersRaw = r.reminders;
  const reminders = Array.isArray(remindersRaw)
    ? (remindersRaw as unknown[]).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
    : [];
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? undefined,
    startDate: (r.start_date as string) ?? undefined,
    due: (r.due as string) ?? undefined,
    durationMinutes: (r.duration_minutes as number) ?? undefined,
    priority: (r.priority as Priority) ?? "medium",
    tags: ((r.tags as string[]) ?? []) as string[],
    listId: (r.list_id as string) ?? "",
    status: (r.status as TaskStatus) ?? "pending",
    subtasks: ((r.subtasks as DBSubtask[]) ?? []) as Subtask[],
    reminder: (r.reminder as ReminderOffset) ?? undefined,
    reminders: reminders.length > 0 ? reminders : undefined,
    reminderChannels: Array.isArray(r.reminder_channels)
      ? (r.reminder_channels as string[]).filter((c): c is "push" | "telegram" | "email" | "inapp" =>
          c === "push" || c === "telegram" || c === "email" || c === "inapp")
      : undefined,
    recurrence: (r.recurrence as Recurrence) ?? undefined,
    snoozedUntil: (r.snoozed_until as string) ?? undefined,
    pinned: (r.pinned as boolean) ?? false,
    sortOrder: (r.sort_order as number) ?? undefined,
    attachments: Array.isArray(r.attachments) ? (r.attachments as Task["attachments"]) : undefined,
    comments: Array.isArray(r.comments) ? (r.comments as Task["comments"]) : undefined,
    timeEntries: Array.isArray(r.time_entries) ? (r.time_entries as Task["timeEntries"]) : undefined,
    actualMinutes: (r.actual_minutes as number) ?? undefined,
    xpReward: (r.xp_reward as number) ?? undefined,
    createdAt: r.created_at as string,
    completedAt: (r.completed_at as string) ?? undefined,
  };
}
function mapNote(r: Record<string, unknown>): Note {
  return {
    id: r.id as string,
    title: r.title as string,
    content: (r.content as string) ?? "",
    type: (r.type as NoteType) ?? "note",
    category: (r.category as NoteCategory) ?? "personal",
    tags: ((r.tags as string[]) ?? []) as string[],
    importance: (r.importance as NoteImportance) ?? "normal",
    checklist: ((r.checklist as DBChecklist[]) ?? []) as NoteChecklistItem[],
    linkedNoteIds: ((r.linked_note_ids as string[]) ?? []) as string[],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
function mapLearning(r: Record<string, unknown>): Learning {
  return {
    id: r.id as string,
    title: r.title as string,
    notes: (r.notes as string) ?? "",
    ai_summary: (r.ai_summary as string) ?? undefined,
    category: (r.category as LearningCategory) ?? "other",
    skillId: (r.skill_id as string) ?? undefined,
    date: r.date as string,
  };
}
function mapEnergy(r: Record<string, unknown>): EnergyEntry {
  return {
    date: r.date as string,
    physical: r.physical as number,
    mental: r.mental as number,
    emotional: r.emotional as number,
    sleep: (r.sleep as number) ?? undefined,
    pain: (r.pain as number) ?? undefined,
    notes: (r.notes as string) ?? undefined,
  };
}

export async function loadCloudState(userId: string): Promise<AppState> {
  const [profileR, habitsR, listsR, tagsR, tasksR, notesR, learningsR, energyR] = await Promise.all([
    supabase.from("profiles").select("xp, panda_coins, imported_template_ids, unlocked_skills, custom_skill_categories, enki_mode_enabled").eq("user_id", userId).maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("task_lists").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("tags").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("learnings").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("energy_entries").select("*").eq("user_id", userId).order("date", { ascending: true }),
  ]);

  return {
    xp: (profileR.data as any)?.xp ?? 0,
    pandaCoins: (profileR.data as any)?.panda_coins ?? 0,
    importedTemplateIds: (profileR.data as any)?.imported_template_ids ?? [],
    unlockedSkills: (profileR.data as any)?.unlocked_skills ?? [],
    customSkillCategories: (profileR.data as any)?.custom_skill_categories ?? [],
    enkiModeEnabled: (profileR.data as any)?.enki_mode_enabled ?? true,
    habits: (habitsR.data ?? []).map(mapHabit),
    taskLists: (listsR.data ?? []).map(mapTaskList),
    tags: (tagsR.data ?? []).map(mapTag),
    tasks: (tasksR.data ?? []).map(mapTask),
    notes: (notesR.data ?? []).map(mapNote),
    learnings: (learningsR.data ?? []).map(mapLearning),
    energy: (energyR.data ?? []).map(mapEnergy),
    productivity: { streak: 0, lastCompletedDate: null },
  };
}

// ========== Persistence helpers (fire and forget) ==========
function reportErr(label: string, err: unknown) {
  if (err) console.error(`[cloud:${label}]`, err);
}

export async function pushXp(userId: string, xp: number) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, xp }, { onConflict: "user_id" });
  reportErr("xp", error);
}

export async function pushPandaCoins(userId: string, coins: number) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, panda_coins: coins }, { onConflict: "user_id" });
  reportErr("pandaCoins", error);
}

export async function pushImportedTemplate(userId: string, templateId: string) {
  // Usamos RPC o raw query si TS se queja, pero para corregir el error TS2339 usamos 'as any'
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const currentIds = ((profile as any)?.imported_template_ids as string[]) || [];
  if (currentIds.includes(templateId)) return;

  const { error } = await supabase
    .from("profiles")
    .update({ imported_template_ids: [...currentIds, templateId] } as any)
    .eq("user_id", userId);
  reportErr("import-tpl", error);
}

export async function pushHabit(userId: string, h: Habit) {
  const row = {
    id: h.id,
    user_id: userId,
    name: h.name,
    emoji: h.emoji,
    points: h.points,
    streak: h.streak,
    last_completed: h.lastCompleted,
    history: h.history,
    frequency: h.frequency,
    target_count: h.targetCount,
  };
  const { error } = await supabase.from("habits").upsert(row);
  reportErr("habit", error);
}
export async function deleteHabitCloud(id: string) {
  const { error } = await supabase.from("habits").delete().eq("id", id);
  reportErr("habit-del", error);
}

export async function pushList(userId: string, l: TaskList) {
  const { error } = await supabase
    .from("task_lists")
    .upsert({
      id: l.id,
      user_id: userId,
      name: l.name,
      emoji: l.emoji,
      color: l.color,
      parent_id: l.parentId ?? null,
      sort_order: l.sortOrder ?? null,
    } as never);
  reportErr("list", error);
}
export async function deleteListCloud(id: string) {
  const { error } = await supabase.from("task_lists").delete().eq("id", id);
  reportErr("list-del", error);
}

export async function pushTag(userId: string, t: Tag) {
  const { error } = await supabase
    .from("tags")
    .upsert({ id: t.id, user_id: userId, name: t.name, color: t.color });
  reportErr("tag", error);
}
export async function deleteTagCloud(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  reportErr("tag-del", error);
}

export async function pushTask(userId: string, t: Task) {
  const row = {
    id: t.id,
    user_id: userId,
    title: t.title,
    description: t.description ?? null,
    start_date: t.startDate ?? null,
    due: t.due ?? null,
    duration_minutes: t.durationMinutes ?? null,
    priority: t.priority,
    status: t.status,
    list_id: t.listId || null,
    tags: t.tags,
    subtasks: t.subtasks,
    reminder: t.reminder ?? null,
    reminders: t.reminders ?? [],
    reminder_channels: t.reminderChannels ?? ["push"],
    recurrence: t.recurrence ?? null,
    snoozed_until: t.snoozedUntil ?? null,
    pinned: t.pinned ?? false,
    sort_order: t.sortOrder ?? null,
    xp_reward: t.xpReward ?? null,
    completed_at: t.completedAt ?? null,
    created_at: t.createdAt,
  };
  const { error } = await supabase.from("tasks").upsert(row as never);
  reportErr("task", error);
}
export async function deleteTaskCloud(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  reportErr("task-del", error);
}

export async function pushNote(userId: string, n: Note) {
  const row = {
    id: n.id,
    user_id: userId,
    title: n.title,
    content: n.content,
    type: n.type,
    category: n.category,
    importance: n.importance,
    tags: n.tags,
    checklist: n.checklist,
    linked_note_ids: n.linkedNoteIds,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
  const { error } = await supabase.from("notes").upsert(row);
  reportErr("note", error);
}
export async function deleteNoteCloud(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  reportErr("note-del", error);
}

export async function pushLearning(userId: string, l: Learning) {
  const { error } = await supabase
    .from("learnings")
    .upsert({
      id: l.id,
      user_id: userId,
      title: l.title,
      notes: l.notes,
      ai_summary: l.ai_summary ?? null,
      category: l.category,
      skill_id: l.skillId ?? null,
      date: l.date,
    } as any);
  reportErr("learning", error);
}
export async function deleteLearningCloud(id: string) {
  const { error } = await supabase.from("learnings").delete().eq("id", id);
  reportErr("learning-del", error);
}

export async function pushEnergy(userId: string, e: EnergyEntry) {
  const { error } = await supabase
    .from("energy_entries")
    .upsert(
      {
        user_id: userId,
        date: e.date,
        physical: e.physical,
        mental: e.mental,
        emotional: e.emotional,
        sleep: e.sleep ?? null,
        pain: e.pain ?? null,
        notes: e.notes ?? null,
      },
      { onConflict: "user_id,date" },
    );
  reportErr("energy", error);
}
export async function pushUnlockedSkills(userId: string, skills: string[]) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, unlocked_skills: skills }, { onConflict: "user_id" });
  reportErr("unlockedSkills", error);
}
