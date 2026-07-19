/**
 * **Ruta** — Dashboard "Hoy" simplificado, estilo iOS.
 * Foco: saludo, acción rápida (Registrar), pendientes reales, nivel/misión compactos.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAppState, levelFromXp, todayRecommendation, avgEnergy, smartTaskRecommendation, isOverdue, isDueToday } from "@/lib/storage";
import { useGamification } from "@/hooks/use-gamification";
import { useRewardsCustom } from "@/hooks/use-rewards-custom";
import { PandaAvatar } from "@/components/PandaAvatar";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { InstallPWA } from "@/components/InstallPWA";
import { ModeDashboardHero } from "@/components/ModeDashboardHero";
import { useLifeMode } from "@/hooks/use-life-mode";
import { MoneyDashboard } from "@/components/dashboards/MoneyDashboard";
import { HealthDashboard } from "@/components/dashboards/HealthDashboard";
import { ProductivityDashboard } from "@/components/dashboards/ProductivityDashboard";
import {
  Sparkles,
  Flame,
  Check,
  CheckSquare,
  Calendar as CalendarIcon,
  Target,
  Gift,
  Plus,
  Star,
  ChevronRight,
  ChevronDown,
  PenLine,
  Battery,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoy · Panda's LIFE OS" },
      { name: "description", content: "Tu día en una vista: qué registrar, qué falta y cómo vas." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, today, toggleHabit, toggleTaskComplete, addDailyWin } = useAppState();
  const [winContent, setWinContent] = useState("");
  const [showWinInput, setShowWinInput] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [prefs, setPrefs] = useState<any>(null);
  const todayWins = useMemo(() => (state.dailyWins || []).filter(w => w.date === today), [state.dailyWins, today]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", session.user.id).maybeSingle();
      if (data) setPrefs(data);
    })();
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
  const completedHabits = state.habits.filter((h) => h.lastCompleted === today).length;
  const totalHabits = state.habits.length;

  const rec = todayRecommendation(state, today);
  const { tasks: smartTasks } = smartTaskRecommendation(state.tasks, today);
  const pendingTasks = state.tasks
    .filter((t) => t.status !== "completed" && (isDueToday(t, today) || isOverdue(t)))
    .sort((a, b) => (isOverdue(a) ? -1 : 1) - (isOverdue(b) ? -1 : 1));
  const pendingHabits = state.habits.filter((h) => h.lastCompleted !== today);

  const [dateLabel, setDateLabel] = useState("");
  const [greeting, setGreeting] = useState("Hola");
  useEffect(() => {
    const now = new Date();
    setDateLabel(now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
    const h = now.getHours();
    setGreeting(h < 6 ? "Buenas noches" : h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
  }, []);

  const questPct = activeQuest ? Math.min(100, (activeQuest.progress / activeQuest.quest.target) * 100) : 0;

  const { mode } = useLifeMode(); // suscribe cambios de modo para re-render del hero

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto pb-24">
      {/* Header minimal */}
      <header className="mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{dateLabel}</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">
          {greeting}, panda 🐼
        </h1>
      </header>

      {/* Hero por modo (visible cuando mode !== normal) */}
      <ModeDashboardHero />

      {mode === "money" ? (
        <MoneyDashboard />
      ) : mode === "health" ? (
        <HealthDashboard />
      ) : (
        <>


      {/* CTA principal: Registrar */}
      <Link
        to="/log"
        className="group relative overflow-hidden flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-5 py-4 mb-5 shadow-glow active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-base leading-tight">Registrar mi día</div>
            <div className="text-xs opacity-90">Mood · Sueño · Hábitos · Comidas</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-90 group-hover:translate-x-1 transition-transform" />
      </Link>




      {/* Recomendación de hoy — compacta */}
      <Link
        to="/habits"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 mb-5 hover:border-primary/40 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">Recomendación</div>
          <div className="font-semibold text-sm truncate">{rec.title}</div>
          <div className="text-xs text-muted-foreground truncate">{rec.reason}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Link>

      {/* Pendientes hoy: tareas + hábitos consolidados */}
      <section className="rounded-2xl border border-border bg-card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold">Pendientes hoy</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{pendingTasks.length}</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3" />{completedHabits}/{totalHabits}</span>
            {energyAvg !== null && <span className="flex items-center gap-1"><Battery className="w-3 h-3" />{energyAvg.toFixed(1)}</span>}
          </div>
        </div>

        {pendingTasks.length === 0 && pendingHabits.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-1">🎉</div>
            <p className="text-sm text-muted-foreground">Todo listo por hoy</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {pendingTasks.slice(0, 3).map((t) => {
              const list = state.taskLists.find((l) => l.id === t.listId);
              const overdue = isOverdue(t);
              return (
                <li key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                  <button
                    onClick={() => toggleTaskComplete(t.id)}
                    className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${
                      t.priority === "high" ? "border-destructive" : "border-muted-foreground/40 hover:border-primary"
                    }`}
                    aria-label="Completar tarea"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      {list && <span className="truncate">{list.emoji} {list.name}</span>}
                      {t.due && (
                        <span className={`flex items-center gap-0.5 ${overdue ? "text-destructive" : ""}`}>
                          <CalendarIcon className="w-2.5 h-2.5" />
                          {new Date(t.due).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {pendingHabits.slice(0, Math.max(0, 5 - Math.min(pendingTasks.length, 3))).map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => toggleHabit(h.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-5 h-5 shrink-0 rounded-md border-2 border-muted-foreground/40 hover:border-primary" />
                  <span className="text-lg leading-none">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{h.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />{h.streak}d</span>
                      <span>+{h.points} XP</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {(pendingTasks.length + pendingHabits.length) > 5 && (
          <div className="flex gap-2 mt-3">
            <Link to="/tasks" className="flex-1 text-center text-xs font-medium text-primary hover:underline py-1.5">Ver tareas →</Link>
            <Link to="/habits" className="flex-1 text-center text-xs font-medium text-primary hover:underline py-1.5">Ver hábitos →</Link>
          </div>
        )}
      </section>

      {/* Victorias del día — colapsable */}
      <section className="rounded-2xl border border-border bg-card p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <h2 className="font-display text-sm font-bold">Victorias de hoy</h2>
            {todayWins.length > 0 && (
              <span className="text-[11px] font-bold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-2 py-0.5">
                {todayWins.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowWinInput(!showWinInput)}
            className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            aria-label="Añadir victoria"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showWinInput && (
          <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="text"
              value={winContent}
              onChange={(e) => setWinContent(e.target.value)}
              placeholder="¿Qué lograste?"
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-primary/20"
              onKeyDown={(e) => e.key === "Enter" && handleAddWin()}
              autoFocus
            />
            <button onClick={handleAddWin} className="bg-primary text-primary-foreground px-4 rounded-xl font-bold">
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}

        {todayWins.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {todayWins.map(win => (
              <div key={win.id} className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                <span className="text-xs font-medium">✨ {win.content}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ver más — resumen IA y otros */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground py-3 mb-2"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
        {showMore ? "Ocultar" : "Ver más"}
      </button>

      {showMore && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
          {(!prefs || (prefs.global_notifications_enabled && prefs.daily_summary_enabled)) && (
            <DailySummaryCard state={state} today={today} />
          )}
          {smartTasks.length > 3 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm font-bold">Más tareas sugeridas</h3>
                <Link to="/tasks" className="text-xs text-primary hover:underline">Ver todas →</Link>
              </div>
              <ul className="space-y-1">
                {smartTasks.slice(3, 6).map(t => (
                  <li key={t.id} className="text-sm text-muted-foreground truncate">• {t.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
