/**
 * **Ruta** — Página principal / dashboard inicial de la app.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAppState, levelFromXp, todayRecommendation, avgEnergy, smartTaskRecommendation, isOverdue, isDueToday } from "@/lib/storage";
import { useGamification, nextAchievement } from "@/hooks/use-gamification";
import { useRewardsCustom } from "@/hooks/use-rewards-custom";
import { PandaAvatar } from "@/components/PandaAvatar";
import { StatCard } from "@/components/StatCard";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { Sparkles, Flame, Battery, BookOpen, ArrowRight, Check, CheckSquare, Calendar as CalendarIcon, Trophy, Target, Gift, Plus, Star, Smile, Heart } from "lucide-react";
import { LifeRandomizer } from "@/components/LifeRandomizer";
import { ActiveQuestsWidget } from "@/components/ActiveQuestsWidget";
import { IdentityFocusWidget } from "@/components/IdentityFocusWidget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Panda's LIFE OS" },
      { name: "description", content: "Tu panel diario: nivel, energía, hábitos y la recomendación inteligente del día." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, today, toggleHabit, toggleTaskComplete, addDailyWin } = useAppState();
  const [winContent, setWinContent] = useState("");
  const [showWinInput, setShowWinInput] = useState(false);
  const [prefs, setPrefs] = useState<any>(null);
  const todayWins = useMemo(() => (state.dailyWins || []).filter(w => w.date === today), [state.dailyWins, today]);


  useEffect(() => {
    const fetchPrefs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", session.user.id).maybeSingle();
      if (data) setPrefs(data);
    };
    fetchPrefs();

  }, []);

  const handleAddWin = () => {
    if (!winContent.trim()) return;
    addDailyWin(winContent, "proud");
    setWinContent("");
    setShowWinInput(false);
    toast.success("¡Victoria registrada! +50 XP");
  };
  const { level, progress, currentLevelXp, nextLevelXp } = levelFromXp(state.xp);
  const gam = useGamification();
  const custom = useRewardsCustom();
  const upcoming = nextAchievement(gam.unlocked, gam.achievements);
  
  // Misión activa: Priorizar misiones personalizadas programadas para hoy, luego las activas normales
  const todayMissions = custom.customQuests.filter(q => q.active && q.due_date && q.due_date.split('T')[0] === today);
  const matchedCustom = todayMissions.find(q => {
    const progress = q.tracking === "manual" ? (custom.questProgress[q.id]?.progress ?? 0) : custom.computeCustomQuestProgress(q);
    return progress < q.target;
  });

  const activeQuest = matchedCustom ? {
    quest: {
      id: matchedCustom.id,
      title: matchedCustom.title,
      description: matchedCustom.description,
      emoji: matchedCustom.emoji,
      target: matchedCustom.target,
      xp: matchedCustom.xp,
      isCustom: true,
      tracking: matchedCustom.tracking
    },
    progress: matchedCustom.tracking === "manual" ? (custom.questProgress[matchedCustom.id]?.progress ?? 0) : custom.computeCustomQuestProgress(matchedCustom),
    claimed: custom.questProgress[matchedCustom.id]?.claimed ?? false,
    completed: (matchedCustom.tracking === "manual" ? (custom.questProgress[matchedCustom.id]?.progress ?? 0) : custom.computeCustomQuestProgress(matchedCustom)) >= matchedCustom.target
  } : gam.quests.find((q: any) => !q.claimed) || gam.quests[0];

  const todayEnergy = state.energy.find((e) => e.date === today);
  const energyAvg = avgEnergy(todayEnergy);
  const completedToday = state.habits.filter((h) => h.lastCompleted === today).length;
  
  const rec = todayRecommendation(state, today);
  const { tasks: smartTasks, alert: tasksAlert } = smartTaskRecommendation(state.tasks, today);
  const pendingToday = state.tasks.filter((t) => t.status !== "completed" && (isDueToday(t, today) || isOverdue(t))).length;
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground min-h-5">
          {dateLabel}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-1">
          Hola, panda <span className="inline-block animate-pulse">🐼</span>
        </h1>
      </header>

      {/* Dashboard Top Banner (Custom Mission/Level) */}
      <section className="mb-8 overflow-hidden rounded-3xl md:rounded-[40px] border border-border bg-card shadow-lg p-5 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 lg:gap-10 items-center">
          {/* Avatar and Level Circle */}
          <Link to="/rewards" className="relative group mx-auto md:mx-0">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-[6px] border-[#e8f5f1] flex items-center justify-center bg-[#00c68a] shadow-inner">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#00c68a] to-[#50e3c2] opacity-80" />
               <PandaAvatar xp={state.xp} size="xl" />
            </div>
            <div className="absolute bottom-2 right-2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border-2 border-[#e8f5f1] shadow-md flex items-center justify-center text-sm font-bold text-[#00c68a]">
              {level}
            </div>
          </Link>

          {/* Level Progress */}
          <div className="flex flex-col justify-center min-w-0 text-center md:text-left">
            <div className="flex flex-wrap items-baseline justify-center md:justify-between gap-x-3 gap-y-1 mb-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Nivel {level}</h2>
              <span className="font-display text-2xl sm:text-3xl font-bold text-[#00c68a]">{state.xp} XP</span>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {state.xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP al nivel {level + 1}
            </div>
            <div className="relative h-3 md:h-4 rounded-full bg-[#f0f2f5] overflow-hidden mb-4 md:mb-6">
              <div 
                className="absolute inset-y-0 left-0 bg-[#00c68a] transition-all duration-700 rounded-full" 
                style={{ width: `${Math.max(4, progress * 100)}%` }} 
              />
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                <span className="text-muted-foreground font-medium">
                  {gam.totalUnlocked}/{gam.totalAchievements} misiones fijas
                </span>
              </div>
              {upcoming && (
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <span className="hidden md:inline">·</span>
                  <span>Siguiente:</span>
                  <span className="text-foreground font-semibold truncate">{upcoming.emoji} {upcoming.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Mission Card */}
          {activeQuest && (
            <div className="bg-[#f7fdfb] border border-[#e1f5ef] rounded-3xl md:rounded-[32px] p-5 md:p-6 w-full lg:min-w-[320px] lg:max-w-[360px] md:col-span-2 lg:col-span-1 relative">

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#00c68a] flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-[#00c68a] uppercase tracking-wider">Misión activa</span>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full bg-[#00c68a] shadow-[0_0_8px_rgba(0,198,138,0.5)] animate-pulse" />
                <h3 className="font-display font-bold text-xl">{activeQuest.quest.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                {activeQuest.quest.description}
              </p>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-2 rounded-full bg-[#e8f5f1] overflow-hidden">
                  <div 
                    className="h-full bg-[#00c68a]" 
                    style={{ width: `${Math.min(100, (activeQuest.progress / activeQuest.quest.target) * 100)}%` }} 
                  />
                </div>
                <span className="text-sm font-bold">{Math.min(activeQuest.progress, activeQuest.quest.target)}/{activeQuest.quest.target}</span>
              </div>

              {!activeQuest.completed ? (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if ((activeQuest.quest as any).isCustom) {
                      custom.incrementQuestProgress(activeQuest.quest.id, activeQuest.quest.target, activeQuest.quest.xp, 1);
                    } else {
                      gam.incrementQuestProgress(activeQuest.quest.id, activeQuest.quest.target, activeQuest.quest.xp, 1);
                    }
                  }}
                  className="w-full py-3 rounded-2xl bg-[#e8f5f1] hover:bg-[#d5ece4] text-[#00c68a] text-sm font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  +1 Progreso
                </button>
              ) : !activeQuest.claimed && (
                <Link 
                  to="/rewards"
                  className="w-full py-3 flex items-center justify-center gap-2 rounded-2xl bg-[#00c68a] text-white text-sm font-bold uppercase tracking-wider transition-all shadow-glow animate-bounce"
                >
                  <Gift className="w-4 h-4" /> ¡Reclamar!
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Hero recommendation */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 mb-8 shadow-card">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Recomendación de hoy
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">{rec.title}</h2>
            <p className="mt-2 text-muted-foreground">{rec.reason}</p>
          </div>
          <Link
            to="/habits"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform whitespace-nowrap"
          >
            {rec.action} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* AI Daily summary */}
      {(!prefs || (prefs.global_notifications_enabled && prefs.daily_summary_enabled)) && (
        <DailySummaryCard state={state} today={today} />
      )}


      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Nivel"
          value={level}
          hint={`${state.xp - currentLevelXp} / ${nextLevelXp - currentLevelXp} XP`}
          icon={<Sparkles className="w-4 h-4" />}
          accent="xp"
        />
        <StatCard
          label="Racha Global"
          value={prefs?.task_streak || state.productivity.streak || 0}
          hint="días activos"
          icon={<Flame className="w-4 h-4" />}
          accent="xp"
        />
        <StatCard
          label="Tareas hoy"
          value={pendingToday}
          hint="por hacer / vencidas"
          icon={<CheckSquare className="w-4 h-4" />}
          accent="primary"
        />
        <StatCard
          label="Hábitos hoy"
          value={`${completedToday}/${state.habits.length}`}
          hint="completados"
          icon={<Check className="w-4 h-4" />}
          accent="primary"
        />
      </section>

      {/* Active quests widget */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <ActiveQuestsWidget />
        <IdentityFocusWidget />
      </section>

      

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 mb-8 shadow-glow overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Trophy className="w-24 h-24 text-primary rotate-12" />
        </div>
        
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">Bitácora de Victorias</h2>
          </div>
          <button 
            onClick={() => setShowWinInput(!showWinInput)}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform shadow-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showWinInput && (
          <div className="relative mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2 mb-2">
               <input
                type="text"
                value={winContent}
                onChange={(e) => setWinContent(e.target.value)}
                placeholder="¿Qué lograste hoy?"
                className="flex-1 bg-background border border-primary/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAddWin()}
                autoFocus
              />
              <button 
                onClick={handleAddWin} 
                className="bg-primary text-primary-foreground px-5 rounded-2xl font-bold flex items-center justify-center"
                title="Guardar victoria"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowWinInput(false)} className="text-xs text-muted-foreground px-3 py-1">Cancelar</button>
            </div>
          </div>
        )}

        <div className="relative flex flex-wrap gap-2">
          {todayWins.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">No has registrado victorias hoy. ¡Cualquier paso cuenta!</p>
          ) : (
            todayWins.map(win => (
              <div key={win.id} className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-3 py-2 rounded-full border border-primary/20 animate-in zoom-in-95 duration-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <span className="text-xs font-semibold whitespace-nowrap">{win.content}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Smart tasks */}
      {smartTasks.length > 0 && (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 mb-8 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Tareas recomendadas</h3>
            </div>
            <Link to="/tasks" className="text-xs text-primary hover:underline">Ver todas →</Link>
          </div>
          <p className={`text-xs mb-3 ${tasksAlert.tone === "danger" ? "text-destructive" : tasksAlert.tone === "warning" ? "text-[var(--energy)]" : "text-muted-foreground"}`}>
            {tasksAlert.message}
          </p>
          <ul className="space-y-2">
            {smartTasks.slice(0, 3).map((t) => {
              const list = state.taskLists.find((l) => l.id === t.listId);
              const overdue = isOverdue(t);
              return (
                <li key={t.id}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <button
                      onClick={() => toggleTaskComplete(t.id)}
                      className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${
                        t.priority === "high" ? "border-destructive hover:bg-destructive/10" : "border-border hover:border-primary"
                      }`}
                    >
                      <Check className="w-3 h-3 opacity-0 hover:opacity-50" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        {list && <span>{list.emoji} {list.name}</span>}
                        {t.due && dateLabel && (
                          <span className={`flex items-center gap-1 ${overdue ? "text-destructive" : ""}`}>
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(t.due).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Old Gamification widget removed and moved to top */}

      {/* Habits list - taking full width since learnings is removed */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold">Hábitos del día</h3>
          <Link to="/habits" className="text-xs text-primary hover:underline">Ver todos →</Link>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2">
          {state.habits.slice(0, 6).map((h) => {
            const done = h.lastCompleted === today;
            return (
              <li key={h.id}>
                <button
                  onClick={() => toggleHabit(h.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    done
                      ? "bg-primary/10 border-primary/40"
                      : "bg-secondary/30 border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{h.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{h.streak}d</span>
                      <span>+{h.points} XP</span>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    done ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}>
                    {done && <Check className="w-4 h-4" />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <LifeRandomizer />

    </div>
  );
}
