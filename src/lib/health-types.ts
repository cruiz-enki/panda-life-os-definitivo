/**
 * Tipos y metadatos del módulo **Salud**: composición corporal, comidas,
 * hidratación, medicación.
 */
export type BodyEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number | null;
  bmi: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  visceral_fat: number | null;
  metabolic_age: number | null;
  notes: string;
  cintura: number | null;
  cuello: number | null;
  pecho: number | null;
  brazo_izq: number | null;
  brazo_der: number | null;
  antebrazo_izq: number | null;
  antebrazo_der: number | null;
  muneca: number | null;
  cadera: number | null;
  muslo_izq: number | null;
  muslo_der: number | null;
  pantorrilla_izq: number | null;
  pantorrilla_der: number | null;
  // Datos generales
  measured_at: string | null;
  device_source: string | null;
  measurement_id: string | null;
  age: number | null;
  sex: string | null;
  height: number | null;
  // Composición corporal
  total_body_water: number | null;
  protein_mass: number | null;
  mineral_mass: number | null;
  bone_mass: number | null;
  fat_mass: number | null;
  fat_free_mass: number | null;
  total_muscle_mass: number | null;
  skeletal_muscle_mass: number | null;
  lean_body_weight: number | null;
  // Obesidad
  obesity_degree: number | null;
  body_type: string | null;
  inbody_score: number | null;
  // Grasa visceral y distribución
  visceral_fat_level: number | null;
  subcutaneous_fat: number | null;
  whr: number | null;
  seg_fat_arm_left: number | null;
  seg_fat_arm_right: number | null;
  seg_fat_trunk: number | null;
  seg_fat_leg_left: number | null;
  seg_fat_leg_right: number | null;
  // Músculo segmental
  seg_muscle_arm_left: number | null;
  seg_muscle_arm_right: number | null;
  seg_muscle_trunk: number | null;
  seg_muscle_leg_left: number | null;
  seg_muscle_leg_right: number | null;
  seg_muscle_pct_arm_left: number | null;
  seg_muscle_pct_arm_right: number | null;
  seg_muscle_pct_trunk: number | null;
  seg_muscle_pct_leg_left: number | null;
  seg_muscle_pct_leg_right: number | null;
  // Metabolismo
  bmr: number | null;
  smi: number | null;
  // Objetivos
  target_weight: number | null;
  weight_control: number | null;
  fat_control: number | null;
  muscle_control: number | null;
  optimal_fat_target: number | null;
  optimal_muscle_target: number | null;
  // Impedancia 20 kHz
  imp_20khz_arm_right: number | null;
  imp_20khz_arm_left: number | null;
  imp_20khz_trunk: number | null;
  imp_20khz_leg_right: number | null;
  imp_20khz_leg_left: number | null;
  // Impedancia 100 kHz
  imp_100khz_arm_right: number | null;
  imp_100khz_arm_left: number | null;
  imp_100khz_trunk: number | null;
  imp_100khz_leg_right: number | null;
  imp_100khz_leg_left: number | null;
};

export type MealClassification = "saludable" | "regular" | "chatarra";
export type MealType = "desayuno" | "comida" | "cena" | "snack";

export type Meal = {
  id: string;
  date: string;
  time: string;
  meal_type: MealType;
  classification: MealClassification;
  description: string;
  protein_grams: number | null;
};

export type WaterLog = {
  id: string;
  date: string;
  amount_ml: number;
};

export type MedicationFrequency = "daily" | "twice_daily" | "as_needed" | "weekly" | "every_48_hours" | "monthly";

export type Medication = {
  id: string;
  name: string;
  dose: string;
  unit: string;
  quantity: number;
  frequency: MedicationFrequency;
  times_per_day: number;
  schedule_times: string[];
  emoji: string;
  color: string;
  notes: string;
  active: boolean;
  streak: number;
  last_completed_date: string | null;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  date: string;
  scheduled_time: string;
  taken: boolean;
  taken_at: string | null;
  notes: string;
};

export type HealthSnapshot = {
  bodyEntriesCount: number;
  mealsCount: number;
  healthyMealsThisWeek: number;
  junkMealsThisWeek: number;
  activeMedsCount: number;
  medAdherenceWeekPct: number; // 0..1
  medsTakenThisWeekCount: number;
  weightLatest: number | null;
  weightDelta30d: number | null;
  bodyFatLatest: number | null;
  muscleMassLatest: number | null;
  proteinToday: number;
  waterToday: number;
};

export const FREQUENCY_LABEL: Record<MedicationFrequency, string> = {
  daily: "Diario",
  twice_daily: "2 veces/día",
  as_needed: "Cuando lo necesite",
  weekly: "Semanal",
  every_48_hours: "Cada 48 horas",
  monthly: "Mensual",
};

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};

export const MEAL_CLASS_META: Record<MealClassification, { label: string; emoji: string; color: string }> = {
  saludable: { label: "Saludable", emoji: "🥗", color: "oklch(0.78 0.18 150)" },
  regular: { label: "Regular", emoji: "🍽️", color: "oklch(0.78 0.15 70)" },
  chatarra: { label: "Chatarra", emoji: "🍔", color: "oklch(0.7 0.2 25)" },
};
