/**
 * Tipos y helpers del módulo **Comidas**: platos, lotes, planes semanales
 * y lista de la compra con categorías.
 */
export type DishType = "quick" | "meal_prep" | "snack";
export type DishClassification = "saludable" | "regular" | "chatarra";
export type PlanMealType = "desayuno" | "comida" | "cena" | "snack";
export type ShoppingCategory =
  | "frutas_verduras" | "proteinas" | "lacteos" | "granos" | "despensa" | "bebidas" | "otros";

export type Ingredient = {
  name: string;
  qty?: string;
  unit?: string;
  category?: ShoppingCategory;
  ingredient_id?: string | null;
};

export type MealIngredient = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  category: ShoppingCategory;
  default_unit: string;
  default_qty: string;
  notes: string;
  active: boolean;
};

export type MealDish = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  dish_type: DishType;
  classification: DishClassification;
  ingredients: Ingredient[];
  preparation: string;
  prep_minutes: number;
  servings: number;
  xp_reward: number;
  notes: string;
  active: boolean;
  allowed_meal_types?: PlanMealType[];
};

export type MealPrepBatch = {
  id: string;
  user_id: string;
  dish_id: string | null;
  ingredient_id: string | null;
  name: string;
  prep_date: string;
  days_lasting: number;
  servings_total: number;
  servings_remaining: number;
  notes: string;
};

export type MealPlanEntry = {
  id: string;
  user_id: string;
  date: string;
  meal_type: PlanMealType;
  dish_id: string | null;
  custom_name: string;
  completed: boolean;
  completed_at: string | null;
  xp_awarded: number;
  notes: string;
};

export type ShoppingItem = {
  id: string;
  user_id: string;
  week_start: string;
  name: string;
  category: ShoppingCategory;
  qty: string;
  unit: string;
  bought: boolean;
  source: "auto" | "manual";
  notes: string;
};

export const DISH_TYPE_LABEL: Record<DishType, string> = {
  quick: "Rápido",
  meal_prep: "Meal Prep",
  snack: "Snack",
};

export const PLAN_MEAL_LABEL: Record<PlanMealType, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};

export const PLAN_MEAL_ORDER: PlanMealType[] = ["desayuno", "comida", "cena", "snack"];

export const SHOPPING_CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  frutas_verduras: "Frutas y verduras",
  proteinas: "Proteínas",
  lacteos: "Lácteos",
  granos: "Granos y cereales",
  despensa: "Despensa",
  bebidas: "Bebidas",
  otros: "Otros",
};

export const SHOPPING_CATEGORY_EMOJI: Record<ShoppingCategory, string> = {
  frutas_verduras: "🥬",
  proteinas: "🍗",
  lacteos: "🥛",
  granos: "🌾",
  despensa: "🥫",
  bebidas: "🥤",
  otros: "🛒",
};

export const DISH_CLASS_META: Record<DishClassification, { label: string; emoji: string }> = {
  saludable: { label: "Saludable", emoji: "🥗" },
  regular: { label: "Regular", emoji: "🍽️" },
  chatarra: { label: "Chatarra", emoji: "🍔" },
};

/** Lunes (YYYY-MM-DD) de una fecha dada. */
export function weekStartOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = date.getUTCDay(); // 0 dom .. 6 sab
  const offset = dow === 0 ? -6 : 1 - dow;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/**
 * Suma `n` días a una fecha ISO y devuelve la nueva clave YYYY-MM-DD.
 */
export function addDaysISO(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}
