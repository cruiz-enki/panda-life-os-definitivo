/**
 * **Importación masiva** desde el cliente. RLS protege las inserciones,
 * no hace falta server function.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ImportPayload, ImportSummary } from "./import-schemas";

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Devuelve un `ImportSummary` vacío para inicializar el estado de progreso.
 */
export const emptySummary = (): ImportSummary => ({
  habits: { created: 0, skipped: 0 },
  tasks: { created: 0, skipped: 0 },
  ingredients: { created: 0, skipped: 0 },
  dishes: { created: 0, skipped: 0 },
  rewards: { created: 0, skipped: 0 },
  quests: { created: 0, skipped: 0 },
  fixed_missions: { created: 0, skipped: 0 },
  skills: { created: 0, skipped: 0 },
});

export async function bulkImportContentClient(payload: ImportPayload): Promise<ImportSummary> {
  const summary = emptySummary();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const userId = user.id;

  // HABITS
  if (payload.habits?.length) {
    const { data: existing } = await supabase.from("habits").select("name").eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((r) => norm(r.name)));
    const toInsert = payload.habits.filter((h) => !existingSet.has(norm(h.name)));
    summary.habits.skipped = payload.habits.length - toInsert.length;
    if (toInsert.length) {
      const rows = toInsert.map((h) => ({
        user_id: userId,
        name: h.name,
        emoji: h.emoji ?? "✨",
        points: h.points ?? 10,
        frequency: h.frequency ?? "daily",
        target_count: h.target_count ?? 1,
      }));
      const { error } = await supabase.from("habits").insert(rows);
      if (error) throw new Error(`hábitos: ${error.message}`);
      summary.habits.created = rows.length;
    }
  }

  // TASKS
  if (payload.tasks?.length) {
    const rows = payload.tasks.map((t) => ({
      user_id: userId,
      title: t.title,
      description: t.description ?? null,
      priority: t.priority ?? "medium",
      tags: t.tags ?? [],
      status: "pending",
    }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) throw new Error(`tareas: ${error.message}`);
    summary.tasks.created = rows.length;
  }

  // INGREDIENTS
  const ingredientNameToId = new Map<string, string>();
  {
    const { data: existing } = await supabase
      .from("meal_ingredients")
      .select("id, name")
      .eq("user_id", userId);
    for (const r of existing ?? []) ingredientNameToId.set(norm(r.name), r.id);
  }
  if (payload.ingredients?.length) {
    const toInsert = payload.ingredients.filter((i) => !ingredientNameToId.has(norm(i.name)));
    summary.ingredients.skipped = payload.ingredients.length - toInsert.length;
    if (toInsert.length) {
      const rows = toInsert.map((i) => ({
        user_id: userId,
        name: i.name,
        emoji: i.emoji ?? "🥕",
        category: i.category ?? "otros",
        default_unit: i.default_unit ?? "",
        default_qty: i.default_qty ?? "",
      }));
      const { data: inserted, error } = await supabase
        .from("meal_ingredients")
        .insert(rows)
        .select("id, name");
      if (error) throw new Error(`ingredientes: ${error.message}`);
      summary.ingredients.created = (inserted ?? []).length;
      for (const r of inserted ?? []) ingredientNameToId.set(norm(r.name), r.id);
    }
  }

  // DISHES
  if (payload.dishes?.length) {
    const { data: existing } = await supabase
      .from("meal_dishes")
      .select("name")
      .eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((r) => norm(r.name)));
    const toInsert = payload.dishes.filter((d) => !existingSet.has(norm(d.name)));
    summary.dishes.skipped = payload.dishes.length - toInsert.length;
    if (toInsert.length) {
      const rows = toInsert.map((d) => {
        const ingredients = (d.ingredient_names ?? [])
          .map((nm) => {
            const id = ingredientNameToId.get(norm(nm));
            return id ? { ingredient_id: id, qty: "", unit: "" } : null;
          })
          .filter((x): x is { ingredient_id: string; qty: string; unit: string } => x !== null);
        return {
          user_id: userId,
          name: d.name,
          emoji: d.emoji ?? "🍽️",
          dish_type: d.dish_type ?? "quick",
          classification: d.classification ?? "saludable",
          preparation: d.preparation ?? "",
          prep_minutes: d.prep_minutes ?? 10,
          servings: d.servings ?? 1,
          ingredients,
        };
      });
      const { error } = await supabase.from("meal_dishes").insert(rows);
      if (error) throw new Error(`platillos: ${error.message}`);
      summary.dishes.created = rows.length;
    }
  }

  // REWARDS
  if (payload.rewards?.length) {
    const { data: existing } = await supabase
      .from("rewards_shop")
      .select("name")
      .eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((r) => norm(r.name)));
    const toInsert = payload.rewards.filter((r) => !existingSet.has(norm(r.name)));
    summary.rewards.skipped = payload.rewards.length - toInsert.length;
    if (toInsert.length) {
      const rows = toInsert.map((r) => ({
        user_id: userId,
        name: r.name,
        description: r.description ?? "",
        emoji: r.emoji ?? "🎁",
        cost: r.cost ?? 100,
        category: r.category ?? "treat",
      }));
      const { error } = await supabase.from("rewards_shop").insert(rows);
      if (error) throw new Error(`recompensas: ${error.message}`);
      summary.rewards.created = rows.length;
    }
  }

  // QUESTS
  if (payload.quests?.length) {
    const { data: existing } = await supabase
      .from("custom_quests")
      .select("title")
      .eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((r) => norm(r.title)));
    const toInsert = payload.quests.filter((q) => !existingSet.has(norm(q.title)));
    summary.quests.skipped = payload.quests.length - toInsert.length;
    if (toInsert.length) {
      const rows = toInsert.map((q) => ({
        user_id: userId,
        title: q.title,
        description: q.description ?? "",
        emoji: q.emoji ?? "🎯",
        xp: q.xp ?? 50,
        target: q.target ?? 1,
        scope: q.scope ?? "weekly",
      }));
      const { error } = await supabase.from("custom_quests").insert(rows);
      if (error) throw new Error(`misiones: ${error.message}`);
      summary.quests.created = rows.length;
    }
  }

  // FIXED MISSIONS (Achievements)
  const missionsToImport = payload.fixed_missions || payload.achievements;
  if (missionsToImport?.length) {
    const { data: existing } = await supabase
      .from("custom_achievements")
      .select("name")
      .eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((r) => norm(r.name)));
    const toInsert = missionsToImport.filter((a) => !existingSet.has(norm(a.title)));
    summary.fixed_missions.skipped = missionsToImport.length - toInsert.length;
    if (toInsert.length) {
      const rows = toInsert.map((a) => ({
        user_id: userId,
        name: a.title,
        description: a.description ?? "",
        emoji: a.emoji ?? "🏆",
        xp: a.xp_reward ?? 100,
        category: "general",
        active: true,
      }));
      const { error } = await supabase.from("custom_achievements").insert(rows);
      if (error) throw new Error(`misiones fijas: ${error.message}`);
      summary.fixed_missions.created = rows.length;
    }
  }

  // SKILLS (Merge into profiles.custom_skill_categories)
  if (payload.skills?.length) {
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("custom_skill_categories")
      .eq("user_id", userId)
      .single();
    
    if (pError) throw new Error(`perfil: ${pError.message}`);
    
    const existingCategories = (profile?.custom_skill_categories as any[]) || [];
    const updatedCategories = [...existingCategories];
    let createdCount = 0;
    let skippedCount = 0;

    for (const newCat of payload.skills) {
      const existingIdx = updatedCategories.findIndex(c => norm(c.id) === norm(newCat.id) || norm(c.name) === norm(newCat.name));
      if (existingIdx === -1) {
        updatedCategories.push(newCat);
        createdCount++;
      } else {
        // Merge subcategories? For now, let's just skip if it exists or replace
        // Decided: If it exists, skip the category but count as skipped
        skippedCount++;
      }
    }

    if (createdCount > 0) {
      const { error: uError } = await supabase
        .from("profiles")
        .update({ custom_skill_categories: updatedCategories })
        .eq("user_id", userId);
      if (uError) throw new Error(`skills: ${uError.message}`);
      summary.skills.created = createdCount;
    }
    summary.skills.skipped = skippedCount;
  }

  return summary;
}
