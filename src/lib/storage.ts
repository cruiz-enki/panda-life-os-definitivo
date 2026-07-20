/**
 * **Estado de la app: local-first con sync a Lovable Cloud**.
 *
 * Expone `useAppState`, helpers de gamificación (XP por tarea, nivel,
 * recomendaciones), helpers de recurrencia, prioridad, energía media y
 * utilidades de notas relacionadas.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { todayCDMX, daysAgoCDMX } from "./date-utils";
import {
  loadCloudState,
  pushXp,
  pushPandaCoins,
  pushHabit,
  deleteHabitCloud,
  pushList,
  deleteListCloud,
  pushTag,
  deleteTagCloud,
  pushTask,
  deleteTaskCloud,
  pushNote,
  deleteNoteCloud,
  pushLearning,
  deleteLearningCloud,
  pushEnergy,
  pushImportedTemplate,
  pushUnlockedSkills,
} from "./cloud-sync";
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
  Subtask,
  NoteType,
  NoteCategory,
  NoteImportance,
  NoteChecklistItem,
  DailyWin,
  Category,
  SubCategory,
  Skill,
  ReminderOffset,
  ProductivityStats,
  LearningCategory,
  RecurrenceFrequency,
} from "./storage-types";

export type {
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
  Subtask,
  NoteType,
  NoteCategory,
  NoteImportance,
  NoteChecklistItem,
  ReminderOffset,
  ProductivityStats,
  LearningCategory,
  RecurrenceFrequency,
  Category,
  SubCategory,
  Skill,
} from "./storage-types";
import { resolveHashtags, mergeTagIds } from "./hashtags";

const STORAGE_KEY = "pandas-life-os-v2";

const emptyState: AppState = {
  xp: 0,
  pandaCoins: 0,
  habits: [],
  learnings: [],
  energy: [],
  taskLists: [],
  tags: [],
  tasks: [],
  notes: [],
  productivity: { streak: 0, lastCompletedDate: null },
  importedTemplateIds: [],
  dailyWins: [],
  unlockedSkills: [],
  enkiModeEnabled: true,
};

const defaultSeed = (): { lists: TaskList[]; tags: Tag[]; habits: Habit[] } => ({
  lists: [
    { id: crypto.randomUUID(), name: "Inbox", emoji: "📥", color: "oklch(0.78 0.05 250)" },
    { id: crypto.randomUUID(), name: "Trabajo", emoji: "💼", color: "oklch(0.78 0.18 150)" },
    { id: crypto.randomUUID(), name: "Personal", emoji: "🌱", color: "oklch(0.75 0.2 50)" },
    { id: crypto.randomUUID(), name: "Clientes", emoji: "🤝", color: "oklch(0.7 0.18 220)" },
  ],
  tags: [
    { id: crypto.randomUUID(), name: "urgente", color: "oklch(0.65 0.22 25)" },
    { id: crypto.randomUUID(), name: "dinero", color: "oklch(0.82 0.17 90)" },
    { id: crypto.randomUUID(), name: "cliente", color: "oklch(0.75 0.2 50)" },
  ],
  habits: [
    { id: crypto.randomUUID(), name: "Meditar 10 min", emoji: "🧘", points: 15, streak: 0, lastCompleted: null, history: [], frequency: "daily", targetCount: 1 },
    { id: crypto.randomUUID(), name: "Ejercicio", emoji: "💪", points: 25, streak: 0, lastCompleted: null, history: [], frequency: "weekly", targetCount: 3 },
    { id: crypto.randomUUID(), name: "Beber 2L de agua", emoji: "💧", points: 10, streak: 0, lastCompleted: null, history: [], frequency: "daily", targetCount: 1 },
  ],
});

// ===== Estado en memoria =====
let memoryState: AppState = emptyState;
let currentUserId: string | null = null;
let cloudReady = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

// Persistencia debounced + ociosa: evita JSON.stringify + localStorage en cada mutación.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistIdleHandle: number | null = null;

function flushPersist() {
  persistTimer = null;
  persistIdleHandle = null;
  if (typeof window === "undefined" || !currentUserId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY}:${currentUserId}`, JSON.stringify(memoryState));
  } catch { /* noop */ }
}

function persistLocal() {
  if (typeof window === "undefined" || !currentUserId) return;
  // Coalesce ráfagas: una sola escritura cada ~250ms o en el próximo idle.
  if (persistTimer != null || persistIdleHandle != null) return;
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) {
    persistIdleHandle = ric(flushPersist, { timeout: 500 });
  } else {
    persistTimer = setTimeout(flushPersist, 250);
  }
}

// Asegurar flush antes de cerrar/recargar la pestaña.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPersist);
  window.addEventListener("beforeunload", flushPersist);
}


function loadLocal(userId: string): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    return raw ? { ...emptyState, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function setState(updater: (s: AppState) => AppState) {
  memoryState = updater(memoryState);
  persistLocal();
  emit();
}

async function ensureSeed(userId: string) {
  // Si la cuenta está vacía, sembrar datos iniciales
  if (memoryState.taskLists.length > 0 || memoryState.habits.length > 0) return;
  const seed = defaultSeed();
  memoryState = { ...memoryState, taskLists: seed.lists, tags: seed.tags, habits: seed.habits };
  persistLocal();
  emit();
  await Promise.all([
    ...seed.lists.map((l) => pushList(userId, l)),
    ...seed.tags.map((t) => pushTag(userId, t)),
    ...seed.habits.map((h) => pushHabit(userId, h)),
  ]);
}

async function bootstrap(userId: string) {
  currentUserId = userId;
  cloudReady = false;
  // 1) Cache local instantáneo
  const cached = loadLocal(userId);
  if (cached) { memoryState = cached; emit(); }
  // 2) Cargar de la nube
  try {
    const cloud = await loadCloudState(userId);
    memoryState = cloud;
    cloudReady = true;
    persistLocal();
    emit();
    await ensureSeed(userId);
  } catch (e) {
    console.error("[cloud:load]", e);
  }
}

function reset() {
  currentUserId = null;
  cloudReady = false;
  memoryState = emptyState;
  emit();
}

// Suscripción global a cambios de auth
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) bootstrap(data.session.user.id);
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.user) {
      if (session.user.id !== currentUserId) bootstrap(session.user.id);
    } else {
      reset();
    }
  });
}

// ===== Hook público =====
/**
 * Hook **principal** del estado de la app. Local-first con sync a la nube.
 * Expone `state` y dispatcher para todas las acciones de dominio.
 */
export function useAppState() {
  const markTemplateImported = useCallback((templateId: string) => {
    if (!currentUserId) return;
    setState((s) => ({
      ...s,
      importedTemplateIds: Array.from(new Set([...(s.importedTemplateIds || []), templateId])),
    }));
    pushImportedTemplate(currentUserId, templateId);
  }, []);

  const addDailyWin = useCallback((content: string, feeling?: string) => {
    if (!currentUserId) return;
    const win: DailyWin = {
      id: crypto.randomUUID(),
      date: todayCDMX(),
      content,
      feeling,
      xpRewarded: true
    };
    setState(s => ({
      ...s,
      dailyWins: [win, ...(s.dailyWins || [])],
      xp: s.xp + 50
    }));
    
    if (currentUserId) {
      pushXp(currentUserId, memoryState.xp);
      supabase.from('daily_wins').insert({
        id: win.id,
        user_id: currentUserId,
        date: win.date,
        content: win.content,
        feeling: win.feeling,
        xp_rewarded: true
      }).then();
    }
  }, []);

  const addPandaCoins = useCallback((amount: number) => {
    if (!currentUserId) return;
    setState(s => ({ ...s, pandaCoins: Math.max(0, (s.pandaCoins || 0) + amount) }));
    if (currentUserId) pushPandaCoins(currentUserId, memoryState.pandaCoins);
  }, []);

  const toggleSkill = useCallback((slug: string) => {
    if (!currentUserId) return;
    let newSkills: string[] = [];
    setState(s => {
      const current = s.unlockedSkills || [];
      newSkills = current.includes(slug)
        ? current.filter(s => s !== slug)
        : [...current, slug];
      return { ...s, unlockedSkills: newSkills };
    });
    if (currentUserId) pushUnlockedSkills(currentUserId, newSkills);
  }, []);

  const addCustomSkillCategory = useCallback((category: Category) => {
    if (!currentUserId) return;
    let newCategories: Category[] = [];
    setState(s => {
      newCategories = [...(s.customSkillCategories || []), category];
      return { ...s, customSkillCategories: newCategories };
    });
    if (currentUserId) {
      supabase.from("profiles").update({ custom_skill_categories: newCategories } as any).eq("user_id", currentUserId).then();
    }
  }, []);

  const toggleEnkiMode = useCallback((enabled: boolean) => {
    if (!currentUserId) return;
    setState(s => ({ ...s, enkiModeEnabled: enabled }));
    if (currentUserId) {
      supabase.from("profiles").update({ enki_mode_enabled: enabled } as any).eq("user_id", currentUserId).then();
    }
  }, []);

  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const state = memoryState;
  const userId = currentUserId;
  const today = todayCDMX();

  // Recalcula la racha contando días consecutivos terminando hoy (o ayer si hoy aún no se ha marcado).
  const recalcStreak = (history: string[]): number => {
    if (history.length === 0) return 0;
    const set = new Set(history);
    // Encuentra el ancla: hoy o (si no está) ayer
    let offset = 0;
    if (!set.has(daysAgoCDMX(0))) {
      if (!set.has(daysAgoCDMX(1))) return 0;
      offset = 1;
    }
    let streak = 0;
    while (set.has(daysAgoCDMX(offset))) {
      streak += 1;
      offset += 1;
    }
    return streak;
  };

  // ----- Habits -----
  // Marca/desmarca un hábito para una fecha específica (default: hoy CDMX).
  const toggleHabitForDate = useCallback((id: string, date?: string) => {
    const targetDate = date ?? todayCDMX();
    const habit = memoryState.habits.find((h) => h.id === id);
    if (!habit) return;
    const wasDone = habit.history.includes(targetDate);
    const newHistory = wasDone
      ? habit.history.filter((d) => d !== targetDate)
      : [...habit.history, targetDate].sort();
    const newStreak = recalcStreak(newHistory);
    const lastCompleted = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
    const updated: Habit = { ...habit, history: newHistory, streak: newStreak, lastCompleted };
    const xpDelta = wasDone ? -habit.points : habit.points;
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? updated : h)),
      xp: Math.max(0, s.xp + xpDelta),
    }));
    if (userId) {
      pushHabit(userId, updated);
      pushXp(userId, memoryState.xp);
    }
  }, [userId]);

  // Compatibilidad con código existente: toggle para HOY.
  const toggleHabit = useCallback((id: string) => toggleHabitForDate(id), [toggleHabitForDate]);

  const addHabit = useCallback((name: string, emoji: string, points: number, frequency: Habit["frequency"] = "daily", targetCount: number = 1, category?: string) => {
    const h: Habit = { id: crypto.randomUUID(), name, emoji, points, streak: 0, lastCompleted: null, history: [], frequency, targetCount, category };
    setState((s) => ({ ...s, habits: [...s.habits, h] }));
    if (userId) pushHabit(userId, h);
  }, [userId]);

  const deleteHabit = useCallback((id: string) => {
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
    deleteHabitCloud(id);
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Pick<Habit, "name" | "emoji" | "points" | "frequency" | "targetCount" | "category" | "streak" | "lastCompleted" | "history">>) => {
    setState((s) => {
      const habits = s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
      const updated = habits.find((h) => h.id === id);
      if (userId && updated) pushHabit(userId, updated);
      return { ...s, habits };
    });
  }, [userId]);


  // ----- Learnings -----
  const addLearning = useCallback((l: Omit<Learning, "id" | "date">) => {
    const learning: Learning = { ...l, id: crypto.randomUUID(), date: todayCDMX() };
    const { newTags } = resolveHashtags(`${l.title} ${l.notes}`, memoryState.tags);
    
    // Si es un aprendizaje, damos XP extra
    // Si tiene un skillId asociado, podría dar un bono mayor
    const xpReward = l.skillId ? 25 : 15;
    
    setState((s) => ({ 
      ...s, 
      tags: [...s.tags, ...newTags], 
      learnings: [learning, ...s.learnings], 
      xp: s.xp + xpReward 
    }));

    if (userId) {
      newTags.forEach((tag) => pushTag(userId, tag));
      pushLearning(userId, learning);
      pushXp(userId, memoryState.xp);
    }
  }, [userId]);

  const updateLearning = useCallback((id: string, patch: Partial<Omit<Learning, "id" | "date">>) => {
    let updated: Learning | undefined;
    let createdTags: Tag[] = [];
    setState((s) => {
      const current = s.learnings.find((l) => l.id === id);
      if (!current) return s;
      const nextTitle = patch.title ?? current.title;
      const nextNotes = patch.notes ?? current.notes;
      const { newTags } = resolveHashtags(`${nextTitle} ${nextNotes}`, s.tags);
      createdTags = newTags;
      return {
        ...s,
        tags: [...s.tags, ...newTags],
        learnings: s.learnings.map((l) => {
          if (l.id !== id) return l;
          updated = { ...l, ...patch };
          return updated;
        }),
      };
    });
    if (userId) {
      createdTags.forEach((tag) => pushTag(userId, tag));
      if (updated) pushLearning(userId, updated);
    }
  }, [userId]);

  const deleteLearning = useCallback((id: string) => {
    setState((s) => ({ ...s, learnings: s.learnings.filter((l) => l.id !== id) }));
    deleteLearningCloud(id);
  }, []);

  // ----- Energy -----
  const logEnergy = useCallback((entry: EnergyEntry) => {
    setState((s) => {
      const filtered = s.energy.filter((e) => e.date !== entry.date);
      return { ...s, energy: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)) };
    });
    if (userId) {
      pushEnergy(userId, entry);
      
      // Update global energy streak
      (async () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const { data: profile } = await supabase.from("profiles").select("energy_streak, last_energy_date").eq("user_id", userId).maybeSingle();
        if (profile && profile.last_energy_date !== entry.date) {
          const newStreak = profile.last_energy_date === yesterday ? (profile.energy_streak || 0) + 1 : 1;
          await supabase.from("profiles").update({ 
            energy_streak: newStreak, 
            last_energy_date: entry.date 
          } as any).eq("user_id", userId);
        }
      })();
    }

  }, [userId]);

  // ----- Tasks -----
  const addTask = useCallback(
    (t: Omit<Task, "id" | "createdAt" | "status" | "subtasks"> & { subtasks?: Subtask[]; status?: TaskStatus }) => {
      const taskId = crypto.randomUUID();
      const { newTags, tagIds } = resolveHashtags(`${t.title} ${t.description ?? ""}`, memoryState.tags);
      const task: Task = {
        ...t,
        id: taskId,
        createdAt: new Date().toISOString(),
        status: t.status ?? "pending",
        subtasks: t.subtasks ?? [],
        tags: mergeTagIds(t.tags, tagIds),
      };
      setState((s) => ({ ...s, tags: [...s.tags, ...newTags], tasks: [task, ...s.tasks] }));
      if (userId) {
        newTags.forEach((tag) => pushTag(userId, tag));
        pushTask(userId, task);
      }
    },
    [userId],
  );

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    let updated: Task | undefined;
    let createdTags: Tag[] = [];
    setState((s) => {
      const current = s.tasks.find((t) => t.id === id);
      const nextTitle = patch.title ?? current?.title ?? "";
      const nextDesc = patch.description ?? current?.description ?? "";
      const { newTags, tagIds } = resolveHashtags(`${nextTitle} ${nextDesc}`, s.tags);
      createdTags = newTags;
      const baseTags = patch.tags ?? current?.tags ?? [];
      const finalTags = mergeTagIds(baseTags, tagIds);
      return {
        ...s,
        tags: [...s.tags, ...newTags],
        tasks: s.tasks.map((t) => {
          if (t.id !== id) return t;
          updated = { ...t, ...patch, tags: finalTags };
          return updated;
        }),
      };
    });
    if (userId) {
      createdTags.forEach((tag) => pushTag(userId, tag));
      if (updated) pushTask(userId, updated);
    }
  }, [userId]);

  const deleteTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
    deleteTaskCloud(id);
  }, []);

  const duplicateTask = useCallback((id: string) => {
    const t = memoryState.tasks.find((x) => x.id === id);
    if (!t) return;
    const copy: Task = {
      ...t,
      id: crypto.randomUUID(),
      title: `${t.title} (copia)`,
      status: "pending",
      completedAt: undefined,
      createdAt: new Date().toISOString(),
      subtasks: t.subtasks.map((st) => ({ ...st, id: crypto.randomUUID(), done: false })),
    };
    setState((s) => ({ ...s, tasks: [copy, ...s.tasks] }));
    if (userId) pushTask(userId, copy);
  }, [userId]);

  const toggleTaskComplete = useCallback((id: string) => {
    const t = memoryState.tasks.find((x) => x.id === id);
    if (!t) return;
    const wasDone = t.status === "completed";
    const points = taskXp(t);
    const updated: Task = {
      ...t,
      status: wasDone ? "pending" : "completed",
      completedAt: wasDone ? undefined : new Date().toISOString(),
    };
    let nextRecurring: Task | undefined;
    if (!wasDone && t.recurrence) {
      const baseDate = t.due ? new Date(t.due) : new Date();
      const nextDue = advanceDate(baseDate, t.recurrence);
      nextRecurring = {
        ...t,
        id: crypto.randomUUID(),
        status: "pending",
        completedAt: undefined,
        createdAt: new Date().toISOString(),
        due: nextDue.toISOString(),
        subtasks: t.subtasks.map((st) => ({ ...st, id: crypto.randomUUID(), done: false })),
      };
    }
    setState((s) => {
      let tasks = s.tasks.map((x) => (x.id === id ? updated : x));
      if (nextRecurring) tasks = [nextRecurring, ...tasks];
      let productivity = s.productivity;
      if (!wasDone) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak =
          productivity.lastCompletedDate === today
            ? productivity.streak
            : productivity.lastCompletedDate === yesterday
              ? productivity.streak + 1
              : 1;
        productivity = { streak: newStreak, lastCompletedDate: today };

        // Update global task streak in profile
        if (userId) {
          (async () => {
            const { data: profile } = await supabase.from("profiles").select("task_streak, last_task_date").eq("user_id", userId).maybeSingle();
            if (profile && profile.last_task_date !== today) {
              const profileStreak = profile.last_task_date === yesterday ? (profile.task_streak || 0) + 1 : 1;
              await supabase.from("profiles").update({ 
                task_streak: profileStreak, 
                last_task_date: today 
              } as any).eq("user_id", userId);
            }
          })();
        }
      }
      return { ...s, tasks, xp: Math.max(0, s.xp + (wasDone ? -points : points)), productivity };

    });
    if (userId) {
      pushTask(userId, updated);
      if (nextRecurring) pushTask(userId, nextRecurring);
      pushXp(userId, memoryState.xp);
    }
  }, [today, userId]);

  const toggleSubtask = useCallback((taskId: string, subId: string) => {
    let updated: Task | undefined;
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        updated = { ...t, subtasks: t.subtasks.map((st) => (st.id === subId ? { ...st, done: !st.done } : st)) };
        return updated;
      }),
    }));
    if (userId && updated) pushTask(userId, updated);
  }, [userId]);

  // ----- Lists / Tags -----
  const addList = useCallback((name: string, emoji: string, color: string) => {
    const l: TaskList = { id: crypto.randomUUID(), name, emoji, color };
    setState((s) => ({ ...s, taskLists: [...s.taskLists, l] }));
    if (userId) pushList(userId, l);
  }, [userId]);

  /** Devuelve el id de la lista "Inbox" (la crea si no existe). */
  const ensureInboxList = useCallback((): string => {
    const existing = memoryState.taskLists.find((l) => /^inbox|bandeja/i.test(l.name));
    if (existing) return existing.id;
    const l: TaskList = { id: crypto.randomUUID(), name: "Inbox", emoji: "📥", color: "oklch(0.78 0.05 250)" };
    setState((s) => ({ ...s, taskLists: [l, ...s.taskLists] }));
    if (userId) pushList(userId, l);
    return l.id;
  }, [userId]);


  const deleteList = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      taskLists: s.taskLists.filter((l) => l.id !== id),
      tasks: s.tasks.filter((t) => t.listId !== id),
    }));
    deleteListCloud(id);
  }, []);

  const addTag = useCallback((name: string, color: string) => {
    const tag: Tag = { id: crypto.randomUUID(), name, color };
    setState((s) => ({ ...s, tags: [...s.tags, tag] }));
    if (userId) pushTag(userId, tag);
  }, [userId]);

  const deleteTag = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      tags: s.tags.filter((t) => t.id !== id),
      tasks: s.tasks.map((t) => ({ ...t, tags: t.tags.filter((x) => x !== id) })),
    }));
    deleteTagCloud(id);
  }, []);

  // ----- Notes -----
  const quickCaptureNote = useCallback((content: string) => {
    if (!content.trim()) return null;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const firstLine = content.trim().split("\n")[0].slice(0, 80);
    const { newTags, tagIds } = resolveHashtags(content, memoryState.tags);
    const note: Note = {
      id,
      title: firstLine,
      content: content.trim(),
      type: "idea",
      category: "personal",
      tags: tagIds,
      importance: "normal",
      checklist: [],
      linkedNoteIds: [],
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({ ...s, tags: [...s.tags, ...newTags], notes: [note, ...s.notes], xp: s.xp + 3 }));
    if (userId) {
      newTags.forEach((tag) => pushTag(userId, tag));
      pushNote(userId, note);
      pushXp(userId, memoryState.xp);
    }
    return id;
  }, [userId]);

  const addNote = useCallback(
    (n: Omit<Note, "id" | "createdAt" | "updatedAt" | "checklist" | "linkedNoteIds"> & { checklist?: NoteChecklistItem[]; linkedNoteIds?: string[] }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { newTags, tagIds } = resolveHashtags(`${n.title} ${n.content}`, memoryState.tags);
      const note: Note = {
        ...n,
        id,
        tags: mergeTagIds(n.tags, tagIds),
        checklist: n.checklist ?? [],
        linkedNoteIds: n.linkedNoteIds ?? [],
        createdAt: now,
        updatedAt: now,
      };
      setState((s) => ({ ...s, tags: [...s.tags, ...newTags], notes: [note, ...s.notes], xp: s.xp + 5 }));
      if (userId) {
        newTags.forEach((tag) => pushTag(userId, tag));
        pushNote(userId, note);
        pushXp(userId, memoryState.xp);
      }
      return id;
    },
    [userId],
  );

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    let updated: Note | undefined;
    let createdTags: Tag[] = [];
    setState((s) => {
      const current = s.notes.find((n) => n.id === id);
      const nextTitle = patch.title ?? current?.title ?? "";
      const nextContent = patch.content ?? current?.content ?? "";
      const { newTags, tagIds } = resolveHashtags(`${nextTitle} ${nextContent}`, s.tags);
      createdTags = newTags;
      const baseTags = patch.tags ?? current?.tags ?? [];
      const finalTags = mergeTagIds(baseTags, tagIds);
      return {
        ...s,
        tags: [...s.tags, ...newTags],
        notes: s.notes.map((n) => {
          if (n.id !== id) return n;
          updated = { ...n, ...patch, tags: finalTags, updatedAt: new Date().toISOString() };
          return updated;
        }),
      };
    });
    if (userId) {
      createdTags.forEach((tag) => pushTag(userId, tag));
      if (updated) pushNote(userId, updated);
    }
  }, [userId]);

  const deleteNote = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notes: s.notes.filter((n) => n.id !== id).map((n) => ({ ...n, linkedNoteIds: n.linkedNoteIds.filter((x) => x !== id) })),
    }));
    deleteNoteCloud(id);
  }, []);

  const toggleNoteChecklist = useCallback((noteId: string, itemId: string) => {
    let updated: Note | undefined;
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) => {
        if (n.id !== noteId) return n;
        updated = {
          ...n,
          checklist: n.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (userId && updated) pushNote(userId, updated);
  }, [userId]);

  const linkNotes = useCallback((a: string, b: string) => {
    if (a === b) return;
    const updates: Note[] = [];
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) => {
        if (n.id === a && !n.linkedNoteIds.includes(b)) {
          const u = { ...n, linkedNoteIds: [...n.linkedNoteIds, b], updatedAt: new Date().toISOString() };
          updates.push(u);
          return u;
        }
        if (n.id === b && !n.linkedNoteIds.includes(a)) {
          const u = { ...n, linkedNoteIds: [...n.linkedNoteIds, a], updatedAt: new Date().toISOString() };
          updates.push(u);
          return u;
        }
        return n;
      }),
    }));
    if (userId) updates.forEach((u) => pushNote(userId, u));
  }, [userId]);

  const convertNoteToTask = useCallback((noteId: string, opts?: { listId?: string; priority?: Priority }) => {
    const note = memoryState.notes.find((n) => n.id === noteId);
    if (!note) return;
    const listId = opts?.listId ?? memoryState.taskLists[0]?.id ?? "";
    const priority: Priority = opts?.priority ?? (note.importance === "high" || note.importance === "money" ? "high" : note.importance === "important" ? "medium" : "low");
    const task: Task = {
      id: crypto.randomUUID(),
      title: note.title,
      description: note.content,
      priority,
      tags: note.tags,
      listId,
      status: "pending",
      subtasks: note.checklist.map((c) => ({ id: crypto.randomUUID(), title: c.text, done: c.done })),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, tasks: [task, ...s.tasks], xp: s.xp + 10 }));
    if (userId) {
      pushTask(userId, task);
      pushXp(userId, memoryState.xp);
    }
  }, [userId]);

  const convertNoteToProject = useCallback((noteId: string) => {
    const note = memoryState.notes.find((n) => n.id === noteId);
    if (!note) return;
    const newList: TaskList = { id: crypto.randomUUID(), name: note.title.slice(0, 30), emoji: "🚀", color: "oklch(0.78 0.18 150)" };
    let updatedNote: Note | undefined;
    setState((s) => ({
      ...s,
      taskLists: [...s.taskLists, newList],
      notes: s.notes.map((n) => {
        if (n.id !== noteId) return n;
        updatedNote = { ...n, type: "project", updatedAt: new Date().toISOString() };
        return updatedNote;
      }),
      xp: s.xp + 15,
    }));
    if (userId) {
      pushList(userId, newList);
      if (updatedNote) pushNote(userId, updatedNote);
      pushXp(userId, memoryState.xp);
    }
  }, [userId]);

  // Bonus XP (logros, quests, etc.) — actualiza estado local Y nube de forma consistente
  // Usa currentUserId (módulo) en vez del closure para evitar perder XP cuando el
  // callback se creó antes de que la sesión estuviera lista.
  const addBonusXp = useCallback((amount: number) => {
    if (!amount) return;
    setState((s) => ({ ...s, xp: Math.max(0, s.xp + amount) }));
    if (currentUserId) pushXp(currentUserId, memoryState.xp);
  }, []);

  return {
    state,
    today,
    cloudReady,
    addBonusXp,
    toggleSkill,
    toggleHabit,
    toggleHabitForDate,
    addHabit,
    updateHabit,
    deleteHabit,
    addLearning,
    updateLearning,
    deleteLearning,
    logEnergy,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskComplete,
    toggleSubtask,
    addList,
    deleteList,
    addTag,
    deleteTag,
    quickCaptureNote,
    addNote,
    updateNote,
    deleteNote,
    toggleNoteChecklist,
    linkNotes,
    convertNoteToTask,
    convertNoteToProject,
    markTemplateImported,
    addDailyWin,
    addCustomSkillCategory,
    toggleEnkiMode,
  };
}

// ===== Helpers =====
/**
 * Puntos numéricos asociados a una prioridad (para ordenar).
 */
export function priorityPoints(p: Priority): number {
  return p === "high" ? 30 : p === "medium" ? 15 : 8;
}

/**
 * Calcula el XP que otorga completar una tarea según su prioridad.
 */
export function taskXp(t: Pick<Task, "priority" | "xpReward">): number {
  if (typeof t.xpReward === "number" && t.xpReward >= 0) return Math.round(t.xpReward);
  return priorityPoints(t.priority);
}

/**
 * Avanza una fecha según un patrón de recurrencia.
 */
export function advanceDate(date: Date, r: Recurrence): Date {
  const d = new Date(date);
  const n = Math.max(1, r.interval || 1);
  const step = () => {
    switch (r.frequency) {
      case "daily": d.setDate(d.getDate() + n); break;
      case "weekly": d.setDate(d.getDate() + 7 * n); break;
      case "monthly": d.setMonth(d.getMonth() + n); break;
      case "yearly": d.setFullYear(d.getFullYear() + n); break;
    }
  };
  step();
  while (d.getTime() < Date.now()) step();
  return d;
}

/**
 * Etiqueta legible para una recurrencia («Cada 2 semanas»…).
 */
export function recurrenceLabel(r: Recurrence): string {
  const n = Math.max(1, r.interval || 1);
  const unit = r.frequency === "daily" ? (n === 1 ? "día" : "días")
    : r.frequency === "weekly" ? (n === 1 ? "semana" : "semanas")
    : r.frequency === "monthly" ? (n === 1 ? "mes" : "meses")
    : (n === 1 ? "año" : "años");
  return n === 1 ? `Cada ${unit}` : `Cada ${n} ${unit}`;
}

/**
 * Etiqueta legible para una prioridad.
 */
export function priorityLabel(p: Priority): string {
  return p === "high" ? "Alta" : p === "medium" ? "Media" : "Baja";
}

/**
 * Rango (entero) de una prioridad para ordenar listas.
 */
export function priorityRank(p: Priority): number {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

/**
 * ¿La tarea está vencida respecto a `now`?
 */
export function isOverdue(task: Task, now = new Date()): boolean {
  if (!task.due || task.status === "completed") return false;
  return new Date(task.due).getTime() < now.getTime();
}

/**
 * ¿La tarea vence hoy?
 */
export function isDueToday(task: Task, today: string): boolean {
  if (!task.due) return false;
  return task.due.slice(0, 10) === today;
}

/**
 * Recomendación inteligente de qué hacer ahora según energía + prioridades.
 */
export function smartTaskRecommendation(
  tasks: Task[],
  today: string,
): { tasks: Task[]; alert: { tone: "danger" | "warning" | "info" | "success"; message: string } } {
  const pending = tasks.filter((t) => t.status !== "completed");
  const overdue = pending.filter((t) => isOverdue(t));
  const dueToday = pending.filter((t) => isDueToday(t, today));
  const highPriority = pending.filter((t) => t.priority === "high");

  const moneyTags = new Set(["dinero", "cliente", "ventas", "urgente"]);
  const scored = pending
    .map((t) => {
      let score = 0;
      if (isOverdue(t)) score += 100;
      if (isDueToday(t, today)) score += 40;
      if (t.priority === "high") score += 30;
      if (t.priority === "medium") score += 10;
      if (t.tags.some((tag) => moneyTags.has(tag))) score += 25;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.t);

  let alert: { tone: "danger" | "warning" | "info" | "success"; message: string };
  if (overdue.length > 0) {
    alert = { tone: "danger", message: `Tienes ${overdue.length} tarea${overdue.length > 1 ? "s" : ""} vencida${overdue.length > 1 ? "s" : ""}` };
  } else if (dueToday.length + highPriority.length > 6) {
    alert = { tone: "warning", message: "Estás saturado hoy — prioriza lo crítico" };
  } else if (highPriority.length > 0) {
    alert = { tone: "warning", message: `${highPriority.length} tarea${highPriority.length > 1 ? "s" : ""} crítica${highPriority.length > 1 ? "s" : ""}` };
  } else if (pending.length === 0) {
    alert = { tone: "success", message: "Sin pendientes — disfruta el momento 🐼" };
  } else {
    alert = { tone: "info", message: `${pending.length} pendiente${pending.length > 1 ? "s" : ""} en total` };
  }
  return { tasks: scored, alert };
}

/**
 * Convierte un total de XP en `{ level, xpInLevel, xpForLevel }`.
 */
export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const currentLevelXp = (level - 1) ** 2 * 50;
  const nextLevelXp = level ** 2 * 50;
  const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return { level, progress, currentLevelXp, nextLevelXp };
}

/**
 * Media simple de las dimensiones de una entrada de energía.
 */
export function avgEnergy(entry?: EnergyEntry) {
  if (!entry) return null;
  return (entry.physical + entry.mental + entry.emotional) / 3;
}

/**
 * Recomendación textual del día (título + razón + acción sugerida).
 */
export function todayRecommendation(state: AppState, today: string): { title: string; reason: string; action: string } {
  const todayEnergy = state.energy.find((e) => e.date === today);
  const avg = avgEnergy(todayEnergy);
  const pendingHabits = state.habits.filter((h) => h.lastCompleted !== today);
  const topStreak = [...state.habits].sort((a, b) => b.streak - a.streak)[0];

  if (avg === null) {
    return { title: "Registra tu energía", reason: "Sin datos de energía no puedo recomendarte el mejor enfoque del día.", action: "Ir a Energía" };
  }
  if (avg < 4) {
    return { title: "Día de recuperación 🌿", reason: `Tu energía promedio es ${avg.toFixed(1)}/10. Hoy prioriza descanso, hidratación y un solo hábito ancla.`, action: "Completar 1 hábito ligero" };
  }
  if (avg < 7) {
    const next = pendingHabits[0];
    return { title: next ? `Enfócate en: ${next.name}` : "Mantén el ritmo 🎯", reason: `Energía media (${avg.toFixed(1)}/10). Buen momento para 2-3 hábitos clave sin sobrecargarte.`, action: next ? "Empezar ahora" : "Revisar hábitos" };
  }
  return {
    title: `Día de ataque 🔥 — ${topStreak?.name ?? "Deep work"}`,
    reason: `Energía alta (${avg.toFixed(1)}/10). Aprovecha para tareas exigentes y tu racha de ${topStreak?.streak ?? 0} días.`,
    action: "Bloque profundo 90 min",
  };
}

// ===== NOTE HELPERS =====


export const NOTE_TYPE_META: Record<NoteType, { label: string; emoji: string }> = {
  idea: { label: "Idea", emoji: "💡" },
  learning: { label: "Aprendizaje", emoji: "🧠" },
  note: { label: "Nota", emoji: "📋" },
  project: { label: "Proyecto", emoji: "🚀" },
};

export const NOTE_CATEGORY_LABEL: Record<NoteCategory, string> = {
  negocio: "Negocio",
  marketing: "Marketing",
  personal: "Personal",
  clientes: "Clientes",
  contenido: "Contenido",
  otro: "Otro",
};

export const NOTE_IMPORTANCE_META: Record<NoteImportance, { label: string; emoji: string; tone: string }> = {
  normal: { label: "Normal", emoji: "•", tone: "muted" },
  important: { label: "Importante", emoji: "⭐", tone: "xp" },
  high: { label: "Alta prioridad", emoji: "🔥", tone: "destructive" },
  money: { label: "Potencial $", emoji: "💰", tone: "primary" },
};

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^\p{L}\p{N}\s#]/gu, " ").split(/\s+/).filter((w) => w.length > 3),
  );
}

/**
 * Hasta `limit` notas relacionadas con la nota `target` (por tags/texto).
 */
export function relatedNotes(target: Note, all: Note[], limit = 3): Note[] {
  const targetTokens = tokenize(`${target.title} ${target.content}`);
  return all
    .filter((n) => n.id !== target.id)
    .map((n) => {
      const tokens = tokenize(`${n.title} ${n.content}`);
      let score = 0;
      targetTokens.forEach((t) => tokens.has(t) && score++);
      target.tags.forEach((t) => n.tags.includes(t) && (score += 2));
      if (n.category === target.category) score += 1;
      if (target.linkedNoteIds.includes(n.id)) score += 5;
      return { n, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.n);
}

/**
 * Notas a revisitar hoy según importancia/recencia.
 */
export function suggestedNotesForToday(notes: Note[], limit = 3): Note[] {
  const now = Date.now();
  return [...notes]
    .map((n) => {
      let score = 0;
      const ageDays = (now - new Date(n.updatedAt).getTime()) / 86400000;
      if (ageDays < 3) score += 20;
      else if (ageDays < 7) score += 10;
      if (n.importance === "money") score += 25;
      if (n.importance === "high") score += 20;
      if (n.importance === "important") score += 10;
      if (n.type === "idea") score += 5;
      if (n.type === "project") score += 8;
      return { n, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.n);
}

/**
 * Busca notas relevantes a un texto libre (útil dentro del chat / captura).
 */
export function findRelevantNotesForText(text: string, notes: Note[], limit = 3): Note[] {
  const tokens = tokenize(text);
  if (tokens.size === 0) return [];
  return notes
    .map((n) => {
      const nTokens = tokenize(`${n.title} ${n.content} ${n.tags.join(" ")}`);
      let score = 0;
      tokens.forEach((t) => nTokens.has(t) && score++);
      return { n, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.n);
}
