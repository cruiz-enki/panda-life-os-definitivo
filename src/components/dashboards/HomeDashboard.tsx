/**
 * **Dashboard Home** — vista principal cuando el modo activo es "home".
 * Métricas: tareas de hoy, semanales, servicios, mantenimiento, vehículos,
 * mascotas e inventario con garantías próximas.
 */
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, AlertTriangle, Wrench, Zap, Car, PawPrint, Package, Plus } from "lucide-react";
import { useHome } from "@/hooks/use-home";
import { useServices } from "@/hooks/use-services";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useVehicles } from "@/hooks/use-vehicles";
import { usePets } from "@/hooks/use-pets";
import { useHomeInventory } from "@/hooks/use-home-inventory";
import { MobileCollapsibleSection } from "@/components/MobileCollapsibleSection";

function daysUntil(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

export function HomeDashboard() {
  const { snapshot, todayList, weeklyList, potentialXpToday } = useHome();
  const { services } = useServices();
  const { maintenance } = useMaintenance();
  const { vehicles, upcoming: vehicleUpcoming } = useVehicles();
  const { pets } = usePets();
  const { items: inventory } = useHomeInventory();

  const todayPct = snapshot.todayTotal > 0 ? (snapshot.todayDone / snapshot.todayTotal) * 100 : 0;
  const weekPct = snapshot.weeklyTasksTotal > 0 ? (snapshot.weeklyTasksDone / snapshot.weeklyTasksTotal) * 100 : 0;

  const activeServices = services.filter((s) => s.status === "active");
  const monthlyCost = activeServices.reduce((acc, s) => acc + (s.monthly_cost || 0), 0);
  const today = new Date();
  const currentDay = today.getDate();
  const upcomingCharges = activeServices
    .filter((s) => s.due_day && s.due_day >= currentDay && s.due_day <= currentDay + 7)
    .sort((a, b) => (a.due_day || 0) - (b.due_day || 0))
    .slice(0, 3);

  const pendingMaintenance = maintenance.filter((m) => m.status === "pending" || m.status === "scheduled");

  const vehiclesSoon = vehicleUpcoming.filter((e) => e.daysUntil <= 60 && e.daysUntil >= -7).slice(0, 3);

  const warrantiesSoon = useMemo(() => {
    return inventory
      .filter((i) => i.warranty_expiry)
      .map((i) => ({ ...i, days: daysUntil(i.warranty_expiry) ?? 9999 }))
      .filter((i) => i.days >= 0 && i.days <= 60)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [inventory]);

  const pendingToday = todayList.filter((x) => !x.completed).slice(0, 4);

  return (
    <div className="space-y-3">
      {/* Hero: tareas del hogar hoy */}
      <Link
        to="/home"
        className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 hover:border-primary/50 transition-colors"
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Hogar · tareas hoy</div>
        <div className="flex items-end gap-2 mt-1">
          <div className="font-display text-3xl font-bold">{snapshot.todayDone}</div>
          <div className="text-muted-foreground pb-1">/ {snapshot.todayTotal}</div>
          {snapshot.dayComplete && <span className="ml-auto text-xs font-bold text-green-500">✓ Día completo</span>}
        </div>
        <div className="mt-2 h-1.5 bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${todayPct}%` }} />
        </div>
        {potentialXpToday > 0 && (
          <div className="text-xs text-muted-foreground mt-2">+{potentialXpToday} XP potencial</div>
        )}
      </Link>

      {/* Pendientes del día */}
      {pendingToday.length > 0 && (
        <MobileCollapsibleSection
          title="Pendientes del hogar"
          emoji="🧽"
          badge={pendingToday.length}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-xs font-bold text-muted-foreground uppercase tracking-widest">Tareas</div>
            <Link to="/home" className="text-xs text-primary hover:underline">Ir a hogar →</Link>
          </div>

          <ul className="space-y-1.5">
            {pendingToday.map((x) => (
              <li key={x.task.id} className="flex items-center gap-2 text-sm">
                <span className="text-base leading-none">{x.task.emoji || "🧽"}</span>
                <span className="truncate flex-1">{x.task.title}</span>
                <span className="text-[10px] text-muted-foreground">+{x.task.xp_reward} XP</span>
              </li>
            ))}
          </ul>
        </MobileCollapsibleSection>
      )}

      {/* Grid métricas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Semanales */}
        <Link to="/home" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Semanales</div>
          <div className="font-display text-2xl font-bold mt-1">
            {snapshot.weeklyTasksDone}<span className="text-muted-foreground text-base">/{snapshot.weeklyTasksTotal}</span>
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${weekPct}%` }} />
          </div>
        </Link>

        {/* Servicios: costo mensual */}
        <Link to="/services" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3" /> Servicios/mes
          </div>
          <div className="font-display text-2xl font-bold mt-1">
            ${monthlyCost.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{activeServices.length} activos</div>
        </Link>
      </div>

      {/* Próximos cargos */}
      {upcomingCharges.length > 0 && (
        <MobileCollapsibleSection
          title="Próximos cargos (7d)"
          emoji="⚠️"
          badge={upcomingCharges.length}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-xs font-bold text-muted-foreground uppercase tracking-widest">Servicios</div>
            <Link to="/services" className="text-xs text-primary hover:underline">Ver servicios →</Link>
          </div>

          <ul className="space-y-1.5">
            {upcomingCharges.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <span className="text-base leading-none">{s.emoji || "🧾"}</span>
                <span className="truncate flex-1">{s.name}</span>
                <span className="text-xs text-muted-foreground">día {s.due_day}</span>
                <span className="text-xs font-semibold">${s.monthly_cost.toLocaleString("es-MX")}</span>
              </li>
            ))}
          </ul>
        </MobileCollapsibleSection>
      )}

      {/* Mantenimiento pendiente */}
      {pendingMaintenance.length > 0 && (
        <MobileCollapsibleSection
          title="Mantenimiento"
          emoji="🔧"
          badge={pendingMaintenance.length}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-xs font-bold text-muted-foreground uppercase tracking-widest">Pendientes / Programados</div>
            <Link to="/maintenance" className="text-xs text-primary hover:underline">Ver todo →</Link>
          </div>
        </MobileCollapsibleSection>
      )}


      {/* Vehículos - próximos vencimientos */}
      {vehicles.length > 0 && (
        <MobileCollapsibleSection
          title={`Vehículos (${vehicles.length})`}
          emoji="🚗"
          badge={vehiclesSoon.length > 0 ? vehiclesSoon.length : undefined}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-xs font-bold text-muted-foreground uppercase tracking-widest">Vencimientos</div>
            <Link to="/vehicles" className="text-xs text-primary hover:underline">Ver garage →</Link>
          </div>

          {vehiclesSoon.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin vencimientos próximos ✓</p>
          ) : (
            <ul className="space-y-1.5">
              {vehiclesSoon.map((e) => {
                const v = vehicles.find((x) => x.id === e.vehicle_id);
                const overdue = e.daysUntil < 0;
                return (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    <span className="text-base leading-none">{v?.emoji || "🚗"}</span>
                    <span className="truncate flex-1">{e.title}</span>
                    <span className={`text-xs font-medium ${overdue ? "text-destructive" : e.daysUntil <= 15 ? "text-yellow-500" : "text-muted-foreground"}`}>
                      {overdue ? `${Math.abs(e.daysUntil)}d atraso` : `en ${e.daysUntil}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </MobileCollapsibleSection>
      )}

      {/* Fila: mascotas + inventario */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/family" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <PawPrint className="w-3 h-3" /> Hocicos
          </div>
          <div className="font-display text-2xl font-bold mt-1">{pets.length}</div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {pets.slice(0, 3).map((p) => p.emoji || "🐾").join(" ") || "—"}
          </div>
        </Link>

        <Link to="/inventory" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" /> Inventario
          </div>
          <div className="font-display text-2xl font-bold mt-1">{inventory.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {warrantiesSoon.length > 0 ? `${warrantiesSoon.length} garantías ⚠️` : "sin alertas"}
          </div>
        </Link>
      </div>

      {/* Garantías por expirar */}
      {warrantiesSoon.length > 0 && (
        <MobileCollapsibleSection
          title="Garantías por expirar"
          emoji="⚠️"
          badge={warrantiesSoon.length}
          className="border-yellow-500/30 bg-yellow-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-xs font-bold text-yellow-600 uppercase tracking-widest">Alertas</div>
            <Link to="/inventory" className="text-xs text-primary hover:underline">Ver inventario →</Link>
          </div>

          <ul className="space-y-1.5">
            {warrantiesSoon.map((i) => (
              <li key={i.id} className="flex items-center gap-2 text-sm">
                <span className="truncate flex-1">{i.name}</span>
                <span className="text-xs font-medium text-yellow-600">en {i.days}d</span>
              </li>
            ))}
          </ul>
        </MobileCollapsibleSection>
      )}
    </div>
  );
}
