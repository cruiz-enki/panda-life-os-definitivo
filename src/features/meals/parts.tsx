/**
 * **Feature** — Componentes (parts) del módulo **Comidas**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Utensils, Plus, Trash2, Pencil, ChefHat, ShoppingCart, Calendar as CalendarIcon,
  CheckCircle2, RefreshCw, Sparkles, Package,
} from "lucide-react";
import { useMeals } from "@/hooks/use-meals";
import { HealthHeader } from "@/components/health/HealthHeader";
import { useAppState } from "@/lib/storage";
import {
  PLAN_MEAL_LABEL, PLAN_MEAL_ORDER, DISH_TYPE_LABEL, DISH_CLASS_META,
  SHOPPING_CATEGORY_LABEL, SHOPPING_CATEGORY_EMOJI,
  weekStartOf, addDaysISO,
  type MealDish, type DishType, type DishClassification, type Ingredient,
  type ShoppingCategory, type PlanMealType, type MealIngredient,
} from "@/lib/meals-types";
import { humanDateLabel } from "@/lib/date-utils";
import { toast } from "sonner";



const DOW_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];


export function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</div>
        <div className="font-display text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// HOY
// ============================================================
export function TodayTab({ m, addBonusXp }: { m: ReturnType<typeof useMeals>; addBonusXp: (n: number) => void }) {
  const entries = m.todayPlan;
  const byType = new Map(entries.map(e => [e.meal_type, e]));
  const potentialXp = entries.reduce((acc, e) => {
    const dish = m.dishById(e.dish_id);
    return acc + (e.completed ? 0 : (dish?.xp_reward ?? 5));
  }, 0);
  const allDone = entries.length >= 3 && entries.every(e => e.completed);

  const toggle = async (id: string) => {
    const xp = await m.togglePlanComplete(id);
    if (xp) {
      addBonusXp(xp);
      toast.success(xp > 0 ? `+${xp} XP` : `${xp} XP`);
    }
    // Bonus día completo
    const after = m.planByDate(m.today);
    if (after.length > 0 && after.every(e => e.completed)) {
      addBonusXp(20);
      toast.success("🎉 Día completo: +20 XP bonus");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{humanDateLabel(m.today)}</span>
            <Badge variant="secondary">+{potentialXp} XP potencial</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay plan para hoy. Configúralo en la pestaña <b>Semana</b>.</p>
          )}
          {PLAN_MEAL_ORDER.map((mt) => {
            const e = byType.get(mt);
            if (!e) {
              const isDefaultTarget = mt === "cena" || mt === "snack";
              if (mt === "desayuno") {
                return (
                  <div key="suggest-breakfast" className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-secondary/10">
                    <span className="text-sm text-muted-foreground">Sin desayuno planeado</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={async () => {
                      const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      const dish =
                        m.dishes.find(d => norm(d.name).includes("huevos") && norm(d.name).includes("estrellado")) ||
                        m.dishes.find(d => norm(d.name).includes("huevos") && norm(d.name).includes("espinaca")) ||
                        m.dishes.find(d => norm(d.name).includes("huevos"));
                      if (dish) {
                        await m.setPlanEntry(m.today, "desayuno", dish.id, "");
                        toast.success("Desayuno agregado");
                      } else {
                        toast.error("No se encontró un platillo de huevos en tu catálogo");
                      }
                    }}>
                      <Sparkles className="w-3 h-3" /> Agregar huevos...
                    </Button>
                  </div>
                );
              }
              if (isDefaultTarget) {
                const label = mt === "cena" ? "cena" : "snack";
                return (
                  <div key={`suggest-${mt}`} className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-secondary/10">
                    <span className="text-sm text-muted-foreground">Sin {label} planeado</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={async () => {
                      const dish = m.dishes.find(d => {
                        const n = d.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        return d.allowed_meal_types?.includes(mt) || 
                          ((n.includes("batido") || n.includes("bebida") || n.includes("shake")) && n.includes("proteina"));
                      });
                      if (dish) {
                        await m.setPlanEntry(m.today, mt, dish.id, "");
                        toast.success(`${mt.charAt(0).toUpperCase() + mt.slice(1)} agregado`);
                      } else {
                        toast.error("No se encontró el batido de proteína en tu catálogo");
                      }
                    }}>
                      <Sparkles className="w-3 h-3" /> Agregar batido...
                    </Button>
                  </div>
                );
              }
              if (mt === "comida") {
                return (
                  <div key="suggest-comida" className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-secondary/10">
                    <span className="text-sm text-muted-foreground">Sin comida planeada</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={async () => {
                      const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      const candidates = m.dishes.filter(d =>
                        d.allowed_meal_types?.includes("comida") ||
                        (!d.allowed_meal_types?.length && d.dish_type !== "snack" &&
                          !norm(d.name).includes("huevos") &&
                          !((norm(d.name).includes("batido") || norm(d.name).includes("shake")) && norm(d.name).includes("proteina")) &&
                          !norm(d.name).includes("creatina") && !norm(d.name).includes("electrolito"))
                      );
                      const dish = candidates[Math.floor(Math.random() * candidates.length)];
                      if (dish) {
                        await m.setPlanEntry(m.today, "comida", dish.id, "");
                        toast.success("Comida agregada");
                      } else {
                        toast.error("No se encontró un platillo para la comida en tu catálogo");
                      }
                    }}>
                      <Sparkles className="w-3 h-3" /> Agregar comida...
                    </Button>
                  </div>
                );
              }
              return null;
            }
            const dish = m.dishById(e.dish_id);
            const meta = dish ? DISH_CLASS_META[dish.classification] : null;
            return (
              <div key={e.id} className={`flex items-start gap-3 p-3 rounded-lg border ${e.completed ? "bg-secondary/40 border-primary/30" : "bg-card"}`}>
                <Checkbox checked={e.completed} onCheckedChange={() => toggle(e.id)} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{PLAN_MEAL_LABEL[mt]}</Badge>
                    {meta && <span className="text-xs">{meta.emoji} {meta.label}</span>}
                  </div>
                  <div className={`mt-1 font-medium ${e.completed ? "line-through text-muted-foreground" : ""}`}>
                    {dish?.emoji ?? "🍽️"} {dish?.name || e.custom_name || "Sin asignar"}
                  </div>
                  {dish?.preparation && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dish.preparation}</p>
                  )}
                </div>
                {!e.completed && <span className="text-xs text-muted-foreground">+{dish?.xp_reward ?? 5} XP</span>}
              </div>
            );
          })}
          {allDone && (
            <div className="text-center text-sm text-primary font-medium py-2">
              ✨ Día completo, ¡bien hecho!
            </div>
          )}
        </CardContent>
      </Card>
      <DailySupplements today={m.today} addBonusXp={addBonusXp} />
    </div>
  );
}

// Suplementos diarios: creatina + electrolitos (+4 XP c/u).
// Estado persistido en localStorage por fecha.
function DailySupplements({ today, addBonusXp }: { today: string; addBonusXp: (n: number) => void }) {
  const items = [
    { key: "creatina", label: "Creatina", emoji: "💪" },
    { key: "electrolitos", label: "Electrolitos", emoji: "⚡" },
  ];
  const storageKey = `daily-supplements:${today}`;
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setDone(raw ? JSON.parse(raw) : {});
    } catch { setDone({}); }
  }, [storageKey]);

  const toggle = (key: string) => {
    setDone(prev => {
      const wasDone = !!prev[key];
      const next = { ...prev, [key]: !wasDone };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* noop */ }
      const delta = wasDone ? -4 : 4;
      addBonusXp(delta);
      toast.success(delta > 0 ? `+${delta} XP` : `${delta} XP`);
      return next;
    });
  };

  const pendingXp = items.filter(i => !done[i.key]).length * 4;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Suplementos diarios</span>
          <Badge variant="secondary">+{pendingXp} XP potencial</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(it => {
          const isDone = !!done[it.key];
          return (
            <div key={it.key} className={`flex items-center gap-3 p-3 rounded-lg border ${isDone ? "bg-secondary/40 border-primary/30" : "bg-card"}`}>
              <Checkbox checked={isDone} onCheckedChange={() => toggle(it.key)} />
              <div className={`flex-1 font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
                {it.emoji} {it.label}
              </div>
              {!isDone && <span className="text-xs text-muted-foreground">+4 XP</span>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// SEMANA
// ============================================================
export function WeekTab({ m }: { m: ReturnType<typeof useMeals> }) {
  const [weekStart, setWeekStart] = useState(m.currentWeek);
  const days = m.weekDays(weekStart);

  const fillDefaults = async () => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const breakfast = m.dishes.find(d =>
      d.active !== false &&
      (d.allowed_meal_types?.includes("desayuno") || (norm(d.name).includes("huevos") && norm(d.name).includes("espinaca")))
    );
    const dinner = m.dishes.find(d =>
      d.active !== false &&
      (d.allowed_meal_types?.includes("cena") || ((norm(d.name).includes("batido") || norm(d.name).includes("shake") || norm(d.name).includes("bebida")) && norm(d.name).includes("proteina")))
    );
    const snack = m.dishes.find(d =>
      d.active !== false &&
      (d.allowed_meal_types?.includes("snack") || (norm(d.name).includes("yogur") && norm(d.name).includes("griego")))
    );

    // Candidatos de comida: cualquier platillo activo que explícitamente sea para "comida"
    // o que no tenga restricciones y no sea uno de los predeterminados encontrados arriba
    const excludedIds = new Set([breakfast?.id, dinner?.id, snack?.id].filter(Boolean) as string[]);
    const lunchCandidates = m.dishes.filter(d =>
      d.active !== false &&
      (d.allowed_meal_types?.includes("comida") || (!d.allowed_meal_types?.length && !excludedIds.has(d.id) && d.dish_type !== "snack"))
    );

    if (!breakfast && !dinner && !snack && lunchCandidates.length === 0) {
      toast.error("No se encontraron platillos predeterminados (Huevos, Batido, Yogur griego o comidas)");
      return;
    }

    let count = 0;
    const promises: Promise<unknown>[] = [];

    for (const d of days) {
      if (breakfast && !m.plan.find(p => p.date === d && p.meal_type === "desayuno")) {
        promises.push(m.setPlanEntry(d, "desayuno", breakfast.id, ""));
        count++;
      }
      if (lunchCandidates.length > 0 && !m.plan.find(p => p.date === d && p.meal_type === "comida")) {
        const pick = lunchCandidates[Math.floor(Math.random() * lunchCandidates.length)];
        promises.push(m.setPlanEntry(d, "comida", pick.id, ""));
        count++;
      }
      if (dinner && !m.plan.find(p => p.date === d && p.meal_type === "cena")) {
        promises.push(m.setPlanEntry(d, "cena", dinner.id, ""));
        count++;
      }
      if (snack && !m.plan.find(p => p.date === d && p.meal_type === "snack")) {
        promises.push(m.setPlanEntry(d, "snack", snack.id, ""));
        count++;
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      toast.success(`✨ Agregados ${count} platos predeterminados`);
    } else {
      toast.info("Ya tienes el plan lleno para esta semana");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>← Semana</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(m.currentWeek)}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>Semana →</Button>
          <Button variant="secondary" size="sm" onClick={fillDefaults} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Plan predeterminado
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Semana del {weekStart}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px] grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] gap-1">
          <div></div>
          {days.map((d, i) => {
            const comp = m.dayCompletion(d);
            return (
              <div key={d} className="text-center p-2 rounded-md bg-secondary/40">
                <div className="text-xs text-muted-foreground">{DOW_SHORT[i]}</div>
                <div className="font-medium">{d.slice(8)}</div>
                {comp.total > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{comp.done}/{comp.total}</div>
                )}
              </div>
            );
          })}
          {PLAN_MEAL_ORDER.map((mt) => (
            <FragmentRow key={mt} mt={mt} days={days} m={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FragmentRow({ mt, days, m }: { mt: PlanMealType; days: string[]; m: ReturnType<typeof useMeals> }) {
  return (
    <>
      <div className="p-2 text-sm font-medium self-center">{PLAN_MEAL_LABEL[mt]}</div>
      {days.map((d) => (
        <PlanCell key={d + mt} date={d} mt={mt} m={m} />
      ))}
    </>
  );
}

export function PlanCell({ date, mt, m }: { date: string; mt: PlanMealType; m: ReturnType<typeof useMeals> }) {
  const entry = m.plan.find(p => p.date === date && p.meal_type === mt);
  const dish = entry ? m.dishById(entry.dish_id) : null;
  const [open, setOpen] = useState(false);
  const [dishId, setDishId] = useState<string>(entry?.dish_id ?? "");
  const [custom, setCustom] = useState(entry?.custom_name ?? "");

  const save = async () => {
    await m.setPlanEntry(date, mt, dishId || null, custom);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setDishId(entry?.dish_id ?? ""); setCustom(entry?.custom_name ?? ""); } }}>
      <DialogTrigger asChild>
        <button className={`p-1.5 text-left text-xs min-h-[60px] rounded-md border transition-colors ${entry?.completed ? "bg-primary/10 border-primary/40" : entry ? "bg-card hover:bg-secondary/50" : "bg-secondary/20 border-dashed hover:bg-secondary/40"}`}>
          {dish ? (
            <div className="line-clamp-3"><span className="mr-1">{dish.emoji}</span>{dish.name}</div>
          ) : entry?.custom_name ? (
            <div className="line-clamp-3 italic">{entry.custom_name}</div>
          ) : (
            <div className="text-muted-foreground">+ asignar</div>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{PLAN_MEAL_LABEL[mt]} · {date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Platillo</Label>
            <Select value={dishId || "none"} onValueChange={(v) => setDishId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sin platillo —</SelectItem>
                {m.dishes
                  .filter(d => !d.allowed_meal_types?.length || d.allowed_meal_types.includes(mt))
                  .map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.emoji} {d.name}</SelectItem>
                  ))}
                {m.dishes.some(d => d.allowed_meal_types?.length && !d.allowed_meal_types.includes(mt)) && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-t mt-1">Otros (no sugeridos)</div>
                    {m.dishes
                      .filter(d => d.allowed_meal_types?.length && !d.allowed_meal_types.includes(mt))
                      .map(d => (
                        <SelectItem key={d.id} value={d.id} className="opacity-60">{d.emoji} {d.name}</SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>O texto libre</Label>
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ej. Sobras del meal prep" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {entry && (
            <Button variant="ghost" onClick={async () => { await m.removePlanEntry(entry.id); setOpen(false); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Quitar
            </Button>
          )}
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MEAL PREP
// ============================================================
export function PrepTab({ m }: { m: ReturnType<typeof useMeals> }) {
  const [open, setOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  const [name, setName] = useState("");
  const [prepDate, setPrepDate] = useState(m.today);
  const [days, setDays] = useState(3);
  const [servings, setServings] = useState(4);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setIngredientId(""); setName(""); setPrepDate(m.today);
    setDays(3); setServings(4); setNotes("");
  };

  const save = async () => {
    const ing = m.ingredients.find(i => i.id === ingredientId);
    await m.createBatch({
      ingredient_id: ingredientId || null,
      dish_id: null,
      name: name || ing?.name || "Preparación",
      prep_date: prepDate,
      days_lasting: days,
      servings_total: servings,
      servings_remaining: servings,
      notes,
    });
    setOpen(false); reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Preparaciones en bloque</h3>
          <p className="text-xs text-muted-foreground">Basadas en ingredientes de tu catálogo.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva prep</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar meal prep</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Ingrediente</Label>
                {m.ingredients.length === 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Crea ingredientes en la pestaña <b>Ingredientes</b> primero.
                  </p>
                ) : (
                  <Select value={ingredientId} onValueChange={(v) => {
                    setIngredientId(v);
                    const ing = m.ingredients.find(i => i.id === v);
                    if (ing && !name) setName(ing.name);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un ingrediente" /></SelectTrigger>
                    <SelectContent>
                      {m.ingredients.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.emoji} {i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Nombre (opcional)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pollo asado batch" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={prepDate} onChange={(e) => setPrepDate(e.target.value)} />
                </div>
                <div>
                  <Label>Días que rinde</Label>
                  <Input type="number" min={1} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <Label>Porciones</Label>
                  <Input type="number" min={1} value={servings} onChange={(e) => setServings(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={!ingredientId}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {m.batches.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin preparaciones registradas.</p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {m.batches.map(b => {
          const ing = m.ingredientById(b.ingredient_id);
          const dish = m.dishById(b.dish_id);
          const emoji = ing?.emoji ?? dish?.emoji ?? "📦";
          const remainingPct = b.servings_total > 0 ? (b.servings_remaining / b.servings_total) * 100 : 0;
          const expiresOn = addDaysISO(b.prep_date, b.days_lasting);
          const expired = expiresOn < m.today;
          return (
            <Card key={b.id} className={expired ? "opacity-60" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{emoji} {b.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Preparado: {b.prep_date} · Vence: {expiresOn}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => m.deleteBatch(b.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${remainingPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{b.servings_remaining}/{b.servings_total} porciones</span>
                  <Button size="sm" variant="outline" disabled={b.servings_remaining === 0}
                    onClick={() => m.consumeBatchServing(b.id)}>
                    Consumir 1
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PLATILLOS
// ============================================================
export function DishesTab({ m }: { m: ReturnType<typeof useMeals> }) {
  const [editing, setEditing] = useState<MealDish | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (d: MealDish) => { setEditing(d); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Catálogo de platillos</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo</Button>
      </div>

      {m.dishes.length === 0 && (
        <p className="text-sm text-muted-foreground">Aún no tienes platillos. Crea el primero.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {m.dishes.map(d => {
          const meta = DISH_CLASS_META[d.classification];
          return (
            <Card key={d.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{d.emoji} {d.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <Badge variant="secondary" className="mr-1">{DISH_TYPE_LABEL[d.dish_type]}</Badge>
                      {meta.emoji} {meta.label} · {d.prep_minutes}min · +{d.xp_reward}xp
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => m.deleteDish(d.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                {d.ingredients.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <b>Ingredientes:</b> {d.ingredients.map(i => i.name).join(", ")}
                  </p>
                )}
                {d.preparation && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{d.preparation}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DishEditor open={open} onOpenChange={setOpen} dish={editing} m={m} />
    </div>
  );
}

export function DishEditor({ open, onOpenChange, dish, m }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  dish: MealDish | null; m: ReturnType<typeof useMeals>;
}) {
  const [name, setName] = useState(dish?.name ?? "");
  const [emoji, setEmoji] = useState(dish?.emoji ?? "🍽️");
  const [type, setType] = useState<DishType>(dish?.dish_type ?? "quick");
  const [cls, setCls] = useState<DishClassification>(dish?.classification ?? "saludable");
  const [prep, setPrep] = useState(dish?.preparation ?? "");
  const [minutes, setMinutes] = useState(dish?.prep_minutes ?? 10);
  const [servings, setServings] = useState(dish?.servings ?? 1);
  const [xp, setXp] = useState(dish?.xp_reward ?? 5);
  const [ings, setIngs] = useState<Ingredient[]>(dish?.ingredients ?? []);
  const [allowedMeals, setAllowedMeals] = useState<PlanMealType[]>(dish?.allowed_meal_types ?? []);

  // reset on open
  useMemo(() => {
    if (open) {
      setName(dish?.name ?? ""); setEmoji(dish?.emoji ?? "🍽️");
      setType(dish?.dish_type ?? "quick"); setCls(dish?.classification ?? "saludable");
      setPrep(dish?.preparation ?? ""); setMinutes(dish?.prep_minutes ?? 10);
      setServings(dish?.servings ?? 1); setXp(dish?.xp_reward ?? 5);
      setIngs(dish?.ingredients ?? []);
      setAllowedMeals(dish?.allowed_meal_types ?? []);
    }
  }, [open, dish]);

  const addIng = () => setIngs([...ings, { ingredient_id: null, name: "", qty: "", unit: "", category: "otros" }]);
  const updateIng = (i: number, patch: Partial<Ingredient>) => setIngs(ings.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeIng = (i: number) => setIngs(ings.filter((_, idx) => idx !== i));
  const pickFromCatalog = (i: number, ingredientId: string) => {
    if (ingredientId === "custom") {
      updateIng(i, { ingredient_id: null });
      return;
    }
    const cat = m.ingredients.find(x => x.id === ingredientId);
    if (!cat) return;
    updateIng(i, {
      ingredient_id: cat.id,
      name: cat.name,
      unit: cat.default_unit,
      qty: cat.default_qty,
      category: cat.category,
    });
  };

  const save = async () => {
    const payload = {
      name, emoji, dish_type: type, classification: cls,
      ingredients: ings, preparation: prep, prep_minutes: minutes,
      servings, xp_reward: xp,
      allowed_meal_types: allowedMeals,
    };
    if (dish) await m.updateDish(dish.id, payload);
    else await m.createDish(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{dish ? "Editar platillo" : "Nuevo platillo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div>
              <Label>Emoji</Label>
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as DishType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["quick", "meal_prep", "snack"] as DishType[]).map(t =>
                    <SelectItem key={t} value={t}>{DISH_TYPE_LABEL[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Clasificación</Label>
              <Select value={cls} onValueChange={(v) => setCls(v as DishClassification)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["saludable", "regular", "chatarra"] as DishClassification[]).map(c =>
                    <SelectItem key={c} value={c}>{DISH_CLASS_META[c].emoji} {DISH_CLASS_META[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Min preparación</Label>
              <Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Porciones</Label>
              <Input type="number" min={1} value={servings} onChange={(e) => setServings(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label>XP</Label>
              <Input type="number" min={0} value={xp} onChange={(e) => setXp(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <Label>Momentos permitidos (Plan predeterminado)</Label>
            <div className="flex flex-wrap gap-4 mt-2 p-3 border rounded-md">
              {PLAN_MEAL_ORDER.map(mt => (
                <div key={mt} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`mt-${mt}`} 
                    checked={allowedMeals.includes(mt)}
                    onCheckedChange={(checked) => {
                      if (checked) setAllowedMeals([...allowedMeals, mt]);
                      else setAllowedMeals(allowedMeals.filter(x => x !== mt));
                    }}
                  />
                  <Label htmlFor={`mt-${mt}`} className="text-sm font-normal cursor-pointer">
                    {PLAN_MEAL_LABEL[mt]}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Si no marcas ninguno, se usará la lógica inteligente por nombre/tipo.
            </p>
          </div>
          <div>
            <Label>Preparación</Label>
            <Textarea value={prep} onChange={(e) => setPrep(e.target.value)} rows={3} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Ingredientes</Label>
              <Button variant="outline" size="sm" onClick={addIng}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
            </div>
            {m.ingredients.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Tip: crea ingredientes en la pestaña <b>Ingredientes</b> para reutilizarlos.
              </p>
            )}
            <div className="space-y-2 mt-2">
              {ings.map((ing, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_60px_36px] gap-1 items-center">
                  <Select
                    value={ing.ingredient_id ?? "custom"}
                    onValueChange={(v) => pickFromCatalog(i, v)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {ing.ingredient_id
                          ? (() => {
                              const c = m.ingredients.find(x => x.id === ing.ingredient_id);
                              return c ? `${c.emoji} ${c.name}` : ing.name;
                            })()
                          : (ing.name || "— Personalizado —")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">— Personalizado —</SelectItem>
                      {m.ingredients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!ing.ingredient_id && (
                    <Input
                      className="col-span-2"
                      placeholder="Nombre libre"
                      value={ing.name}
                      onChange={(e) => updateIng(i, { name: e.target.value })}
                    />
                  )}
                  {ing.ingredient_id && (
                    <>
                      <Input placeholder="Cant" value={ing.qty ?? ""} onChange={(e) => updateIng(i, { qty: e.target.value })} />
                      <Input placeholder="Unidad" value={ing.unit ?? ""} onChange={(e) => updateIng(i, { unit: e.target.value })} />
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => removeIng(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={save} disabled={!name.trim()}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// LISTA DE COMPRAS
// ============================================================
export function ShoppingTab({ m }: { m: ReturnType<typeof useMeals> }) {
  const [weekStart, setWeekStart] = useState(m.currentWeek);
  const items = m.shopping.filter(s => s.week_start === weekStart);
  const grouped = useMemo(() => {
    const g = new Map<ShoppingCategory, typeof items>();
    for (const it of items) {
      const arr = g.get(it.category) ?? [];
      arr.push(it);
      g.set(it.category, arr);
    }
    return g;
  }, [items]);

  const [name, setName] = useState("");
  const [cat, setCat] = useState<ShoppingCategory>("otros");
  const [qty, setQty] = useState("");

  const addItem = async () => {
    if (!name.trim()) return;
    await m.addShoppingItem({ week_start: weekStart, name, category: cat, qty });
    setName(""); setQty("");
  };

  const totalCount = items.length;
  const boughtCount = items.filter(i => i.bought).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>←</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(m.currentWeek)}>Esta semana</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>→</Button>
        </div>
        <div className="text-sm text-muted-foreground">Semana del {weekStart} · {boughtCount}/{totalCount}</div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex gap-2 items-center">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">Generar lista desde el menú semanal</span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={async () => {
              await m.generateShoppingList(weekStart);
              toast.success("Lista regenerada desde el menú");
            }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Generar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Agregar manual</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_120px_100px_80px] gap-2">
            <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={cat} onValueChange={(v) => setCat(v as ShoppingCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SHOPPING_CATEGORY_LABEL).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{SHOPPING_CATEGORY_EMOJI[k as ShoppingCategory]} {v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Button onClick={addItem}><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {totalCount === 0 && <p className="text-sm text-muted-foreground">Lista vacía.</p>}

      {Array.from(grouped.entries()).map(([cat, list]) => (
        <Card key={cat}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {SHOPPING_CATEGORY_EMOJI[cat]} {SHOPPING_CATEGORY_LABEL[cat]}
              <span className="text-muted-foreground font-normal ml-2">({list.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {list.map(it => (
              <div key={it.id} className="flex items-center gap-2 py-1">
                <Checkbox checked={it.bought} onCheckedChange={() => m.toggleShoppingBought(it.id)} />
                <span className={`flex-1 text-sm ${it.bought ? "line-through text-muted-foreground" : ""}`}>
                  {it.name} {it.qty && <span className="text-muted-foreground">· {it.qty} {it.unit}</span>}
                </span>
                {it.source === "auto" && <Badge variant="outline" className="text-[10px]">auto</Badge>}
                <Button variant="ghost" size="icon" onClick={() => m.deleteShoppingItem(it.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// INGREDIENTES (catálogo reutilizable)
// ============================================================
export function IngredientsTab({ m }: { m: ReturnType<typeof useMeals> }) {
  const [editing, setEditing] = useState<MealIngredient | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🥕");
  const [cat, setCat] = useState<ShoppingCategory>("otros");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("");

  const openNew = () => {
    setEditing(null); setName(""); setEmoji("🥕"); setCat("otros"); setUnit(""); setQty("");
    setOpen(true);
  };
  const openEdit = (i: MealIngredient) => {
    setEditing(i); setName(i.name); setEmoji(i.emoji); setCat(i.category);
    setUnit(i.default_unit); setQty(i.default_qty);
    setOpen(true);
  };
  const save = async () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), emoji, category: cat, default_unit: unit, default_qty: qty };
    if (editing) await m.updateIngredient(editing.id, payload);
    else await m.createIngredient(payload);
    setOpen(false);
  };

  const grouped = useMemo(() => {
    const g = new Map<ShoppingCategory, MealIngredient[]>();
    for (const it of m.ingredients) {
      const arr = g.get(it.category) ?? [];
      arr.push(it);
      g.set(it.category, arr);
    }
    return g;
  }, [m.ingredients]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Catálogo de ingredientes</h3>
          <p className="text-xs text-muted-foreground">Crea cada ingrediente una vez y reutilízalo en tus platillos.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo</Button>
      </div>

      {m.ingredients.length === 0 && (
        <p className="text-sm text-muted-foreground">Aún no hay ingredientes. Crea el primero.</p>
      )}

      {Array.from(grouped.entries()).map(([catKey, list]) => (
        <Card key={catKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {SHOPPING_CATEGORY_EMOJI[catKey]} {SHOPPING_CATEGORY_LABEL[catKey]}
              <span className="text-muted-foreground font-normal ml-2">({list.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {list.map(it => (
              <div key={it.id} className="flex items-center gap-2 py-1">
                <span className="text-lg">{it.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{it.name}</div>
                  {(it.default_qty || it.default_unit) && (
                    <div className="text-xs text-muted-foreground">{it.default_qty} {it.default_unit}</div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => m.deleteIngredient(it.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar ingrediente" : "Nuevo ingrediente"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div>
                <Label>Emoji</Label>
                <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pollo, Arroz..." />
              </div>
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={cat} onValueChange={(v) => setCat(v as ShoppingCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SHOPPING_CATEGORY_LABEL).map(([k, v]) =>
                    <SelectItem key={k} value={k}>{SHOPPING_CATEGORY_EMOJI[k as ShoppingCategory]} {v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cantidad por defecto</Label>
                <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="200" />
              </div>
              <div>
                <Label>Unidad por defecto</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="g, ml, pza" />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={save} disabled={!name.trim()}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
