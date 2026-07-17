/**
 * Esquemas Zod para validar **payloads de importación masiva**
 * (hábitos, tareas, recetas, skills, etc.).
 */
import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().max(8).optional(),
  points: z.number().int().min(0).max(500).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  target_count: z.number().int().min(1).max(100).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

export const ingredientSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().max(8).optional(),
  category: z.string().max(40).optional(),
  default_unit: z.string().max(20).optional(),
  default_qty: z.string().max(20).optional(),
});

export const dishSchema = z.object({
  name: z.string().min(1).max(120),
  emoji: z.string().max(8).optional(),
  dish_type: z.enum(["quick", "prep"]).optional(),
  classification: z.enum(["saludable", "chatarra"]).optional(),
  preparation: z.string().max(2000).optional(),
  prep_minutes: z.number().int().min(0).max(600).optional(),
  servings: z.number().int().min(1).max(50).optional(),
  ingredient_names: z.array(z.string()).max(50).optional(),
});

export const rewardSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  emoji: z.string().max(8).optional(),
  cost: z.number().int().min(0).max(100000).optional(),
  category: z.string().max(40).optional(),
});

export const questSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  emoji: z.string().max(8).optional(),
  xp: z.number().int().min(0).max(10000).optional(),
  target: z.number().int().min(1).max(1000).optional(),
  scope: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export const fixedMissionSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  emoji: z.string().max(8).optional(),
  xp_reward: z.number().int().min(0).max(10000).optional(),
});

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const skillSubCategorySchema = z.object({
  name: z.string(),
  skills: z.array(skillSchema),
});

export const skillCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  subCategories: z.array(skillSubCategorySchema),
});

export const importPayloadSchema = z.object({
  habits: z.array(habitSchema).max(200).optional(),
  tasks: z.array(taskSchema).max(200).optional(),
  ingredients: z.array(ingredientSchema).max(500).optional(),
  dishes: z.array(dishSchema).max(200).optional(),
  rewards: z.array(rewardSchema).max(200).optional(),
  quests: z.array(questSchema).max(100).optional(),
  fixed_missions: z.array(fixedMissionSchema).max(100).optional(),
  achievements: z.array(fixedMissionSchema).max(100).optional(), // Legacy support
  skills: z.array(skillCategorySchema).max(50).optional(),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
export type ImportSummary = {
  habits: { created: number; skipped: number };
  tasks: { created: number; skipped: number };
  ingredients: { created: number; skipped: number };
  dishes: { created: number; skipped: number };
  rewards: { created: number; skipped: number };
  quests: { created: number; skipped: number };
  fixed_missions: { created: number; skipped: number };
  skills: { created: number; skipped: number };
};
