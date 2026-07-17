/**
 * Hook del módulo **Comidas**: platos, lotes (batch cooking), planes
 * semanales y lista de la compra. Carga paralela con TanStack Query.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { todayCDMX } from "@/lib/date-utils";
import {
  weekStartOf, addDaysISO,
  type MealDish, type MealPrepBatch, type MealPlanEntry, type ShoppingItem, type MealIngredient,
  type PlanMealType, type Ingredient, type ShoppingCategory,
} from "../lib/meals-types";

/**
 * Devuelve platos, lotes, planes y shopping + mutaciones CRUD.
 */
export function useMeals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["meals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [d, b, p, s, ing] = await Promise.all([
        supabase.from("meal_dishes" as never).select("*").eq("user_id", userId!).order("name"),
        supabase.from("meal_prep_batches" as never).select("*").eq("user_id", userId!).order("prep_date", { ascending: false }),
        supabase.from("meal_plan" as never).select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(500),
        supabase.from("shopping_list_items" as never).select("*").eq("user_id", userId!).order("category"),
        supabase.from("meal_ingredients" as never).select("*").eq("user_id", userId!).eq("active", true).order("name"),
      ]);
      return {
        dishes: (d.data ?? []) as unknown as MealDish[],
        batches: (b.data ?? []) as unknown as MealPrepBatch[],
        plan: (p.data ?? []) as unknown as MealPlanEntry[],
        shopping: (s.data ?? []) as unknown as ShoppingItem[],
        ingredients: (ing.data ?? []) as unknown as MealIngredient[],
      };
    },
  });

  const dishes = data?.dishes ?? [];
  const batches = data?.batches ?? [];
  const plan = data?.plan ?? [];
  const shopping = data?.shopping ?? [];
  const ingredients = data?.ingredients ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["meals", userId] });
  }, [qc, userId]);

  const today = todayCDMX();
  const currentWeek = useMemo(() => weekStartOf(today), [today]);

  const planByDate = useCallback((date: string) =>
    plan.filter(p => p.date === date), [plan]);

  const dishById = useCallback((id: string | null) =>
    id ? dishes.find(d => d.id === id) ?? null : null, [dishes]);
  const ingredientById = useCallback((id: string | null) =>
    id ? ingredients.find(i => i.id === id) ?? null : null, [ingredients]);

  const todayPlan = useMemo(() => planByDate(today), [planByDate, today]);

  const dayCompletion = useCallback((date: string) => {
    const items = planByDate(date);
    const done = items.filter(i => i.completed).length;
    return { total: items.length, done, complete: items.length > 0 && done === items.length };
  }, [planByDate]);

  const weekDays = useCallback((weekStart: string) => {
    return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  }, []);

  // ===== Dishes =====
  const createDish = async (input: Partial<MealDish>) => {
    if (!user) return;
    const { error } = await supabase.from("meal_dishes" as never).insert({
      user_id: user.id, name: input.name ?? "Nuevo platillo",
      emoji: input.emoji ?? "🍽️",
      dish_type: input.dish_type ?? "quick",
      classification: input.classification ?? "saludable",
      ingredients: input.ingredients ?? [],
      preparation: input.preparation ?? "",
      prep_minutes: input.prep_minutes ?? 10,
      servings: input.servings ?? 1,
      xp_reward: input.xp_reward ?? 5,
      notes: input.notes ?? "",
      allowed_meal_types: input.allowed_meal_types ?? [],
    } as never);
    if (!error) await refresh();
  };
  const updateDish = async (id: string, patch: Partial<MealDish>) => {
    const { error } = await supabase.from("meal_dishes" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
  };
  const deleteDish = async (id: string) => {
    const { error } = await supabase.from("meal_dishes" as never).delete().eq("id", id);
    if (!error) await refresh();
  };

  // ===== Batches =====
  const createBatch = async (input: Partial<MealPrepBatch>) => {
    if (!user) return;
    const total = input.servings_total ?? 1;
    const { error } = await supabase.from("meal_prep_batches" as never).insert({
      user_id: user.id,
      dish_id: input.dish_id ?? null,
      ingredient_id: input.ingredient_id ?? null,
      name: input.name ?? "",
      prep_date: input.prep_date ?? today,
      days_lasting: input.days_lasting ?? 3,
      servings_total: total,
      servings_remaining: input.servings_remaining ?? total,
      notes: input.notes ?? "",
    } as never);
    if (!error) await refresh();
  };
  const updateBatch = async (id: string, patch: Partial<MealPrepBatch>) => {
    const { error } = await supabase.from("meal_prep_batches" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
  };
  const deleteBatch = async (id: string) => {
    const { error } = await supabase.from("meal_prep_batches" as never).delete().eq("id", id);
    if (!error) await refresh();
  };
  const consumeBatchServing = async (id: string) => {
    const b = batches.find(x => x.id === id);
    if (!b) return;
    const next = Math.max(0, b.servings_remaining - 1);
    await updateBatch(id, { servings_remaining: next });
  };

  // ===== Plan =====
  const setPlanEntry = async (date: string, meal_type: PlanMealType, dish_id: string | null, custom_name = "") => {
    if (!user) return;
    const existing = plan.find(p => p.date === date && p.meal_type === meal_type);
    if (existing) {
      const { error } = await supabase.from("meal_plan" as never)
        .update({ dish_id, custom_name } as never).eq("id", existing.id);
      if (!error) await refresh();
    } else {
      const { error } = await supabase.from("meal_plan" as never).insert({
        user_id: user.id, date, meal_type, dish_id, custom_name,
      } as never);
      if (!error) await refresh();
    }
  };
  const removePlanEntry = async (id: string) => {
    const { error } = await supabase.from("meal_plan" as never).delete().eq("id", id);
    if (!error) await refresh();
  };

  /** Marca cumplimiento. Retorna XP ganado (para sumar al estado global). */
  const togglePlanComplete = async (id: string): Promise<number> => {
    if (!user) return 0;
    const entry = plan.find(p => p.id === id);
    if (!entry) return 0;
    const newCompleted = !entry.completed;
    const dish = entry.dish_id ? dishes.find(d => d.id === entry.dish_id) : null;
    const xp = newCompleted ? (dish?.xp_reward ?? 5) : -entry.xp_awarded;
    const { error } = await supabase.from("meal_plan" as never).update({
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
      xp_awarded: newCompleted ? (dish?.xp_reward ?? 5) : 0,
    } as never).eq("id", id);
    if (error) return 0;

    if (newCompleted) {
      const desc = dish?.name || entry.custom_name || "Comida";
      const cls = dish?.classification ?? "regular";
      await supabase.from("health_meals").insert({
        user_id: user.id,
        date: entry.date,
        time: "",
        meal_type: entry.meal_type === "desayuno" ? "breakfast"
          : entry.meal_type === "comida" ? "lunch"
          : entry.meal_type === "cena" ? "dinner" : "snack",
        classification: cls,
        description: desc,
      } as never);
    }
    await refresh();
    await qc.invalidateQueries({ queryKey: ["health", userId] });
    return xp;
  };

  // ===== Shopping list =====
  const generateShoppingList = async (weekStart: string) => {
    if (!user) return;
    await supabase.from("shopping_list_items" as never)
      .delete().eq("user_id", user.id).eq("week_start", weekStart).eq("source", "auto");

    const days = weekDays(weekStart);
    const entries = plan.filter(p => days.includes(p.date) && p.dish_id);
    const map = new Map<string, { name: string; category: ShoppingCategory; qty: string; unit: string; count: number }>();
    for (const e of entries) {
      const dish = dishes.find(d => d.id === e.dish_id);
      if (!dish) continue;
      for (const ing of (dish.ingredients ?? []) as Ingredient[]) {
        const key = `${(ing.name || "").toLowerCase().trim()}|${ing.unit || ""}|${ing.category || "otros"}`;
        const prev = map.get(key);
        if (prev) {
          prev.count += 1;
        } else {
          map.set(key, {
            name: ing.name || "Ingrediente",
            category: (ing.category as ShoppingCategory) || "otros",
            qty: ing.qty || "",
            unit: ing.unit || "",
            count: 1,
          });
        }
      }
    }
    const rows = Array.from(map.values()).map(v => ({
      user_id: user.id,
      week_start: weekStart,
      name: v.name,
      category: v.category,
      qty: v.count > 1 && v.qty ? `${v.qty} x${v.count}` : v.qty,
      unit: v.unit,
      bought: false,
      source: "auto" as const,
    }));
    if (rows.length) {
      await supabase.from("shopping_list_items" as never).insert(rows as never);
    }
    await refresh();
  };

  const addShoppingItem = async (input: Partial<ShoppingItem>) => {
    if (!user) return;
    const { error } = await supabase.from("shopping_list_items" as never).insert({
      user_id: user.id,
      week_start: input.week_start ?? currentWeek,
      name: input.name ?? "",
      category: input.category ?? "otros",
      qty: input.qty ?? "",
      unit: input.unit ?? "",
      bought: false,
      source: "manual",
    } as never);
    if (!error) await refresh();
  };
  const toggleShoppingBought = async (id: string) => {
    const it = shopping.find(s => s.id === id);
    if (!it) return;
    const { error } = await supabase.from("shopping_list_items" as never)
      .update({ bought: !it.bought } as never).eq("id", id);
    if (!error) await refresh();
  };
  const deleteShoppingItem = async (id: string) => {
    const { error } = await supabase.from("shopping_list_items" as never).delete().eq("id", id);
    if (!error) await refresh();
  };

  // ===== Ingredients catalog =====
  const createIngredient = async (input: Partial<MealIngredient>) => {
    if (!user) return;
    const { error } = await supabase.from("meal_ingredients" as never).insert({
      user_id: user.id,
      name: input.name ?? "Nuevo ingrediente",
      emoji: input.emoji ?? "🥕",
      category: input.category ?? "otros",
      default_unit: input.default_unit ?? "",
      default_qty: input.default_qty ?? "",
      notes: input.notes ?? "",
      active: input.active ?? true,
    } as never);
    if (!error) await refresh();
  };
  const updateIngredient = async (id: string, patch: Partial<MealIngredient>) => {
    const { error } = await supabase.from("meal_ingredients" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
  };
  const deleteIngredient = async (id: string) => {
    const { error } = await supabase.from("meal_ingredients" as never).delete().eq("id", id);
    if (!error) await refresh();
  };

  return {
    loading: isLoading, today, currentWeek,
    dishes, batches, plan, shopping, ingredients,
    planByDate, dishById, ingredientById, todayPlan, dayCompletion, weekDays,
    createDish, updateDish, deleteDish,
    createBatch, updateBatch, deleteBatch, consumeBatchServing,
    setPlanEntry, removePlanEntry, togglePlanComplete,
    generateShoppingList, addShoppingItem, toggleShoppingBought, deleteShoppingItem,
    createIngredient, updateIngredient, deleteIngredient,
    refresh,
  };
}
