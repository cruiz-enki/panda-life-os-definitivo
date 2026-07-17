/**
 * Tipos del módulo **Introspección** — ejercicios de autoconocimiento.
 */

export type IntrospectionExercise = {
  id: string;
  category: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  intro_text: string | null;
  duration_min: number | null;
  duration_max: number | null;
  level: string | null;
  type: string | null;
  color_from: string | null;
  color_to: string | null;
  emoji: string | null;
  premium: boolean;
  sort_order: number;
  active: boolean;
};

export type IntrospectionQuestionType = "scale" | "open" | "multi";

export type IntrospectionQuestionOptions = {
  choices?: string[];
  min?: number;
  max?: number;
};

export type IntrospectionQuestionMeta = {
  context?: string;
  context_label?: string;
  kind?: "description" | "emotions" | "fill_in_blank" | "values_top10" | "values_top5" | "values_top3" | "value_evidence" | "guided" | "vision" | "vision_phrase" | "future_letter" | "first_step" | "limiting_narratives" | "shadow_parts" | "persona" | "hidden" | "hidden_emotion" | "fear" | "misunderstood" | "wanted_visible" | "reconcile" | "underrated_wins" | "forgive" | "loving_voice" | "need_to_hear" | "deserves_love" | "energy_drainers" | "worst_drain" | "hidden_weight" | "recovery" | "triggers" | "reactions" | "needs" | "self_message" | "emotions_frequent" | "hardest_emotion" | "emotional_triggers" | "reaction_styles" | "recent_situation" | "real_feeling" | "triggering_thought" | "hidden_need" | "past_echo" | "threatened_part" | "trigger_to_master" | "real_need" | "desired_reaction" | "self_reminder" | "regulating_phrase" | "event_description" | "automatic_thought" | "emotions_abc" | "dominant_emotion_abc" | "reactions_abc" | "reaction_helpfulness" | "friend_advice" | "alternative_explanation" | "kinder_thought" | "reframe_doesnt_mean" | "reframe_remind" | "next_time_intent" | "visible_emotion" | "below_recent_situation" | "below_what_happened" | "below_reactions" | "below_at_risk" | "below_hidden_fear" | "below_hurt_part" | "below_real_need" | "below_hidden_emotion" | "below_connections" | "below_needs_to_hear" | "below_self_gift" | "below_accompany" | "below_remember" | "below_maybe_phrase" | "calm_energy_state" | "body_sensations" | "body_tension" | "calm_need" | "calm_anchor" | "breathing_pause" | "calm_regulators" | "calm_top_regulators" | "calm_unhelpful" | "calm_unhelpful_open" | "calm_profile_pick" | "calm_refuge_place" | "calm_refuge_people" | "calm_refuge_phrase" | "calm_refuge_remember" | "calm_refuge_self" | "calm_protocol_first" | "calm_protocol_help" | "calm_protocol_avoid" | "calm_protocol_remind" | "calm_protocol_overwhelm" | string;
  scale_kind?: "authenticity" | "exhaustion" | "alignment" | "disconnection" | "future_alignment" | "self_criticism" | "self_acceptance" | "self_image" | "perceived_authenticity" | "drain_exhaustion" | "self_care" | "intensity" | "emotional_awareness" | "thought_rigidity" | "emotion_intensity_abc" | "below_frequency" | "below_intensity" | "calm_mental_saturation" | "calm_index" | "calm_post_breath" | string;
  value_slot?: number;
  min_label?: string;
  max_label?: string;
  reversed?: boolean;
};

export type IntrospectionQuestion = {
  id: string;
  exercise_id: string;
  block_key: string;
  block_label: string;
  sort_order: number;
  type: IntrospectionQuestionType;
  text: string;
  options?: IntrospectionQuestionOptions | null;
  meta?: IntrospectionQuestionMeta | null;
};

export type IntrospectionInsights = {
  // Núcleo (compartido por todos los ejercicios)
  score_interpretation?: string;
  main_insight?: string;
  summary?: string;
  strengths?: string[];
  growth_areas?: string[];
  detected_patterns?: string[];
  reflection_questions?: string[];
  next_24h_action?: string;
  motivational_closing?: string;
  // Específico — Capas de Identidad
  identity_summary?: string;
  most_authentic_version?: string;
  most_exhausted_version?: string;
  hidden_patterns?: string[];
  mask_analysis?: string;
  weekly_authenticity_challenge?: string;
  closing_message?: string;
  // Específico — Mi Brújula Interior
  main_alignment_score?: string | number;
  main_disconnection_score?: string | number;
  core_values?: string[];
  main_conflict?: string;
  life_alignment_summary?: string;
  avoidance_patterns?: string[];
  recommended_micro_shift?: string;
  // Específico — Mi Yo del Futuro
  future_self_summary?: string;
  future_identity?: string;
  distance_from_future_self?: string;
  main_blockers?: string[];
  main_strengths?: string[];
  hidden_fears?: string[];
  recommended_habits?: string[];
  first_small_step?: string;
  future_message?: string;
  // Específico — Las Historias Que Me Cuento
  dominant_story?: string;
  self_talk_summary?: string;
  main_limiting_belief?: string;
  probable_origin?: string;
  self_sabotage_patterns?: string[];
  healthier_reframe?: string;
  growth_opportunities?: string[];
  daily_reframe?: string;
  self_criticism_score?: number;
  self_acceptance_score?: number;
  limiting_narrative_score?: number;
  self_criticism_level?: string;
  self_acceptance_level?: string;
  limiting_narrative_level?: string;
  // Específico — Mi Espejo Honesto
  self_image_summary?: string;
  blind_spots?: string[];
  hidden_strengths?: string[];
  most_visible_mask?: string;
  main_fear?: string;
  self_compassion_level?: string;
  loving_message_to_self?: string;
  self_image_score?: number;
  self_image_level?: string;
  perceived_authenticity_score?: number;
  perceived_authenticity_level?: string;
  self_demand_score?: number;
  self_demand_level?: string;
  // Específico — Lo Que Me Está Drenando
  energy_summary?: string;
  main_energy_drainers?: string[];
  hidden_weight?: string;
  self_neglect_patterns?: string[];
  recovery_actions?: string[];
  compassionate_message?: string;
  exhaustion_score?: number;
  exhaustion_level?: string;
  self_care_score?: number;
  self_care_level?: string;
  mental_saturation_score?: number;
  mental_saturation_level?: string;
  // Específico — Termómetro Emocional
  dominant_emotion?: string;
  emotional_summary?: string;
  likely_trigger?: string;
  emotional_need?: string;
  regulation_level?: string;
  helpful_reframe?: string;
  strengths_detected?: string[];
  gentle_reflection?: string;
  recommended_action?: string;
  micro_ritual?: string;
  intensity_score?: number;
  intensity_level?: string;
  emotional_saturation_score?: number;
  emotional_saturation_level?: string;
  // Específico — Mis Detonantes Emocionales
  dominant_trigger?: string;
  reaction_style?: string;
  hidden_emotional_need?: string;
  main_pattern?: string;
  regulation_tips?: string[];
  next_time_reminder?: string;
  reactivity_score?: number;
  reactivity_level?: string;
  emotional_awareness_score?: number;
  emotional_awareness_level?: string;
  // Específico — El ABC de Mis Emociones
  event_summary?: string;
  automatic_thought?: string;
  reaction_pattern?: string;
  hidden_interpretation?: string;
  gentle_reframe?: string;
  next_time_tool?: string;
  thought_rigidity_score?: number;
  thought_rigidity_level?: string;
  reframe_capacity_score?: number;
  reframe_capacity_level?: string;
  abc_intensity_score?: number;
  abc_intensity_level?: string;
  // Específico — La Emoción Debajo de la Emoción
  surface_emotion?: string;
  hidden_emotion?: string;
  main_need?: string;
  emotional_pattern?: string;
  protective_pattern?: string;
  self_validation_message?: string;
  micro_healing_action?: string;
  awareness_score?: number;
  awareness_level?: string;
  depth_score?: number;
  depth_level?: string;
  // Específico — Mi Estado Interior (Encuentra tu Calma)
  inner_state_summary?: string;
  mental_load?: string;
  body_state?: string;
  body_message?: string;
  gentle_recommendation?: string;
  reflection_question?: string;
  next_24h_focus?: string;
  calm_score?: number;
  calm_level?: string;
  calm_saturation_score?: number;
  calm_saturation_level?: string;
  regulation_score?: number;
  regulation_level_label?: string;
  fatigue_score?: number;
  fatigue_level?: string;
  detected_anchor?: string;
  detected_tension?: string;
  // Específico — Mi Kit de Calma Personal
  calm_profile?: string;
  calm_profile_emoji?: string;
  calm_profile_description?: string;
  best_regulation_tools?: string[];
  unhelpful_patterns?: string[];
  personal_refuge?: string;
  recommended_calm_protocol?: string[];
  emergency_grounding_tool?: string;
  self_awareness_score?: number;
  self_awareness_level?: string;
  unhelpful_dependency_score?: number;
  unhelpful_dependency_level?: string;
  inner_resource_score?: number;
  inner_resource_level?: string;
  // Específico — Silenciar Mi Mente (find_calm_003)
  mental_state_summary?: string;
  main_mental_loads?: string[];
  dominant_thought?: string;
  overthinking_pattern?: string;
  control_patterns?: string[];
  what_can_wait?: string;
  micro_relief_action?: string;
  mental_noise_score?: number;
  mental_noise_level?: string;
  overthinking_score?: number;
  overthinking_level?: string;
  cognitive_saturation_score?: number;
  cognitive_saturation_level?: string;
  release_capacity_score?: number;
  release_capacity_level?: string;
  // Específico — Escuchar a Mi Cuerpo (find_calm_004)
  body_state_summary?: string;
  tension_zones?: string[];
  possible_emotional_connection?: string;
  body_need?: string;
  ignored_signal?: string;
  gentle_body_recommendation?: string;
  micro_body_ritual?: string;
  body_tension_score?: number;
  body_tension_level?: string;
  body_connection_score?: number;
  body_connection_level?: string;
  body_fatigue_score?: number;
  body_fatigue_level?: string;
  body_regulation_score?: number;
  body_regulation_level?: string;
  // Específico — Mi Relación con el "No" (inner_boundaries_001)
  boundary_style?: string;
  main_boundary_issue?: string;
  people_pleasing_level_label?: string;
  hidden_cost?: string;
  healthy_boundary_phrase?: string;
  first_boundary_action?: string;
  boundary_library_phrases?: string[];
  boundaries_health_score?: number;
  boundaries_health_level?: string;
  people_pleasing_score?: number;
  people_pleasing_level?: string;
  interpersonal_guilt_score?: number;
  interpersonal_guilt_level?: string;
  relational_exhaustion_score?: number;
  relational_exhaustion_level?: string;
  // Específico — Lo Que He Estado Tolerando (inner_boundaries_002)
  main_tolerance_pattern?: string;
  main_emotional_cost?: string;
  tolerance_relationship_pattern?: string;
  tolerance_main_fear?: string;
  self_abandonment_signs?: string[];
  boundary_recommendation?: string;
  first_self_respect_action?: string;
  tolerance_drain_score?: number;
  tolerance_drain_level?: string;
  excess_tolerance_score?: number;
  excess_tolerance_level?: string;
  self_abandonment_score?: number;
  self_abandonment_level?: string;
  boundary_need_score?: number;
  boundary_need_level?: string;
  normalized_things?: string[];
  // Específico — Mi Culpa al Elegirme (inner_boundaries_004)
  guilt_level?: string;
  main_guilt_trigger?: string;
  people_pleasing_pattern?: string;
  hidden_fear?: string;
  learned_belief?: string;
  // (strengths_detected already declared above)
  healthy_reframe?: string;
  reframe_library?: string[];
  small_self_choice?: string;
  first_self_choice_action?: string;
  supportive_message?: string;
  self_choice_guilt_score?: number;
  self_choice_guilt_level?: string;
  prioritization_capacity_score?: number;
  prioritization_capacity_level?: string;
  guilt_moments_list?: string[];
  pleasing_reactions_list?: string[];
  disappointment_emotions_list?: string[];
  // Específico — Mi Voz al Poner Límites (inner_boundaries_005)
  communication_style?: string;
  avoidance_pattern?: string;
  boundary_scripts?: { tone?: string; text: string }[];
  power_phrase?: string;
  conversation_tip?: string;
  communication_clarity_score?: number;
  communication_clarity_level?: string;
  avoidance_score?: number;
  avoidance_level?: string;
  communicative_safety_score?: number;
  communicative_safety_level?: string;
  healthy_expression_score?: number;
  healthy_expression_level?: string;
  difficult_scenarios_list?: string[];
  speech_reactions_list?: string[];
  speech_fears_list?: string[];
  desired_tone?: string;
  // Específico — El Miedo Detrás de Mis Límites (inner_boundaries_006)
  fear_origin?: string;
  worst_imagined_scenario?: string;
  real_cost_of_avoiding?: string;
  fear_to_behavior_map?: { fear: string; behavior: string; cost: string }[];
  courageous_belief?: string;
  courage_micro_steps?: string[];
  approval_dependency?: string;
  courage_action?: string;
  courage_action_phrase?: string;
  phrase_to_remember?: string;
  worst_scenario?: string;
  avoided_conversation?: string;
  relational_fear_score?: number;
  relational_fear_level?: string;
  emotional_avoidance_score?: number;
  emotional_avoidance_level?: string;
  inner_safety_score?: number;
  inner_safety_level?: string;
  approval_dependency_score?: number;
  approval_dependency_level?: string;
  imagined_fears_list?: string[];
  // Específico — Mis Creencias Financieras (financial_intelligence_002)
  dominant_money_belief?: string;
  inherited_patterns?: string[];
  scarcity_level?: string;
  money_story_summary?: string;
  main_blocker?: string;
  healthy_money_reframe?: string;
  new_money_beliefs?: string[];
  next_financial_action?: string;
  financial_scarcity_score?: number;
  financial_scarcity_level?: string;
  financial_security_score?: number;
  financial_security_level?: string;
  financial_deserving_score?: number;
  financial_deserving_level?: string;
  growth_openness_score?: number;
  growth_openness_level?: string;
  financial_anxiety_score?: number;
  financial_anxiety_level?: string;
  inherited_phrases_list?: string[];
  current_pattern_list?: string[];
  main_limiting_belief_text?: string;
  belief_to_release?: string;
  new_money_phrase?: string;
}

export type IntrospectionSession = {
  id: string;
  user_id: string;
  exercise_id: string;
  status: "in_progress" | "completed" | "abandoned";
  score: number | null;
  score_max: number | null;
  level_label: string | null;
  score_secondary: number | null;
  score_secondary_max: number | null;
  level_secondary_label: string | null;
  ai_result: IntrospectionInsights | null;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IntrospectionAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  value_number: number | null;
  value_text: string | null;
  value_json: unknown | null;
};

export type IntrospectionCategory = {
  key: string;
  name: string;
  description: string;
  emoji: string;
  color_from: string;
  color_to: string;
  premium: boolean;
};

export const INTROSPECTION_CATEGORIES: IntrospectionCategory[] = [
  {
    key: "know_yourself",
    name: "Conócete a ti mismo",
    description: "Explora quién eres, qué te mueve y cómo estás hoy.",
    emoji: "🪞",
    color_from: "#f59e0b",
    color_to: "#ea580c",
    premium: true,
  },
  {
    key: "emotional_mastery",
    name: "Maestría emocional",
    description: "Aprende a escuchar, nombrar y regular lo que sientes.",
    emoji: "💛",
    color_from: "#60a5fa",
    color_to: "#a78bfa",
    premium: false,
  },
  {
    key: "find_calm",
    name: "Encuentra tu calma",
    description: "Pausa, respira y regresa a tu centro.",
    emoji: "🌊",
    color_from: "#93c5fd",
    color_to: "#a78bfa",
    premium: false,
  },
  {
    key: "inner_boundaries",
    name: "Límites internos",
    description: "Aprende a cuidarte sin culpa y a decir no con claridad.",
    emoji: "🌿",
    color_from: "#7c2d3a",
    color_to: "#e9b8a6",
    premium: false,
  },
  {
    key: "financial_intelligence",
    name: "Inteligencia financiera",
    description: "Entiende tu relación con el dinero, tus hábitos y la mentalidad que guía tus decisiones financieras.",
    emoji: "💰",
    color_from: "#0f5132",
    color_to: "#d4af6a",
    premium: true,
  },
];

export const SCALE_LABELS: Record<number, string> = {
  1: "Muy bajo",
  2: "Bajo",
  3: "Neutral",
  4: "Bueno",
  5: "Muy alto",
};

export function levelFromScore(score: number): string {
  if (score <= 35) return "Desconectado de ti mismo";
  if (score <= 55) return "En pausa personal";
  if (score <= 75) return "En construcción";
  if (score <= 89) return "Consciente y creciendo";
  return "Muy alineado contigo";
}

export function levelToneFromScore(score: number): "low" | "mid" | "high" {
  if (score <= 55) return "low";
  if (score <= 75) return "mid";
  return "high";
}

/** Clasificación de autenticidad (promedio 1–5). */
export function authenticityLevelFromAvg(avg: number): string {
  if (avg < 2) return "Desconectado de ti";
  if (avg < 3) return "Adaptándote demasiado";
  if (avg < 4) return "Parcialmente auténtico";
  return "Altamente auténtico";
}

/** Clasificación de desgaste (promedio 1–5). */
export function exhaustionLevelFromAvg(avg: number): string {
  if (avg < 2) return "Ligero";
  if (avg < 3) return "Moderado";
  if (avg < 4) return "Elevado";
  return "Sobrecarga emocional";
}

/** Clasificación de alineación personal (0–100). */
export function alignmentLevelFromScore(score: number): string {
  if (score <= 25) return "Muy desconectado";
  if (score <= 50) return "Buscando dirección";
  if (score <= 75) return "Parcialmente alineado";
  if (score <= 90) return "Bien alineado";
  return "Profundamente alineado";
}

/** Clasificación de desconexión interna (0–100). */
export function disconnectionLevelFromScore(score: number): string {
  if (score <= 20) return "Alta congruencia";
  if (score <= 40) return "Algunas tensiones";
  if (score <= 60) return "Conflicto interno moderado";
  if (score <= 80) return "Desalineación importante";
  return "Crisis de dirección";
}

/** Clasificación de alineación con el yo futuro (0–100). */
export function futureAlignmentLevelFromScore(score: number): string {
  if (score <= 25) return "Desconectado de tu visión";
  if (score <= 50) return "Deseando un cambio";
  if (score <= 75) return "Construyendo camino";
  if (score <= 90) return "Muy alineado";
  return "Encarnando tu visión";
}

/** Autocrítica (0–100). */
export function selfCriticismLevelFromScore(score: number): string {
  if (score <= 25) return "Compasivo contigo";
  if (score <= 50) return "Moderadamente crítico";
  if (score <= 75) return "Muy exigente contigo";
  return "Autocrítica intensa";
}

/** Autoaceptación (0–100). */
export function selfAcceptanceLevelFromScore(score: number): string {
  if (score <= 25) return "Desconectada";
  if (score <= 50) return "En construcción";
  if (score <= 75) return "Saludable";
  return "Fuerte";
}

/** Narrativa limitante (0–100). */
export function limitingNarrativeLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy arraigada";
}

/** Autoimagen (0–100). */
export function selfImageLevelFromScore(score: number): string {
  if (score <= 25) return "Muy crítica";
  if (score <= 50) return "Inestable";
  if (score <= 75) return "Saludable";
  return "Fuerte";
}

/** Autenticidad percibida (0–100). */
export function perceivedAuthenticityLevelFromScore(score: number): string {
  if (score <= 25) return "Muy protegida";
  if (score <= 50) return "Parcialmente visible";
  if (score <= 75) return "Mayormente auténtica";
  return "Altamente auténtica";
}

/** Autoexigencia emocional (0–100). */
export function selfDemandLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Elevada";
  return "Muy alta";
}


/** Agotamiento emocional (0–100). */
export function drainExhaustionLevelFromScore(score: number): string {
  if (score <= 25) return "Ligero";
  if (score <= 50) return "Moderado";
  if (score <= 75) return "Alto";
  return "Muy elevado";
}

/** Autocuidado (0–100). */
export function selfCareLevelFromScore(score: number): string {
  if (score <= 25) return "Muy bajo";
  if (score <= 50) return "Insuficiente";
  if (score <= 75) return "Moderado";
  return "Saludable";
}

/** Saturación mental (0–100). */
export function mentalSaturationLevelFromScore(score: number): string {
  if (score <= 25) return "Ligera";
  if (score <= 50) return "Presente";
  if (score <= 75) return "Alta";
  return "Sobrecarga";
}

/** Intensidad emocional (0-100 derivada de escala 1-5). */
export function intensityLevelFromScore(score: number): string {
  if (score <= 40) return "Ligera";
  if (score <= 60) return "Moderada";
  if (score <= 80) return "Alta";
  return "Muy intensa";
}

/** Saturación emocional (0-100). */
export function emotionalSaturationLevelFromScore(score: number): { label: string; emoji: string } {
  if (score <= 30) return { label: "Regulado", emoji: "🟢" };
  if (score <= 55) return { label: "Necesita atención", emoji: "🟡" };
  if (score <= 80) return { label: "Sobrecarga emocional", emoji: "🟠" };
  return { label: "Emoción intensa", emoji: "🔴" };
}

/** Reactividad emocional (0-100). */
export function reactivityLevelFromScore(score: number): string {
  if (score <= 25) return "Regulada";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Elevada";
  return "Muy alta";
}

/** Autoconocimiento emocional (0-100). */
export function emotionalAwarenessLevelFromScore(score: number): string {
  if (score <= 25) return "Confuso emocionalmente";
  if (score <= 50) return "En exploración";
  if (score <= 75) return "Consciente";
  return "Muy consciente";
}

/** Rigidez del pensamiento (0-100). */
export function thoughtRigidityLevelFromScore(score: number): string {
  if (score <= 25) return "Flexible";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Rígida";
  return "Muy rígida";
}

/** Capacidad de reencuadre (0-100). */
export function reframeCapacityLevelFromScore(score: number): string {
  if (score <= 25) return "Difícil";
  if (score <= 50) return "En desarrollo";
  if (score <= 75) return "Saludable";
  return "Muy fuerte";
}

/** Conciencia emocional (0-100) — Emoción Debajo de la Emoción. */
export function awarenessLevelFromScore(score: number): string {
  if (score <= 25) return "Muy desconectada";
  if (score <= 50) return "En exploración";
  if (score <= 75) return "Consciente";
  return "Muy profunda";
}

/** Profundidad emocional (0-100). */
export function depthLevelFromScore(score: number): string {
  if (score <= 25) return "Superficial";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Reflexiva";
  return "Muy introspectiva";
}

/** Índice de calma (0-100). */
export function calmLevelFromScore(score: number): string {
  if (score <= 25) return "Muy baja";
  if (score <= 50) return "Inestable";
  if (score <= 75) return "Moderada";
  return "Regulado";
}

/** Saturación (0-100) — Encuentra tu Calma. */
export function calmSaturationLevelFromScore(score: number): string {
  if (score <= 25) return "Despejado";
  if (score <= 50) return "Presente";
  if (score <= 75) return "Alta";
  return "Sobrecarga";
}

/** Regulación emocional (0-100). */
export function regulationLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Saludable";
  return "Muy fuerte";
}

/** Fatiga emocional (0-100). */
export function fatigueLevelFromScore(score: number): string {
  if (score <= 25) return "Ligera";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Agotamiento";
}

/** Autoconocimiento regulatorio (0-100). */
export function selfAwarenessRegLevelFromScore(score: number): string {
  if (score <= 25) return "En exploración";
  if (score <= 50) return "Despertando";
  if (score <= 75) return "Consciente";
  return "Muy claro";
}

/** Dependencia de hábitos poco útiles (0-100). */
export function unhelpfulDependencyLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}

/** Fortaleza de recursos internos (0-100). */
export function innerResourceLevelFromScore(score: number): string {
  if (score <= 25) return "En construcción";
  if (score <= 50) return "Suficiente";
  if (score <= 75) return "Fuerte";
  return "Muy sólida";
}

/** Ruido mental (0-100) — Silenciar Mi Mente. */
export function mentalNoiseLevelFromScore(score: number): string {
  if (score <= 25) return "Ligero";
  if (score <= 50) return "Moderado";
  if (score <= 75) return "Alto";
  return "Muy alto";
}

/** Sobrepensamiento (0-100). */
export function overthinkingLevelFromScore(score: number): string {
  if (score <= 25) return "Bajo";
  if (score <= 50) return "Presente";
  if (score <= 75) return "Frecuente";
  return "Muy elevado";
}

/** Saturación cognitiva (0-100). */
export function cognitiveSaturationLevelFromScore(score: number): string {
  if (score <= 25) return "Despejada";
  if (score <= 50) return "Presente";
  if (score <= 75) return "Alta";
  return "Sobrecarga";
}

/** Capacidad de soltar (0-100). */
export function releaseCapacityLevelFromScore(score: number): string {
  if (score <= 25) return "Aún cuesta";
  if (score <= 50) return "En práctica";
  if (score <= 75) return "Saludable";
  return "Muy fuerte";
}

/** Tensión corporal (0-100). */
export function bodyTensionLevelFromScore(score: number): string {
  if (score <= 25) return "Ligera";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy elevada";
}

/** Conexión corporal (0-100). */
export function bodyConnectionLevelFromScore(score: number): string {
  if (score <= 25) return "Muy desconectado";
  if (score <= 50) return "Intermitente";
  if (score <= 75) return "Conectado";
  return "Muy presente";
}

/** Fatiga física-emocional (0-100). */
export function bodyFatigueLevelFromScore(score: number): string {
  if (score <= 25) return "Ligera";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Agotamiento";
}

/** Regulación corporal (0-100). */
export function bodyRegulationLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "En desarrollo";
  if (score <= 75) return "Saludable";
  return "Muy fuerte";
}

/** Perfil de calma dominante a partir de selecciones del usuario. */
export const CALM_PROFILE_CATEGORIES: Record<string, { key: string; label: string; emoji: string; description: string; tools: string[] }> = {
  internal: {
    key: "internal", label: "Regulador Interno", emoji: "🌿",
    description: "Te regulas con introspección, silencio y espacio interior.",
    tools: ["Dormir","Meditar","Respirar profundo","Tiempo solo","No hacer nada","Rezar/reflexionar","Escribir"],
  },
  active: {
    key: "active", label: "Regulador Activo", emoji: "🏃",
    description: "Te regulas con movimiento y acción física.",
    tools: ["Caminar","Ejercicio","Manejar","Limpiar","Organizar cosas","Trabajar"],
  },
  relational: {
    key: "relational", label: "Regulador Relacional", emoji: "💛",
    description: "Necesitas conexión humana o presencia cálida para volver a tu centro.",
    tools: ["Hablar con alguien","Mascotas"],
  },
  creative: {
    key: "creative", label: "Regulador Creativo", emoji: "🎨",
    description: "Encuentras calma creando y expresándote.",
    tools: ["Cocinar","Dibujar/crear","Juegos/videojuegos"],
  },
  sensorial: {
    key: "sensorial", label: "Regulador Sensorial", emoji: "🌊",
    description: "Te regulas con ambientes, música, naturaleza y sensaciones.",
    tools: ["Música","Naturaleza","Ducha caliente","Ver películas/series","Comer algo rico","Viajar","Escuchar podcasts","Llorar","Reír"],
  },
  mixed: {
    key: "mixed", label: "Regulador Mixto", emoji: "🧩",
    description: "Combinas múltiples estilos con flexibilidad según el momento.",
    tools: [],
  },
};

export function detectCalmProfile(tools: string[]): { key: string; label: string; emoji: string; description: string } {
  if (!tools || tools.length === 0) return CALM_PROFILE_CATEGORIES.mixed;
  const counts: Record<string, number> = { internal: 0, active: 0, relational: 0, creative: 0, sensorial: 0 };
  for (const t of tools) {
    for (const [key, cat] of Object.entries(CALM_PROFILE_CATEGORIES)) {
      if (key === "mixed") continue;
      if (cat.tools.includes(t)) counts[key] += 1;
    }
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = ranked[0];
  const [, secondVal] = ranked[1];
  // If top isn't clearly dominant → Mixed
  if (topVal === 0) return CALM_PROFILE_CATEGORIES.mixed;
  if (topVal - secondVal <= 0 && topVal < 3) return CALM_PROFILE_CATEGORIES.mixed;
  return CALM_PROFILE_CATEGORIES[topKey];
}


/** Límites saludables (0-100) — Mi Relación con el No. */
export function boundariesHealthLevelFromScore(score: number): string {
  if (score <= 25) return "Muy débiles";
  if (score <= 50) return "Difusos";
  if (score <= 75) return "En construcción";
  return "Saludables";
}

/** Complacencia emocional (0-100). */
export function peoplePleasingLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}

/** Culpa interpersonal (0-100). */
export function interpersonalGuiltLevelFromScore(score: number): string {
  if (score <= 25) return "Ligera";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Elevada";
  return "Muy alta";
}

/** Desgaste relacional (0-100). */
export function relationalExhaustionLevelFromScore(score: number): string {
  if (score <= 25) return "Ligero";
  if (score <= 50) return "Moderado";
  if (score <= 75) return "Alto";
  return "Agotamiento";
}

/** Desgaste relacional (0-100) — Lo Que He Estado Tolerando. */
export function toleranceDrainLevelFromScore(score: number): string {
  if (score <= 25) return "Ligero";
  if (score <= 50) return "Moderado";
  if (score <= 75) return "Elevado";
  return "Muy alto";
}

/** Tolerancia excesiva (0-100). */
export function excessToleranceLevelFromScore(score: number): string {
  if (score <= 25) return "Saludable";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Elevada";
  return "Muy alta";
}

/** Autoabandono emocional (0-100). */
export function selfAbandonmentLevelFromScore(score: number): string {
  if (score <= 25) return "Bajo";
  if (score <= 50) return "Presente";
  if (score <= 75) return "Alto";
  return "Muy elevado";
}

/** Necesidad de límites (0-100). */
export function boundaryNeedLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Urgente";
}

/** Culpa al autocuidado / al elegirse (0-100) — Mi Culpa al Elegirme. */
export function selfChoiceGuiltLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}

/** Capacidad de priorización personal (0-100). */
export function prioritizationCapacityLevelFromScore(score: number): string {
  if (score <= 25) return "Muy baja";
  if (score <= 50) return "Limitada";
  if (score <= 75) return "En desarrollo";
  return "Saludable";
}

/** Claridad / asertividad comunicativa (0-100) — Mi Voz al Poner Límites. */
export function communicationClarityLevelFromScore(score: number): string {
  if (score <= 25) return "Muy inhibida";
  if (score <= 50) return "Evitativa";
  if (score <= 75) return "En desarrollo";
  return "Asertiva";
}

/** Evitación del conflicto (0-100). */
export function avoidanceLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}

/** Seguridad comunicativa (0-100). */
export function communicativeSafetyLevelFromScore(score: number): string {
  if (score <= 25) return "Muy baja";
  if (score <= 50) return "Frágil";
  if (score <= 75) return "En construcción";
  return "Sólida";
}

/** Autoexpresión saludable (0-100). */
export function healthyExpressionLevelFromScore(score: number): string {
  if (score <= 25) return "Inhibida";
  if (score <= 50) return "Limitada";
  if (score <= 75) return "En desarrollo";
  return "Plena";
}

/** Miedo relacional (0-100) — El Miedo Detrás de Mis Límites. */
export function relationalFearLevelFromScore(score: number): string {
  if (score <= 25) return "Bajo";
  if (score <= 50) return "Moderado";
  if (score <= 75) return "Alto";
  return "Muy alto";
}

/** Evitación emocional (0-100). */
export function emotionalAvoidanceLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}

/** Seguridad interna (0-100). */
export function innerSafetyLevelFromScore(score: number): string {
  if (score <= 25) return "Muy baja";
  if (score <= 50) return "En construcción";
  if (score <= 75) return "Saludable";
  return "Fuerte";
}

/** Dependencia de aprobación (0-100). */
export function approvalDependencyLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}

/** Escasez financiera mental (0-100). */
export function financialScarcityLevelFromScore(score: number): string {
  if (score <= 25) return "Mentalidad saludable";
  if (score <= 50) return "En transición";
  if (score <= 75) return "Inseguridad financiera";
  return "Escasez fuerte";
}

/** Seguridad financiera interna (0-100). */
export function financialSecurityLevelFromScore(score: number): string {
  if (score <= 25) return "Muy baja";
  if (score <= 50) return "En construcción";
  if (score <= 75) return "Estable";
  return "Sólida";
}

/** Merecimiento financiero (0-100). */
export function financialDeservingLevelFromScore(score: number): string {
  if (score <= 25) return "Muy bajo";
  if (score <= 50) return "Limitado";
  if (score <= 75) return "En construcción";
  return "Saludable";
}

/** Apertura al crecimiento financiero (0-100). */
export function growthOpennessLevelFromScore(score: number): string {
  if (score <= 25) return "Muy cerrada";
  if (score <= 50) return "Tibia";
  if (score <= 75) return "Despertando";
  return "Muy abierta";
}

/** Ansiedad financiera (0-100). */
export function financialAnxietyLevelFromScore(score: number): string {
  if (score <= 25) return "Baja";
  if (score <= 50) return "Moderada";
  if (score <= 75) return "Alta";
  return "Muy alta";
}
