/**
 * Hook central de **gamificación**: logros (achievements) desbloqueados,
 * quests semanales con progreso vivo, sincronización con Supabase y
 * disparo de toasts cuando se desbloquea algo nuevo.
 *
 * Composición: combina `useFinance`, `useHealth` y `useHome` para construir
 * un snapshot completo que las reglas de logros y quests evalúan.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { useAppState } from "../lib/storage";
import { useFinance } from "./use-finance";
import { useHealth } from "./use-health";
import { useHome } from "./use-home";
import { monthKey } from "../lib/finance-types";
import type { AppState, FinanceSnapshot } from "../lib/storage-types";
import {
  FIXED_MISSIONS,
  evaluateFixedMissions,
  questsForWeek,
  computeQuestProgress,
  weekKey,
  type FixedMission,
  type Quest,
} from "../lib/gamification";

type QuestRow = { quest_id: string; progress: number; claimed: boolean };

function buildFinanceSnapshot(f: ReturnType<typeof useFinance>): FinanceSnapshot {
  const { cards, expenses, msiPlans, payments, budgets } = f;
  const now = new Date();
  // Semana ISO (lun-dom)
  const day = now.getDay() || 7;
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - (day - 1));
  const weekStartISO = weekStart.toISOString().slice(0, 10);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);

  const mk = monthKey(now);
  const monthExpensesArr = expenses.filter((e) => e.date.startsWith(mk) && e.kind === "expense" && e.expense_type !== "msi_charge");
  const monthIncomeArr = expenses.filter((e) => e.date.startsWith(mk) && e.kind === "income");
  const monthExpenses = monthExpensesArr.reduce((a, e) => a + e.amount, 0);
  const monthIncome = monthIncomeArr.reduce((a, e) => a + e.amount, 0);

  const expensesThisWeek = expenses.filter((e) => e.date >= weekStartISO && e.date < weekEndISO);
  const paymentsThisWeek = payments.filter((p) => p.date >= weekStartISO && p.date < weekEndISO);

  const totalCreditLimit = cards.reduce((a, c) => a + Number(c.credit_limit), 0);
  const totalBalance = cards.reduce((a, c) => a + Number(c.current_balance), 0);
  const maxUtilization = cards.length === 0 ? 0 : Math.max(
    ...cards.map((c) => (Number(c.credit_limit) > 0 ? Number(c.current_balance) / Number(c.credit_limit) : 0))
  );

  // Presupuestos del mes actual: contar cuántos están dentro del límite
  const monthBudgets = budgets.filter((b) => b.month === mk);
  const spentByCategory = new Map<string, number>();
  for (const e of monthExpensesArr) {
    spentByCategory.set(e.category, (spentByCategory.get(e.category) ?? 0) + e.amount);
  }
  const totalMonthSpent = monthExpenses;
  let budgetsOnTrack = 0;
  for (const b of monthBudgets) {
    const spent = b.category ? (spentByCategory.get(b.category) ?? 0) : totalMonthSpent;
    if (spent <= Number(b.amount)) budgetsOnTrack += 1;
  }

  return {
    cardsCount: cards.length,
    totalCreditLimit,
    totalBalance,
    expensesCount: expenses.length,
    budgetsCount: budgets.length,
    expensesThisWeekCount: expensesThisWeek.length,
    paymentsThisWeekCount: paymentsThisWeek.length,
    paymentsThisWeekAmount: paymentsThisWeek.reduce((a, p) => a + p.amount, 0),
    monthIncome,
    monthExpenses,
    maxUtilization,
    budgetsOnTrack,
    budgetsTotal: monthBudgets.length,
    activeMsiCount: msiPlans.filter((m) => m.status === "active").length,
  };
}

type UnlockedAch = { id: string; unlockedAt: string };
type ClaimedQuestHistory = { quest_id: string; week_key: string; progress: number; updated_at: string };

/**
 * Hook principal. Devuelve achievements, quests con progreso, historial
 * de quests reclamados y mutaciones para reclamar/incrementar.
 */
export function useGamification() {
  const { user } = useAuth();
  const { state: rawState, addBonusXp } = useAppState();
  const finance = useFinance();
  const health = useHealth();
  const home = useHome();
  const userId = user?.id ?? null;

  const financeSnapshot = useMemo(() => buildFinanceSnapshot(finance), [finance.cards, finance.expenses, finance.msiPlans, finance.payments, finance.budgets]);
  const homeSnapshotForState = useMemo(() => ({
    totalTasks: home.snapshot.totalTasks,
    activeTasks: home.snapshot.activeTasks,
    totalCompletions: home.snapshot.totalCompletions,
    todayTotal: home.snapshot.todayTotal,
    todayDone: home.snapshot.todayDone,
    dayComplete: home.snapshot.dayComplete,
    mvdMet: home.snapshot.mvdMet,
    weekCompletionsCount: home.snapshot.weekCompletionsCount,
    weeklyTasksTotal: home.snapshot.weeklyTasksTotal,
    weeklyTasksDone: home.snapshot.weeklyTasksDone,
    weekComplete: home.snapshot.weekComplete,
  }), [home.snapshot]);
  const state: AppState = useMemo(
    () => ({ ...rawState, finance: financeSnapshot, health: health.snapshot, home: homeSnapshotForState }),
    [rawState, financeSnapshot, health.snapshot, homeSnapshotForState],
  );


  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [unlockedDetails, setUnlockedDetails] = useState<UnlockedAch[]>([]);
  const [questRows, setQuestRows] = useState<QuestRow[]>([]);
  const [questHistory, setQuestHistory] = useState<ClaimedQuestHistory[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());

  // Carga inicial via TanStack Query
  const wkInitial = useMemo(() => weekKey(), []);
  const { data: gamData } = useQuery({
    queryKey: ["gamification", userId, wkInitial],
    enabled: !!userId,
    queryFn: async () => {
      const [achR, qR, qHistR] = await Promise.all([
        supabase
          .from("achievements_unlocked")
          .select("achievement_id, unlocked_at")
          .eq("user_id", userId!),
        supabase
          .from("quest_progress")
          .select("quest_id, progress, claimed")
          .eq("user_id", userId!)
          .eq("week_key", wkInitial),
        supabase
          .from("quest_progress")
          .select("quest_id, week_key, progress, updated_at")
          .eq("user_id", userId!)
          .eq("claimed", true)
          .order("updated_at", { ascending: false }),
      ]);
      return {
        achievements: (achR.data ?? []) as Array<{ achievement_id: string; unlocked_at: string }>,
        questRows: (qR.data ?? []) as QuestRow[],
        questHistory: (qHistR.data ?? []) as ClaimedQuestHistory[],
      };
    },
  });

  useEffect(() => {
    if (!userId) {
      setUnlocked(new Set());
      setUnlockedDetails([]);
      setQuestRows([]);
      setQuestHistory([]);
      seenRef.current = new Set();
      setHydrated(false);
      return;
    }
    if (!gamData) return;
    const set = new Set(gamData.achievements.map((r) => r.achievement_id));
    setUnlocked(set);
    setUnlockedDetails(gamData.achievements.map((r) => ({ id: r.achievement_id, unlockedAt: r.unlocked_at })));
    seenRef.current = new Set(set);
    setQuestRows(gamData.questRows);
    setQuestHistory(gamData.questHistory);
    setHydrated(true);
  }, [userId, gamData]);


  // Detección de nuevas misiones fijas tras cambios de estado
  useEffect(() => {
    if (!userId || !hydrated) return;
    const newOnes = evaluateFixedMissions(state, seenRef.current);
    if (newOnes.length === 0) return;
    // Marcar local + insertar + toast
    const next = new Set(seenRef.current);
    newOnes.forEach((a: FixedMission) => next.add(a.id));
    seenRef.current = next;
    setUnlocked(new Set(next));
    const nowISO = new Date().toISOString();
    setUnlockedDetails((prev) => [...prev, ...newOnes.map((a: FixedMission) => ({ id: a.id, unlockedAt: nowISO }))]);
    newOnes.forEach((a: FixedMission) => {
      toast(`🏆 ${a.name}`, {
        description: `${a.emoji} ${a.description} · +${a.xp} XP`,
        duration: 5000,
      });
    });
    // Persistir
    supabase
      .from("achievements_unlocked")
      .insert(newOnes.map((a: FixedMission) => ({ user_id: userId, achievement_id: a.id })))
      .then(({ error }) => { if (error) console.error("[ach:insert]", error); });
    // Bonus XP — usar el helper local para mantener estado y nube en sync
    const bonus = newOnes.reduce((acc: number, a: FixedMission) => acc + a.xp, 0);
    if (bonus > 0) addBonusXp(bonus);
  }, [state, userId, hydrated, addBonusXp]);

  // Quests de esta semana
  const wk = wkInitial;
  const quests = useMemo(() => questsForWeek(wk, 3), [wk]);


  // Progreso vivo + sync a la tabla cuando cambia
  const questsWithProgress = useMemo(() => {
    return quests.map((q) => {
      const live = computeQuestProgress(q, state, wk);
      const row = questRows.find((r) => r.quest_id === q.id);
      const progress = Math.max(live, row?.progress ?? 0);
      const claimed = row?.claimed ?? false;
      const completed = progress >= q.target;
      return { quest: q, progress, claimed, completed };
    });
  }, [quests, state, wk, questRows]);

  // Persistir progreso (debounced sencillo: tras cambios de state)
  const lastSyncRef = useRef<string>("");
  useEffect(() => {
    if (!userId || !hydrated) return;
    const snapshot = JSON.stringify(questsWithProgress.map((q) => [q.quest.id, q.progress]));
    if (snapshot === lastSyncRef.current) return;
    lastSyncRef.current = snapshot;
    questsWithProgress.forEach(({ quest, progress, claimed }) => {
      const existing = questRows.find((r) => r.quest_id === quest.id);
      if (existing && existing.progress === progress && existing.claimed === claimed) return;
      supabase
        .from("quest_progress")
        .upsert({ user_id: userId, week_key: wk, quest_id: quest.id, progress, claimed }, { onConflict: "user_id,week_key,quest_id" })
        .then(({ error }) => { if (error) console.error("[quest:upsert]", error); });
    });
  }, [questsWithProgress, userId, hydrated, wk, questRows]);

  const claimQuest = useCallback(async (quest: Quest) => {
    if (!userId) return;
    const entry = questsWithProgress.find((q) => q.quest.id === quest.id);
    if (!entry || !entry.completed || entry.claimed) return;
    // marcar claimed (local + nube)
    setQuestRows((prev) => {
      const others = prev.filter((r) => r.quest_id !== quest.id);
      return [...others, { quest_id: quest.id, progress: entry.progress, claimed: true }];
    });
    const nowISO = new Date().toISOString();
    setQuestHistory((prev) => [{ quest_id: quest.id, week_key: wk, progress: entry.progress, updated_at: nowISO }, ...prev.filter((h) => !(h.quest_id === quest.id && h.week_key === wk))]);
    await supabase
      .from("quest_progress")
      .upsert({ user_id: userId, week_key: wk, quest_id: quest.id, progress: entry.progress, claimed: true }, { onConflict: "user_id,week_key,quest_id" });
    // Bonus XP — helper local
    addBonusXp(quest.xp);
    toast(`🎁 Misión completada: ${quest.title}`, {
      description: `${quest.emoji} +${quest.xp} XP de bonus`,
      duration: 4500,
    });
  }, [userId, questsWithProgress, wk, addBonusXp]);

  const incrementQuestProgress = useCallback(async (questId: string, target: number, xp: number, delta = 1) => {
    if (!userId) return;
    const entry = questsWithProgress.find((q) => q.quest.id === questId);
    const current = entry?.progress ?? 0;
    const next = Math.min(target, current + delta);
    const wasCompleted = current >= target;
    const isCompleted = next >= target;

    setQuestRows((prev) => {
      const others = prev.filter((r) => r.quest_id !== questId);
      return [...others, { quest_id: questId, progress: next, claimed: entry?.claimed ?? false }];
    });

    await supabase
      .from("quest_progress")
      .upsert({ user_id: userId, week_key: wk, quest_id: questId, progress: next, claimed: entry?.claimed ?? false }, { onConflict: "user_id,week_key,quest_id" });

    if (!wasCompleted && isCompleted) {
      toast.success("¡Misión completada!", { description: "Reclama tu recompensa" });
    }
  }, [userId, questsWithProgress, wk]);

  const unlockAchievementManually = useCallback(async (achievement: FixedMission) => {
    if (!userId) return;
    if (unlocked.has(achievement.id)) return;

    const nowISO = new Date().toISOString();
    setUnlocked(prev => new Set([...prev, achievement.id]));
    setUnlockedDetails(prev => [...prev, { id: achievement.id, unlockedAt: nowISO }]);

    await supabase
      .from("achievements_unlocked")
      .insert({ user_id: userId, achievement_id: achievement.id });

    addBonusXp(achievement.xp);
    toast.success(`🏆 ${achievement.name}`, {
      description: `${achievement.emoji} ${achievement.description} · +${achievement.xp} XP`,
      duration: 5000,
    });
  }, [userId, unlocked, addBonusXp]);

  return {
    achievements: FIXED_MISSIONS,
    unlocked,
    unlockedDetails,
    quests: questsWithProgress,
    questHistory,
    weekKey: wk,
    claimQuest,
    incrementQuestProgress,
    unlockAchievementManually,
    totalUnlocked: unlocked.size,
    totalAchievements: FIXED_MISSIONS.length,
  };
}

/**
 * Tipo del API expuesto por `useGamification`.
 */
export type GamificationApi = ReturnType<typeof useGamification>;

/**
 * Devuelve el primer logro de la lista que el usuario aún no ha
 * desbloqueado, o `null` si todos están desbloqueados.
 */
export function nextAchievement(unlocked: Set<string>, achievements: FixedMission[]): FixedMission | null {
  return achievements.find((a) => !unlocked.has(a.id)) ?? null;
}
