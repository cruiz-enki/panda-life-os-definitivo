/**
 * **Dashboard Mind** — vista principal cuando el modo activo es "mind".
 * Métricas: score de identidad, journal streak, metas activas, cartas al futuro,
 * horizontes, notas recientes.
 */
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles, Target, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { useIdentity } from "@/hooks/use-identity";
import { useGrowth } from "@/hooks/use-growth";
import { useAppState } from "@/lib/storage";
import { todayCDMX } from "@/lib/date-utils";

export function MindDashboard() {
  const { profile, journal, snapshots } = useIdentity();
  const { goals, horizons, futureLetters, dreams } = useGrowth();
  const { state } = useAppState();

  const today = todayCDMX();

  // Score actual + delta 7d
  const latestSnap = snapshots[0];
  const currentScore = Math.round(latestSnap?.score ?? 0);
  const weekAgoISO = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekAgoSnap = snapshots.find((s) => s.date <= weekAgoISO);
  const scoreDelta = weekAgoSnap ? currentScore - Math.round(weekAgoSnap.score) : null;

  // Journal streak (días consecutivos hacia atrás con entrada)
  const journalDates = useMemo(() => new Set(journal.map((j) => j.date)), [journal]);
  const journalStreak = useMemo(() => {
    let s = 0;
    const d = new Date(today + "T00:00:00");
    while (journalDates.has(d.toISOString().slice(0, 10))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [journalDates, today]);
  const journaledToday = journalDates.has(today);
  const lastAlignment = journal[0]?.alignment ?? null;

  // Metas
  const goalsInProgress = goals.filter((g) => g.status === "in_progress");
  const goalsPending = goals.filter((g) => g.status === "pending" || g.status === null);
  const goalsCompleted = goals.filter((g) => g.status === "completed");

  // Cartas al futuro por desbloquear
  const upcomingLetters = futureLetters
    .filter((l) => l.unlock_date >= today)
    .sort((a, b) => a.unlock_date.localeCompare(b.unlock_date));
  const nextLetter = upcomingLetters[0];

  // Horizonte más cercano (90d)
  const horizon90 = horizons.find((h) => h.horizon_type === "90_days");

  // Sueños activos
  const activeDreams = dreams.filter((d) => d.status === "active" || d.status === null);

  // Notas recientes (últimas 3)
  const recentNotes = [...state.notes]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 3);

  return (
    <div className="space-y-4 mb-6">
      {/* Score identidad + Journal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/identity"
          className="glass-card rounded-3xl p-5 hover:shadow-glow transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identity score
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold">{currentScore}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          {scoreDelta !== null && scoreDelta !== 0 && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs ${
                scoreDelta > 0 ? "text-green-400" : "text-destructive"
              }`}
            >
              {scoreDelta > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {scoreDelta > 0 ? "+" : ""}
              {scoreDelta} vs semana pasada
            </div>
          )}
          {profile?.desired_identity && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              "{profile.desired_identity}"
            </div>
          )}
        </Link>

        <Link
          to="/introspection"
          className="glass-card rounded-3xl p-5 hover:shadow-glow transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📓</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Journal
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold">{journalStreak}</span>
            <span className="text-sm text-muted-foreground">
              día{journalStreak === 1 ? "" : "s"} seguidos
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {journaledToday ? (
              <span className="text-green-400">✓ Registrado hoy</span>
            ) : (
              <span className="text-orange-400">Pendiente hoy</span>
            )}
            {lastAlignment !== null && (
              <> · Alineación: <span className="text-foreground font-semibold">{lastAlignment}/10</span></>
            )}
          </div>
        </Link>
      </div>

      {/* Metas + horizonte + cartas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/goals" className="glass-card rounded-3xl p-4 hover:shadow-glow transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Metas
            </span>
          </div>
          <div className="text-2xl font-display font-bold">
            {goalsInProgress.length}
            <span className="text-sm text-muted-foreground font-normal"> en curso</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {goalsPending.length} pendientes · {goalsCompleted.length} logradas
          </div>
        </Link>

        <Link to="/future" className="glass-card rounded-3xl p-4 hover:shadow-glow transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🌅</span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Horizonte 90d
            </span>
          </div>
          {horizon90?.content ? (
            <p className="text-xs text-foreground line-clamp-3">{horizon90.content}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin definir. Escribe tu visión de 90 días.
            </p>
          )}
        </Link>

        <Link to="/future" className="glass-card rounded-3xl p-4 hover:shadow-glow transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Cartas al futuro
            </span>
          </div>
          <div className="text-2xl font-display font-bold">{upcomingLetters.length}</div>
          {nextLetter ? (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              Próxima: {nextLetter.unlock_date}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">Sin cartas pendientes</div>
          )}
        </Link>
      </div>

      {/* Sueños + Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold flex items-center gap-2">
              <span>✨</span> Sueños activos
            </h3>
            <Link to="/future" className="text-xs text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          {activeDreams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Escribe tus sueños en <span className="text-foreground">/future</span>.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {activeDreams.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="truncate flex-1">{d.title}</span>
                  {d.deadline && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {d.deadline.slice(0, 7)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold flex items-center gap-2">
              <span>📝</span> Notas recientes
            </h3>
            <Link to="/notes" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notas aún.</p>
          ) : (
            <ul className="space-y-1.5">
              {recentNotes.map((n) => (
                <li key={n.id} className="text-sm truncate">
                  <span className="text-muted-foreground mr-1">•</span>
                  {n.title || n.content.slice(0, 60)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
