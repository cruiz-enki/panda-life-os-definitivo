/**
 * **Ruta (lazy)** — Componente de Comidas cargado bajo demanda.
 */
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, CheckCircle2, Package } from "lucide-react";
import { useMeals } from "@/hooks/use-meals";
import { HealthHeader } from "@/components/health/HealthHeader";
import { useAppState } from "@/lib/storage";
import type { PlanMealType } from "@/lib/meals-types";
import {
  DishesTab,
  IngredientsTab,
  PrepTab,
  ShoppingTab,
  StatBox,
  TodayTab,
  WeekTab,
} from "@/features/meals/parts";

export const Route = createLazyFileRoute("/meals")({
  component: MealsPage,
});

function MealsPage() {
  const m = useMeals();
  const { addBonusXp } = useAppState();
  const [tab, setTab] = useState("today");
  const { user } = useAuth();

  // Auto-fill sugerido SOLO cuando el día está completamente vacío.
  // Si el usuario elimina una comida, no la volvemos a poner.
  useEffect(() => {
    if (m.loading || m.dishes.length === 0 || !user) return;
    if (m.todayPlan.length > 0) return;

    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const findByName = (needles: string[]) =>
      m.dishes.find((d) => {
        const n = norm(d.name);
        return needles.every((k) => n.includes(k));
      });

    const desayuno = findByName(["huevos", "estrellado"]);
    const snack = findByName(["creatina"]);
    const cena =
      m.dishes.find((d) => d.allowed_meal_types?.includes("cena") && norm(d.name).includes("batido")) ||
      findByName(["batido", "proteina"]);

    if (desayuno) m.setPlanEntry(m.today, "desayuno", desayuno.id, "");
    if (snack) m.setPlanEntry(m.today, "snack", snack.id, "");
    if (cena) m.setPlanEntry(m.today, "cena", cena.id, "");
  }, [m.loading, m.dishes.length, m.todayPlan.length, m.today, user?.id]);

  const todayDone = m.dayCompletion(m.today);

  return (
    <div className="px-6 md:px-10 pt-8 pb-32 md:pb-12 max-w-6xl mx-auto space-y-6">
      <header className="mb-2">
        <p className="text-sm text-muted-foreground">Salud</p>
        <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Comida 🍽️</h1>
        <p className="mt-2 text-muted-foreground">Meal prep, menú semanal y lista de compras sin fricción.</p>
      </header>

      <HealthHeader />

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Hoy" value={`${todayDone.done}/${todayDone.total || 0}`} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatBox label="Platillos" value={`${m.dishes.length}`} icon={<ChefHat className="w-4 h-4" />} />
        <StatBox label="Preps activas" value={`${m.batches.filter((b) => b.servings_remaining > 0).length}`} icon={<Package className="w-4 h-4" />} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-none sm:mx-0 sm:px-0 sm:overflow-visible">
          <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-6">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="prep">Prep</TabsTrigger>
            <TabsTrigger value="dishes">Platillos</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
            <TabsTrigger value="shopping">Compras</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="mt-4"><TodayTab m={m} addBonusXp={addBonusXp} /></TabsContent>
        <TabsContent value="week" className="mt-4"><WeekTab m={m} /></TabsContent>
        <TabsContent value="prep" className="mt-4"><PrepTab m={m} /></TabsContent>
        <TabsContent value="dishes" className="mt-4"><DishesTab m={m} /></TabsContent>
        <TabsContent value="ingredients" className="mt-4"><IngredientsTab m={m} /></TabsContent>
        <TabsContent value="shopping" className="mt-4"><ShoppingTab m={m} /></TabsContent>
      </Tabs>
    </div>
  );
}
