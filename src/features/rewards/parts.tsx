/**
 * **Feature** — Componentes (parts) del módulo **Premios**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useAppState, levelFromXp } from "@/lib/storage";
import { useGamification } from "@/hooks/use-gamification";
import { useRewardsCustom, type CustomQuest, type CustomFixedMission, type Reward } from "@/hooks/use-rewards-custom";
import { PandaAvatar } from "@/components/PandaAvatar";
import { RankBadge } from "@/components/RankBadge";
import { AVATAR_STAGES, RARITY_META, MILITARY_RANKS, avatarForLevel, rankForLevel, type FixedMissionCategory } from "@/lib/gamification";
import { RewardsEditor } from "@/components/RewardsEditor";
import { Sparkles, Lock, Trophy, Target, Gift, Plus, Pencil, EyeOff, Eye, Store, Check, ShoppingBag, Edit3, Box, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MagicInventory } from "@/components/MagicInventory";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<FixedMissionCategory, string> = {
  habits: "Hábitos", tasks: "Tareas", notes: "Notas", energy: "Energía",
  learning: "Aprendizajes", level: "Nivel", meta: "Vida", finance: "Finanzas", health: "Salud", home: "Hogar",
};
const REWARD_CAT_LABEL: Record<string, string> = {
  treat: "🍕 Capricho", experience: "🎢 Experiencia", purchase: "🛍️ Compra",
  time: "⏰ Tiempo libre", other: "✨ Otro",
};

export function RewardsPage() {
  const { state } = useAppState() as any;
  const gam = useGamification() as any;
  const custom = useRewardsCustom() as any;
  const { level, progress, currentLevelXp, nextLevelXp } = levelFromXp(state.xp);
  const { current, next } = avatarForLevel(level);

  const [filter, setFilter] = useState<FixedMissionCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "active" | "fixed">("all");
  const [editingQuest, setEditingQuest] = useState<{ open: boolean; data: Partial<CustomQuest> | null }>({ open: false, data: null });
  const [editingAch, setEditingAch] = useState<{ open: boolean; data: Partial<CustomFixedMission> | null }>({ open: false, data: null });
  const [editingReward, setEditingReward] = useState<{ open: boolean; data: Partial<Reward> | null }>({ open: false, data: null });
  const [showHidden, setShowHidden] = useState(false);

  const KIND_TO_CAT: Record<string, FixedMissionCategory> = {
    complete_tasks: "tasks", complete_high_priority: "tasks",
    habit_completions: "habits", log_energy_days: "energy",
    add_notes: "notes", add_learnings: "learning",
    log_expenses: "finance", make_card_payment: "finance", stay_under_budget: "finance",
    log_body_entries: "health", log_healthy_meals: "health", med_adherence: "health",
    home_completions: "home", home_day_complete: "home", home_week_complete: "home",
  };

  const METRIC_TO_CAT: Record<string, FixedMissionCategory> = {
    tasks_completed: "tasks", habits_completed: "habits",
    notes_created: "notes", learnings_added: "learning",
    energy_logged: "energy", high_priority_completed: "tasks",
  };

  // Misiones combinadas (default + custom)
  const visibleDefaultQuests = (typeFilter === "all" || typeFilter === "active") 
    ? gam.quests
        .filter((q: any) => showHidden || !custom.isHidden("quest", q.quest.id))
        .filter((q: any) => filter === "all" || KIND_TO_CAT[q.quest.kind] === filter)
    : [];
  const visibleCustomQuests = (typeFilter === "all" || typeFilter === "active")
    ? custom.customQuests
        .filter((q: any) => q.active)
        .filter((q: any) => filter === "all" || (q.metric && METRIC_TO_CAT[q.metric] === filter))
        .sort((a: any, b: any) => {
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return 0;
        })
    : [];

  // Logros combinados (Misiones fijas)
  const visibleDefaultAch = (typeFilter === "all" || typeFilter === "fixed")
    ? gam.achievements
        .filter((a: any) => filter === "all" || a.category === filter)
        .filter((a: any) => showHidden || !custom.isHidden("achievement", a.id))
    : [];
  const visibleCustomAch = (typeFilter === "all" || typeFilter === "fixed")
    ? custom.customFixedMissions
        .filter((a: any) => a.active)
        .filter((a: any) => filter === "all" || a.category === filter)
    : [];

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 max-w-6xl mx-auto">
      <header className="mb-6 md:mb-8 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Tu progreso</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-1">Misiones</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHidden((v) => !v)} className="shrink-0">
          {showHidden ? <Eye className="w-4 h-4 mr-1.5" /> : <EyeOff className="w-4 h-4 mr-1.5" />}
          {showHidden ? "Ocultos visibles" : "Ver ocultos"}
        </Button>
      </header>

      {/* Avatar + nivel */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 md:p-7 mb-6 md:mb-8 shadow-card">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
          <PandaAvatar xp={state.xp} size="xl" showName />
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Nivel {level} · {current.name}
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">{state.xp} XP totales</h2>
            <p className="mt-2 text-muted-foreground text-sm md:text-base">{current.description}</p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{state.xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP</span>
                <span>Nivel {level + 1}</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-700" style={{ width: `${Math.max(4, progress * 100)}%` }} />
              </div>
            </div>
            {next && (
              <p className="mt-3 text-xs text-muted-foreground">
                Próxima evolución: <span className="text-foreground font-medium">{next.emoji} {next.name}</span> al nivel {next.minLevel}
              </p>
            )}
          </div>
        </div>
      </section>

      <Tabs defaultValue="quests" className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-6">
          <TabsTrigger value="quests"><Target className="w-4 h-4 mr-1.5 hidden sm:inline" />Misiones</TabsTrigger>
          <TabsTrigger value="completed"><Check className="w-4 h-4 mr-1.5 hidden sm:inline" />Cumplidos</TabsTrigger>
          <TabsTrigger value="inventory"><Box className="w-4 h-4 mr-1.5 hidden sm:inline" />Objetos</TabsTrigger>
          <TabsTrigger value="shop"><Store className="w-4 h-4 mr-1.5 hidden sm:inline" />Tienda</TabsTrigger>
          <TabsTrigger value="evolution">🐼<span className="hidden sm:inline ml-1">Evolución</span></TabsTrigger>
        </TabsList>

        {/* ===== MISIONES Y LOGROS UNIFICADOS ===== */}
        <TabsContent value="quests" className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold">Misiones</h2>
              <p className="text-sm text-muted-foreground">{visibleCustomQuests.length + visibleDefaultQuests.length + visibleCustomAch.length + visibleDefaultAch.length} disponibles</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingQuest({ open: true, data: {} })}>
                <Plus className="w-4 h-4 mr-1.5" /> Nueva activa
              </Button>
              <Button size="sm" onClick={() => setEditingAch({ open: true, data: {} })}>
                <Plus className="w-4 h-4 mr-1.5" /> Nueva fija
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 py-2 overflow-x-auto no-scrollbar border-b border-border/30 pb-4 mb-2">
            <button onClick={() => setTypeFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === "all" ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              Todo
            </button>
            <button onClick={() => setTypeFilter("active")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === "active" ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              ⚡ Activas
            </button>
            <button onClick={() => setTypeFilter("fixed")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === "fixed" ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              🏆 Fijas
            </button>
          </div>

          <div className="flex flex-wrap gap-2 py-2 overflow-x-auto no-scrollbar">
            {(["all","habits","tasks","notes","energy","learning","level","meta","finance","health","home"] as const).map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {c === "all" ? "Todas las áreas" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom quests */}
            {visibleCustomQuests.map((q: any) => {
              const live = custom.computeCustomQuestProgress(q);
              const manual = q.tracking === "manual" ? (custom.questProgress[q.id]?.progress ?? 0) : live;
              const claimed = custom.questProgress[q.id]?.claimed ?? false;
              const completed = manual >= q.target;
              const pct = Math.min(100, (manual / q.target) * 100);
              return (
                <div key={q.id} className={`group relative rounded-2xl border p-5 transition-all ${claimed ? "bg-card/60 border-border opacity-60" : completed ? "bg-card border-primary/40 shadow-glow" : "bg-card border-border"}`}>
                  <button onClick={() => setEditingQuest({ open: true, data: q })} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{q.emoji}</span>
                    <span className="text-xs font-semibold text-[var(--xp)]">+{q.xp} XP</span>
                  </div>
                  <h3 className="font-display font-bold text-base">{q.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[1.5em]">{q.description}</p>
                  {q.due_date && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(q.due_date).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{q.tracking === "auto" ? "Auto" : "Manual"} · {q.scope}</span>
                      <span className="font-medium">{Math.min(manual, q.target)}/{q.target}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${completed ? "bg-gradient-primary" : "bg-primary/60"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {q.tracking === "manual" && !completed && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => custom.incrementQuestProgress(q.id, q.target, q.xp, 1)}>
                      +1 progreso
                    </Button>
                  )}
                  {completed && !claimed && (
                    <button onClick={() => custom.claimCustomQuest(q, manual)} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:scale-[1.02] transition-transform">
                      <Gift className="w-4 h-4" /> Reclamar
                    </button>
                  )}
                  {claimed && <div className="mt-3 text-center text-xs text-muted-foreground">✓ Reclamada</div>}
                </div>
              );
            })}

            {/* Default quests */}
            {visibleDefaultQuests.map(({ quest, progress: p, completed, claimed }: any) => {
              const pct = Math.min(100, (p / quest.target) * 100);
              const hidden = custom.isHidden("quest", quest.id);
              return (
                <div key={quest.id} className={`group relative rounded-2xl border p-5 transition-all ${hidden ? "opacity-40" : claimed ? "bg-card/60 border-border opacity-60" : completed ? "bg-card border-primary/40 shadow-glow" : "bg-card border-border"}`}>
                  <button onClick={() => custom.toggleHidden("quest", quest.id)} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity" title={hidden ? "Mostrar" : "Ocultar"}>
                    {hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{quest.emoji}</span>
                    <span className="text-xs font-semibold text-[var(--xp)]">+{quest.xp} XP</span>
                  </div>
                  <h3 className="font-display font-bold text-base">{quest.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{Math.min(p, quest.target)}/{quest.target}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${completed ? "bg-gradient-primary" : "bg-primary/60"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {!completed && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => gam.incrementQuestProgress(quest.id, quest.target, quest.xp, 1)}>
                      +1 progreso
                    </Button>
                  )}
                  {completed && !claimed && (
                    <button onClick={() => gam.claimQuest(quest)} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:scale-[1.02] transition-transform">
                      <Gift className="w-4 h-4" /> Reclamar
                    </button>
                  )}
                  {claimed && <div className="mt-4 text-center text-xs text-muted-foreground">✓ Reclamada</div>}
                </div>
              );
            })}
          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Custom achievements */}
              {visibleCustomAch.map((a: any) => {
                const meta = RARITY_META[a.rarity as keyof typeof RARITY_META];
                const customId = `custom:${a.id}`;
                const isUnlocked = gam.unlocked.has(customId);
                return (
                  <div key={a.id} className={`group relative rounded-2xl border p-4 flex flex-col gap-3 transition-all ${isUnlocked ? `bg-card border-border ring-1 ${meta.ring}` : "bg-card/40 border-border"}`}>
                    <button onClick={() => setEditingAch({ open: true, data: a })} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${isUnlocked ? "bg-secondary" : "bg-muted/30"}`}>{a.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-sm">{a.name}</h3>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold" style={{ color: meta.color, backgroundColor: `color-mix(in oklab, ${meta.color} 15%, transparent)` }}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-[var(--xp)] font-semibold">+{a.xp} XP</span>
                          {a.metric && <span className="text-[10px] text-muted-foreground">⚡ Auto</span>}
                        </div>
                      </div>
                    </div>
                    {!isUnlocked && (
                      <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => gam.unlockAchievementManually({ ...a, id: customId } as any)}>
                        Desbloquear manualmente
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Default achievements */}
              {visibleDefaultAch.map((a: any) => {
                const isUnlocked = gam.unlocked.has(a.id);
                const meta = RARITY_META[a.rarity as keyof typeof RARITY_META] || RARITY_META.common;
                const hidden = custom.isHidden("achievement", a.id);
                return (
                  <div key={a.id} className={`group relative rounded-2xl border p-4 flex flex-col gap-3 transition-all ${hidden ? "opacity-40" : isUnlocked ? `bg-card border-border ring-1 ${meta.ring}` : "bg-card/40 border-border opacity-60"}`}>
                    <div className="flex gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl bg-secondary">{a.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-sm">{a.name}</h3>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold" style={{ color: meta.color, backgroundColor: `color-mix(in oklab, ${meta.color} 15%, transparent)` }}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                        <div className="mt-1">
                          <span className="text-[11px] text-[var(--xp)] font-semibold">+{a.xp} XP</span>
                        </div>
                      </div>
                    </div>
                    {!isUnlocked && (
                      <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => gam.unlockAchievementManually(a)}>
                        Desbloquear manualmente
                      </Button>
                    )}
                    <button onClick={() => custom.toggleHidden("achievement", a.id)} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity" title={hidden ? "Mostrar" : "Ocultar"}>
                      {hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${isUnlocked ? "bg-secondary" : "bg-muted/30 grayscale"}`}>
                      {isUnlocked ? a.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm">{isUnlocked ? a.name : "???"}</h3>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold" style={{ color: meta.color, backgroundColor: `color-mix(in oklab, ${meta.color} 15%, transparent)` }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      <div className="mt-2 text-[11px] text-[var(--xp)] font-semibold">+{a.xp} XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleDefaultQuests.length === 0 && visibleCustomQuests.length === 0 && visibleDefaultAch.length === 0 && visibleCustomAch.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">No hay misiones {filter !== "all" ? `de ${CATEGORY_LABEL[filter as FixedMissionCategory].toLowerCase()}` : ""} disponibles.</p>
              </div>
            )}
        </TabsContent>

        {/* ===== INVENTARIO MÁGICO ===== */}
        <TabsContent value="inventory" className="space-y-6">
          <MagicInventory />
        </TabsContent>

        {/* ===== CUMPLIDOS ===== */}
        <TabsContent value="completed" className="space-y-8">
          {(() => {
            const achById = new Map(gam.achievements.map((a: any) => [a.id, a]));
            const customAchById = new Map(custom.customFixedMissions.map((a: any) => [a.id, a]));
            const unlockedSorted = [...gam.unlockedDetails].sort((a, b) => (b.unlockedAt || "").localeCompare(a.unlockedAt || ""));
            const claimedQuests = gam.questHistory ?? [] as any[];
            const totalAchXp = unlockedSorted.reduce((acc: any, u: any) => acc + ((achById.get(u.id) as any)?.xp ?? (customAchById.get(u.id) as any)?.xp ?? 0), 0);
            const questPool = new Map(gam.quests.map((q: any) => [q.quest.id, q.quest]));
            const totalQuestXp = claimedQuests.reduce((acc: any, q: any) => {
              const def = questPool.get(q.quest_id) as any;
              return acc + (def?.xp ?? 0);
            }, 0);
            const fmtDate = (iso: string) => {
              try {
                return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
              } catch { return iso?.slice(0, 10) ?? ""; }
            };
            return (
              <>
                {/* Resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Misiones fijas (hitos)</p>
                    <p className="font-display text-2xl font-bold mt-1">{unlockedSorted.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Misiones temporales</p>
                    <p className="font-display text-2xl font-bold mt-1">{claimedQuests.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">XP por hitos</p>
                    <p className="font-display text-2xl font-bold text-[var(--xp)] mt-1">+{totalAchXp}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">XP por misiones</p>
                    <p className="font-display text-2xl font-bold text-[var(--xp)] mt-1">+{totalQuestXp}</p>
                  </div>
                </div>

                {/* Logros desbloqueados */}
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[var(--xp)]" /> Hitos completados (fijos)
                  </h2>
                  {unlockedSorted.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Aún no has desbloqueado ningún logro. ¡Sigue avanzando! 🚀
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unlockedSorted.map((u: any) => {
                        const a = (achById.get(u.id) ?? customAchById.get(u.id)) as any;
                        if (!a) return (
                          <div key={u.id} className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                            Hito desconocido ({u.id})
                          </div>
                        );
                        const meta = RARITY_META[a?.rarity as keyof typeof RARITY_META] || RARITY_META.common;
                        return (
                          <div key={u.id} className={`rounded-2xl border p-4 flex gap-4 bg-card border-border ring-1 ${meta.ring}`}>
                            <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl bg-secondary">{a.emoji}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display font-bold text-sm">{a.name}</h3>
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold" style={{ color: meta.color, backgroundColor: `color-mix(in oklab, ${meta.color} 15%, transparent)` }}>
                                  {meta.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-[var(--xp)] font-semibold">+{a.xp} XP</span>
                                <span className="text-[10px] text-muted-foreground">🗓️ {fmtDate(u.unlockedAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Misiones reclamadas */}
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Misiones completadas (temporales)
                  </h2>
                  {claimedQuests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Aún no has reclamado ninguna misión. Cuando completes una, aparecerá aquí.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {claimedQuests.map((q: any, i: any) => {
                        const def = questPool.get(q.quest_id) as any;
                        const title = def?.title ?? q.quest_id;
                        const emoji = def?.emoji ?? "🎁";
                        const xp = def?.xp ?? 0;
                        return (
                          <div key={`${q.quest_id}-${q.week_key}-${i}`} className="rounded-2xl border border-border bg-card p-4 flex gap-3 items-center">
                            <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl bg-secondary">{emoji}</div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display font-bold text-sm">{title}</h3>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground">Semana {q.week_key}</span>
                                {xp > 0 && <span className="text-[11px] text-[var(--xp)] font-semibold">+{xp} XP</span>}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">🗓️ {fmtDate(q.updated_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* ===== TIENDA ===== */}
        <TabsContent value="shop" className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> Tienda de premios</h2>
              <p className="text-sm text-muted-foreground">Desbloquea premios al alcanzar el XP necesario · Tu XP no se gasta</p>
            </div>
            <Button size="sm" onClick={() => setEditingReward({ open: true, data: {} })}>
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo premio
            </Button>
          </div>

          {custom.rewards.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <Gift className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Aún no has creado premios</p>
              <Button onClick={() => setEditingReward({ open: true, data: {} })}>
                <Plus className="w-4 h-4 mr-1.5" /> Crear primer premio
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {custom.rewards.map((r: any) => {
                const canUnlock = state.xp >= r.cost;
                const alreadyUnlocked = custom.redemptions.some((rd: any) => rd.reward_id === r.id);
                const xpNeeded = Math.max(0, r.cost - state.xp);
                const pct = Math.min(100, (state.xp / r.cost) * 100);
                return (
                  <div key={r.id} className={`group relative rounded-2xl border p-5 transition-all ${canUnlock ? "bg-card border-primary/40 shadow-glow" : "bg-card border-border"}`}>
                    <button onClick={() => setEditingReward({ open: true, data: r })} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-4xl">{r.emoji}</span>
                      <span className="text-xs font-semibold text-[var(--xp)]">{r.cost} XP</span>
                    </div>
                    <h3 className="font-display font-bold text-base">{r.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 min-h-[1.5em]">{r.description}</p>
                    <div className="mt-1 text-[10px] text-muted-foreground">{REWARD_CAT_LABEL[r.category] ?? r.category}</div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{canUnlock ? "¡Disponible!" : `Faltan ${xpNeeded} XP`}</span>
                        <span className="font-medium">{Math.min(state.xp, r.cost)}/{r.cost}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${canUnlock ? "bg-gradient-primary" : "bg-primary/60"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canUnlock}
                      variant={canUnlock ? "default" : "outline"}
                      className="w-full mt-4"
                      onClick={() => custom.redeemReward(r, state.xp)}
                    >
                      {alreadyUnlocked ? <><Check className="w-4 h-4 mr-1.5" /> Volver a desbloquear</> : <><Gift className="w-4 h-4 mr-1.5" /> Desbloquear</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Historial */}
          {custom.redemptions.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold mb-3">Historial de canjes</h3>
              <div className="space-y-2">
                {custom.redemptions.map((rd: any) => (
                  <div key={rd.id} className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 ${rd.fulfilled ? "opacity-60" : ""}`}>
                    <span className="text-2xl">{rd.reward_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{rd.reward_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(rd.created_at).toLocaleDateString()} · {rd.cost} XP
                        {rd.fulfilled && rd.fulfilled_at && ` · cumplido ${new Date(rd.fulfilled_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Button size="sm" variant={rd.fulfilled ? "outline" : "default"} onClick={() => custom.markFulfilled(rd.id, !rd.fulfilled)}>
                      {rd.fulfilled ? "Reabrir" : <><Check className="w-4 h-4 mr-1" /> Cumplido</>}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>



        {/* ===== EVOLUCIÓN ===== */}
        <TabsContent value="evolution">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-4">🐼 Evolución del avatar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {AVATAR_STAGES.map((s) => {
              const reached = level >= s.minLevel;
              return (
                <div key={s.id} className={`rounded-2xl border p-3 text-center transition-all ${reached ? "border-primary/40 bg-card" : "border-border bg-card/40 opacity-50"}`}>
                  <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br ${s.gradient} ${reached ? "" : "grayscale"}`}>
                    <span className="text-2xl">{reached ? s.emoji : "❔"}</span>
                  </div>
                  <div className="mt-2 font-display font-bold text-xs">{reached ? s.name : "???"}</div>
                  <div className="text-[10px] text-muted-foreground">Nivel {s.minLevel}</div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Editores */}
      <RewardsEditor
        kind="reward"
        open={editingReward.open}
        initial={editingReward.data}
        onClose={() => setEditingReward({ open: false, data: null })}
        onSave={custom.saveReward}
        onDelete={custom.deleteReward}
      />
      <RewardsEditor
        kind="quest"
        open={editingQuest.open}
        initial={editingQuest.data}
        onClose={() => setEditingQuest({ open: false, data: null })}
        onSave={custom.saveQuest}
        onDelete={custom.deleteQuest}
      />
      <RewardsEditor
        kind="achievement"
        open={editingAch.open}
        initial={editingAch.data}
        onClose={() => setEditingAch({ open: false, data: null })}
        onSave={custom.saveFixedMission}
        onDelete={custom.deleteFixedMission}
      />
    </div>
  );
}
