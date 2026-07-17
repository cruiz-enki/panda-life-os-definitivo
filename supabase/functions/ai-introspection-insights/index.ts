import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

type Answer = {
  block: string;
  text: string;
  type: string;
  meta?: Record<string, unknown> | null;
  options?: Record<string, unknown> | null;
  value_number?: number | null;
  value_text?: string | null;
  value_json?: unknown | null;
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const {
      exercise_id,
      exercise_name,
      score,
      score_max,
      level_label,
      score_secondary,
      score_secondary_max,
      level_secondary_label,
      is_dual,
      limiting_narrative_score,
      limiting_narrative_level,
      self_demand_score,
      self_demand_level,
      mental_saturation_score,
      mental_saturation_level,
      emotional_saturation_score,
      emotional_saturation_level,
      reactivity_score,
      reactivity_level,
      emotional_awareness_score,
      emotional_awareness_level,
      thought_rigidity_score,
      thought_rigidity_level,
      reframe_capacity_score,
      reframe_capacity_level,
      abc_intensity_score,
      abc_intensity_level,
      awareness_score,
      awareness_level,
      depth_score,
      depth_level,
      calm_score,
      calm_level,
      calm_saturation_score,
      calm_saturation_level,
      regulation_score,
      regulation_level_label,
      fatigue_score,
      fatigue_level,
      kit_self_awareness_score,
      kit_self_awareness_level,
      kit_unhelpful_dependency_score,
      kit_unhelpful_dependency_level,
      kit_inner_resource_score,
      kit_inner_resource_level,
      kit_calm_profile,
      kit_top_tools,
      kit_unhelpful_list,
      mental_noise_score,
      mental_noise_level,
      overthinking_score,
      overthinking_level,
      cognitive_saturation_score,
      cognitive_saturation_level,
      release_capacity_score,
      release_capacity_level,
      silencio_mental_loads,
      body_tension_score,
      body_tension_level,
      body_connection_score,
      body_connection_level,
      body_fatigue_score,
      body_fatigue_level,
      body_regulation_score,
      body_regulation_level,
      body_tension_zones,
      body_need_list,
      body_emotion_list,
      boundaries_health_score,
      boundaries_health_level,
      people_pleasing_score,
      people_pleasing_level,
      interpersonal_guilt_score,
      interpersonal_guilt_level,
      relational_exhaustion_score,
      relational_exhaustion_level,
      boundary_areas_list,
      boundary_reactions_list,
      boundary_fears_list,
      boundary_small_limit_list,
      boundary_helpful_phrase_list,
      tolerance_drain_score,
      tolerance_drain_level,
      excess_tolerance_score,
      excess_tolerance_level,
      self_abandonment_score,
      self_abandonment_level,
      boundary_need_score,
      boundary_need_level,
      normalized_things,
      tolerance_reactions,
      tolerance_fears,
      self_choice_guilt_score,
      self_choice_guilt_level,
      prioritization_capacity_score,
      prioritization_capacity_level,
      guilt_moments_list,
      pleasing_reactions_list,
      disappointment_emotions_list,
      communication_clarity_score,
      communication_clarity_level,
      avoidance_score,
      avoidance_level,
      communicative_safety_score,
      communicative_safety_level,
      healthy_expression_score,
      healthy_expression_level,
      difficult_scenarios_list,
      speech_reactions_list,
      speech_fears_list,
      desired_tone,
      relational_fear_score,
      relational_fear_level,
      emotional_avoidance_score,
      emotional_avoidance_level,
      inner_safety_score,
      inner_safety_level,
      approval_dependency_score,
      approval_dependency_level,
      imagined_fears_list,
      worst_scenario,
      avoided_conversation,
      phrase_to_remember,
      financial_scarcity_score,
      financial_scarcity_level,
      financial_security_score,
      financial_security_level,
      financial_deserving_score,
      financial_deserving_level,
      growth_openness_score,
      growth_openness_level,
      financial_anxiety_score,
      financial_anxiety_level,
      inherited_phrases_list,
      current_pattern_list,
      main_limiting_belief_text,
      belief_to_release,
      new_money_phrase,
      answers,
    } = await req.json();

    const formatted = (answers as Answer[])
      .map((a, i) => {
        const ctx = a.meta?.context_label ? ` (${a.meta.context_label})` : "";
        if (a.type === "scale") {
          const kind = a.meta?.scale_kind ? ` [${a.meta.scale_kind}]` : "";
          return `${i + 1}. [${a.block}${ctx}]${kind} ${a.text}\n   → ${a.value_number ?? "—"}/5`;
        }
        if (a.type === "multi") {
          const arr = Array.isArray(a.value_json) ? (a.value_json as string[]).join(", ") : (a.value_text ?? "");
          return `${i + 1}. [${a.block}${ctx}] ${a.text}\n   → ${arr || "(sin respuesta)"}`;
        }
        return `${i + 1}. [${a.block}${ctx}] ${a.text}\n   → "${(a.value_text ?? "").trim() || "(sin respuesta)"}"`;
      })
      .join("\n\n");

    const isCapas = exercise_id === "know_yourself_002";
    const isBrujula = exercise_id === "know_yourself_003";
    const isFuturo = exercise_id === "know_yourself_004";
    const isHistorias = exercise_id === "know_yourself_005";
    const isEspejo = exercise_id === "know_yourself_006";
    const isDrenando = exercise_id === "know_yourself_007";
    const isTermometro = exercise_id === "emotional_mastery_001";
    const isDetonantes = exercise_id === "emotional_mastery_002";
    const isABC = exercise_id === "emotional_mastery_003";
    const isProfunda = exercise_id === "emotional_mastery_004";
    const isCalma = exercise_id === "find_calm_001";
    const isKit = exercise_id === "find_calm_002";
    const isSilencio = exercise_id === "find_calm_003";
    const isCuerpo = exercise_id === "find_calm_004";
    const isBoundaries = exercise_id === "inner_boundaries_001";
    const isBoundaries2 = exercise_id === "inner_boundaries_002";
    const isBoundaries4 = exercise_id === "inner_boundaries_004";
    const isBoundaries5 = exercise_id === "inner_boundaries_005";
    const isBoundaries6 = exercise_id === "inner_boundaries_006";
    const isFinancial2 = exercise_id === "financial_intelligence_002";

    const baseSchema = `{
  "score_interpretation": "string corto interpretando el score y el nivel",
  "main_insight": "el insight principal, 1-2 frases potentes",
  "summary": "resumen personalizado de 3-5 frases hablándole directamente",
  "strengths": ["3 a 5 fortalezas concretas detectadas"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "detected_patterns": ["2 a 4 patrones observados entre respuestas"],
  "reflection_questions": ["3 preguntas para seguir reflexionando esta semana"],
  "next_24h_action": "una acción pequeña, concreta y realista para las próximas 24 horas",
  "motivational_closing": "frase de cierre inspiradora y cálida, 1-2 líneas"
}`;

    const capasSchema = `{
  "identity_summary": "resumen general de cómo se está mostrando esta persona en sus distintas capas (3-5 frases)",
  "most_authentic_version": "qué versión/contexto se siente más auténtica y por qué",
  "most_exhausted_version": "qué versión/contexto se siente más agotada y por qué",
  "mask_analysis": "análisis cálido de las máscaras que usa, sin juzgar",
  "main_insight": "insight central, 1-2 frases potentes",
  "summary": "resumen personalizado, 3-5 frases, hablándole de tú",
  "score_interpretation": "lectura conjunta del nivel de autenticidad y de desgaste",
  "strengths": ["3 a 5 fortalezas detectadas"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables"],
  "hidden_patterns": ["2 a 4 patrones invisibles que conectan respuestas (contradicciones, contextos donde actúa más, emociones repetidas)"],
  "detected_patterns": ["2 a 4 patrones observados entre versiones"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "weekly_authenticity_challenge": "un micro reto concreto de 7 días para practicar autenticidad",
  "next_24h_action": "una acción pequeña para las próximas 24 horas",
  "closing_message": "mensaje de cierre cálido (1-2 líneas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const brujulaSchema = `{
  "main_alignment_score": "número 0-100 con el score de alineación",
  "main_disconnection_score": "número 0-100 con el score de desconexión",
  "core_values": ["los 3 valores que la persona eligió como guía de su vida — extraídos de las respuestas del bloque Valores Centrales"],
  "main_conflict": "el conflicto interno más importante detectado (1-2 frases)",
  "main_insight": "insight central de la brújula interior (1-2 frases potentes)",
  "life_alignment_summary": "resumen cálido y profundo (3-5 frases) sobre cómo está apuntando su vida",
  "summary": "resumen general personalizado, 3-5 frases, hablándole de tú",
  "score_interpretation": "lectura conjunta de alineación y desconexión",
  "strengths": ["3 a 5 fortalezas detectadas"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "avoidance_patterns": ["2 a 4 patrones de evitación o autosabotaje detectados"],
  "detected_patterns": ["2 a 4 patrones generales observados"],
  "reflection_questions": ["3 preguntas poderosas para esta semana"],
  "recommended_micro_shift": "un micro cambio concreto de 7 días para reconectar con sus valores",
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "closing_message": "lo que su brújula quiere recordarle (1-2 líneas cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const futuroSchema = `{
  "future_self_summary": "tu versión futura descrita en 2-3 frases vívidas y emocionales",
  "future_identity": "tu yo futuro en UNA frase potente (como una declaración de identidad)",
  "distance_from_future_self": "lectura cálida de qué tan cerca o lejos está la persona de esa versión",
  "main_blockers": ["2 a 4 cosas concretas que la están alejando de su yo futuro"],
  "main_strengths": ["3 a 5 fortalezas reales que ya tiene y la acercan"],
  "hidden_fears": ["2 a 3 miedos dominantes detectados entre líneas"],
  "main_insight": "insight central sobre su yo futuro (1-2 frases potentes)",
  "summary": "resumen personalizado, 3-5 frases, hablándole de tú con calidez",
  "score_interpretation": "lectura del índice de alineación futura",
  "recommended_habits": ["3 a 5 hábitos concretos que esa versión futura ya practica"],
  "first_small_step": "el primer paso pequeño y realista para empezar hoy",
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_24h_action": "una acción concreta para las próximas 24 horas",
  "future_message": "EL mensaje que su yo futuro quiere recordarle hoy (1-3 frases emocionales, en primera persona, como si su yo futuro le hablara directamente)",
  "closing_message": "mensaje de cierre cálido (1-2 líneas)",
  "motivational_closing": "frase de cierre breve y poderosa",
  "detected_patterns": ["2 a 4 patrones observados"],
  "strengths": ["3 a 5 fortalezas detectadas (puede coincidir con main_strengths)"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables"]
}`;

    const historiasSchema = `{
  "dominant_story": "la historia interna dominante en una frase corta y honesta",
  "self_talk_summary": "resumen del diálogo interno de la persona (2-3 frases)",
  "main_limiting_belief": "la creencia limitante más fuerte detectada",
  "probable_origin": "de dónde es probable que venga esa historia (familia, etapa de vida, vivencia repetida), con cuidado y sin diagnosticar",
  "main_insight": "insight central, 1-2 frases potentes",
  "summary": "resumen personalizado, 3-5 frases, hablándole de tú con calidez",
  "score_interpretation": "lectura conjunta de autocrítica, autoaceptación y narrativa limitante",
  "strengths": ["3 a 5 fortalezas detectadas en cómo se habla a sí mismo o cómo enfrenta sus historias"],
  "self_sabotage_patterns": ["2 a 4 formas concretas en las que esta narrativa la limita o autosabotea"],
  "healthier_reframe": "una reformulación más sana y verdadera de la historia limitante (1-2 frases poderosas)",
  "growth_opportunities": ["2 a 4 áreas de crecimiento amables y accionables"],
  "growth_areas": ["espejo de growth_opportunities, para compatibilidad"],
  "detected_patterns": ["2 a 4 patrones observados entre diálogo interno, creencias y narrativas elegidas"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "weekly_authenticity_challenge": "un micro reto de 7 días para practicar la nueva narrativa",
  "daily_reframe": "una frase corta y poderosa para que la app la muestre cada mañana como 'Reframe Diario', en segunda persona ('No necesitas demostrar...', 'Hoy puedes...')",
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "closing_message": "la verdad que quizá necesita recordar hoy (1-2 líneas cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const espejoSchema = `{
  "self_image_summary": "resumen cálido (3-5 frases) de cómo se está mirando a sí misma esta persona",
  "blind_spots": ["2 a 4 puntos ciegos detectados — diferencias entre cómo se ve y cómo cree que la ven, o entre lo que muestra y lo que esconde"],
  "hidden_strengths": ["2 a 4 fortalezas invisibles que ella aún no se reconoce"],
  "most_visible_mask": "la máscara o personaje social más visible que muestra al mundo (1 frase)",
  "main_fear": "el miedo central detectado (1 frase, sin diagnosticar)",
  "self_compassion_level": "lectura cálida de qué tan compasiva es consigo misma (1-2 frases)",
  "main_insight": "insight central del espejo honesto (1-2 frases potentes)",
  "summary": "resumen personalizado, 3-5 frases, hablándole de tú con calidez",
  "score_interpretation": "lectura conjunta de autoimagen, autenticidad percibida y autoexigencia",
  "strengths": ["3 a 5 fortalezas detectadas"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "detected_patterns": ["2 a 4 patrones observados entre cómo se ve y cómo la ven"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "loving_message_to_self": "UNA carta corta y emocional (3-5 frases) escrita como si viniera de alguien que realmente la ama y la conoce. Tono cálido, humano, genuino — NUNCA manipulador. Habla en segunda persona ('Te veo…', 'Sé que…').",
  "weekly_authenticity_challenge": "un micro reto de autocompasión de 7 días, concreto y amable",
  "next_24h_action": "una acción pequeña y realista de autocompasión para las próximas 24 horas",
  "closing_message": "la parte de ti que necesita más compasión hoy (1-2 líneas cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const drenandoSchema = `{
  "energy_summary": "resumen cálido (3-5 frases) de cómo está la energía emocional de esta persona",
  "main_energy_drainers": ["3 a 5 fuentes concretas que más están drenando su energía (personas, contextos, hábitos)"],
  "hidden_weight": "lo que está cargando en silencio (1-2 frases honestas y compasivas)",
  "main_insight": "insight central, 1-2 frases potentes — del tipo 'quizá no necesitas esforzarte más…'",
  "self_neglect_patterns": ["2 a 4 patrones de autoabandono detectados (no descansar, complacer, sobreexigirse, etc.)"],
  "strengths": ["3 a 5 fortalezas que ya tiene aunque esté cansada"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables (límites, descanso, soltar)"],
  "recovery_actions": ["plan de recuperación de 7 días: 5 acciones concretas, pequeñas y realistas"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_24h_action": "un mini ritual o acción pequeñísima para las próximas 24 horas (ej: 'cierra los ojos 5 minutos sin culpa')",
  "compassionate_message": "mensaje compasivo personalizado (2-3 frases) que la haga sentir 'no estoy fallando, estoy cansada'",
  "closing_message": "lo que necesita escuchar hoy (1-2 líneas cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa",
  "summary": "resumen general personalizado, 3-5 frases, hablándole de tú con calidez",
  "score_interpretation": "lectura conjunta de agotamiento, autocuidado y saturación mental",
  "detected_patterns": ["2 a 4 patrones observados entre fuentes de drenaje y autocuidado"]
}`;

    const termometroSchema = `{
  "dominant_emotion": "la emoción dominante detectada en UNA palabra (ej: 'Ansiedad', 'Tristeza')",
  "emotional_summary": "resumen cálido (2-4 frases) sobre lo que está sintiendo hoy",
  "likely_trigger": "el detonante más probable (1 frase)",
  "emotional_need": "la necesidad emocional principal (1 frase)",
  "regulation_level": "nivel de regulación emocional actual (1 frase)",
  "main_insight": "insight central (1-2 frases potentes)",
  "helpful_reframe": "un reencuadre amable y verdadero (1-2 frases)",
  "strengths_detected": ["2 a 3 fortalezas detectadas"],
  "gentle_reflection": "una pregunta reflexiva personalizada y cálida",
  "recommended_action": "una acción concreta y pequeña que puede hacer hoy",
  "micro_ritual": "un micro ritual personalizado (2-4 pasos breves separados por punto)",
  "closing_message": "frase emocional de cierre (1 línea cálida)"
}`;

    const detonantesSchema = `{
  "dominant_trigger": "el detonante principal detectado (1 frase concreta)",
  "dominant_emotion": "la emoción más activada por ese detonante (1 palabra o frase corta)",
  "reaction_style": "estilo de reacción dominante (1 frase, ej: 'Te cierras y sobrepiensas en silencio')",
  "hidden_emotional_need": "la necesidad emocional real detrás de la reacción (1 frase)",
  "main_pattern": "el patrón emocional principal: detonante → emoción → reacción → necesidad (1-2 frases conectando los puntos)",
  "main_insight": "insight central (1-2 frases potentes del tipo 'No reaccionas a esto… reaccionas a lo que te recuerda')",
  "summary": "resumen cálido, 3-5 frases, hablándole de tú",
  "score_interpretation": "lectura conjunta de reactividad y autoconocimiento emocional",
  "strengths_detected": ["2 a 4 fortalezas emocionales detectadas"],
  "strengths": ["espejo de strengths_detected, para compatibilidad"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "regulation_tips": ["3 a 5 micro-prácticas concretas de regulación para sus detonantes (ej: 'Antes de responder, respira 4 segundos y nombra qué sientes')"],
  "detected_patterns": ["2 a 4 patrones repetitivos observados"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_24h_action": "una acción pequeña para las próximas 24 horas",
  "next_time_reminder": "frase corta y poderosa para recordarse la próxima vez que se active (ej: 'Esto es incómodo, pero no significa peligro.')",
  "closing_message": "lo que su sistema emocional quiere recordarle (1-2 líneas cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const abcSchema = `{
  "event_summary": "resumen breve (1 frase) de lo que pasó",
  "automatic_thought": "el pensamiento automático detectado (cita o sintetiza, 1 frase)",
  "dominant_emotion": "la emoción dominante en UNA palabra o frase corta",
  "reaction_pattern": "el patrón de reacción descrito en 1 frase",
  "main_insight": "insight central (1-2 frases del tipo 'No reaccionas solo a lo que pasa…')",
  "hidden_interpretation": "la interpretación oculta que pudo influir (1-2 frases)",
  "gentle_reframe": "un reencuadre amable y verdadero (1-2 frases poderosas, NO autoayuda barata)",
  "strengths_detected": ["2 a 4 fortalezas detectadas en cómo procesó esto"],
  "strengths": ["espejo de strengths_detected, para compatibilidad"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_time_tool": "UNA herramienta concreta para la próxima vez (1-2 frases, ej: 'Antes de reaccionar, pregúntate: ¿Qué otra explicación podría existir?')",
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "detected_patterns": ["2 a 4 patrones observados entre situación-pensamiento-emoción-reacción"],
  "summary": "resumen cálido, 3-5 frases, hablándole de tú",
  "score_interpretation": "lectura conjunta de rigidez de pensamiento y capacidad de reencuadre",
  "closing_message": "frase final cálida (1-2 líneas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const profundaSchema = `{
  "surface_emotion": "la emoción visible (1 palabra o frase corta, ej: 'Enojo', 'Ansiedad')",
  "hidden_emotion": "la emoción probablemente escondida debajo (1 palabra o frase corta, ej: 'Tristeza', 'Miedo')",
  "main_need": "la necesidad emocional real detrás (1 frase corta y honesta)",
  "main_fear": "el miedo dominante detectado (1 frase, sin diagnosticar)",
  "emotional_pattern": "el patrón emocional: emoción visible → emoción oculta → necesidad (1-2 frases conectando los puntos)",
  "protective_pattern": "el estilo de protección que aparece (1 frase, ej: 'Te enojas para no sentir el dolor', 'Te aíslas para que no te vean roto')",
  "main_insight": "insight central que la haga sentir 'ahora sí entendí qué me pasa' (1-2 frases potentes)",
  "self_validation_message": "mensaje de validación emocional cálido, humano y genuino (2-3 frases, en segunda persona, como si alguien que te entiende te lo dijera)",
  "strengths_detected": ["2 a 4 fortalezas emocionales detectadas"],
  "strengths": ["espejo de strengths_detected, para compatibilidad"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "micro_healing_action": "una micro acción de autocuidado muy concreta y pequeña para hoy (1 frase)",
  "summary": "resumen cálido, 3-5 frases, hablándole de tú con calidez profunda",
  "score_interpretation": "lectura conjunta de conciencia emocional y profundidad",
  "detected_patterns": ["2 a 4 patrones observados entre emoción visible, oculta, miedo y necesidad"],
  "closing_message": "lo que esa parte de ti necesita escuchar hoy (1-2 líneas muy cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const calmaSchema = `{
  "inner_state_summary": "resumen muy cálido (3-4 frases) de cómo está su mundo interior hoy",
  "mental_load": "1 frase honesta sobre el nivel de carga mental",
  "body_state": "1-2 frases sobre cómo está su cuerpo",
  "body_message": "lo que su cuerpo parece querer decirle hoy (1-2 frases, comienza con 'Quizá hoy tu cuerpo quiere decirte…')",
  "main_need": "la necesidad principal detectada (1 frase corta)",
  "calm_score": "número 0-100",
  "main_insight": "insight central, 1-2 frases muy suaves",
  "gentle_recommendation": "una recomendación amable y concreta de recuperación (1-2 frases)",
  "micro_ritual": "micro ritual personalizado (2-4 pasos breves separados por punto, ej: respiración 4-4-6, 15 min sin estímulos, brain dump)",
  "reflection_question": "una pregunta suave para reflexionar",
  "next_24h_focus": "qué cuidar en las próximas 24 horas (1 frase)",
  "closing_message": "frase de cierre cálida y calmante (1 línea)"
}`;

    const kitSchema = `{
  "calm_profile": "nombre del perfil de calma dominante (ej: 'Regulador Interno') — usa exactamente el calm_profile detectado si se proporciona",
  "calm_profile_description": "1-2 frases describiendo el perfil",
  "best_regulation_tools": ["3 a 5 herramientas reales que SÍ regulan a esta persona, extraídas de su top 5 y perfil emocional"],
  "unhelpful_patterns": ["2 a 4 hábitos poco útiles que repite cuando está mal — extraídos de sus selecciones y respuesta abierta, sin juzgar"],
  "main_need": "la necesidad emocional principal detectada (1 frase corta)",
  "main_insight": "insight central, 1-2 frases del tipo 'no necesitas hacer lo que le sirve a otros, necesitas…'",
  "personal_refuge": "descripción cálida (2-3 frases) de su refugio emocional — combina lugar ideal, personas seguras, frase y versión en paz",
  "recommended_calm_protocol": ["protocolo paso a paso de 4-6 acciones concretas para cuando se sienta saturado — incorpora sus propias herramientas y su protocolo escrito"],
  "emergency_grounding_tool": "UNA herramienta de grounding rápido para emergencias emocionales (1-2 frases, ej: 'Respira 4-4-6 mientras nombras 3 sonidos que escuchas')",
  "reflection_question": "una pregunta amable para seguir explorando su kit",
  "compassionate_message": "mensaje compasivo que la haga sentir 'ahora tengo algo a qué volver' (2-3 frases)",
  "summary": "resumen cálido (3-5 frases) sobre cómo se regula esta persona",
  "score_interpretation": "lectura conjunta de autoconocimiento regulatorio, dependencia de mecanismos poco útiles y fortaleza de recursos",
  "detected_patterns": ["2 a 4 patrones observados entre lo que la regula y lo que no"],
  "strengths": ["3 a 5 fortalezas detectadas en cómo se cuida"],
  "growth_areas": ["2 a 3 áreas de crecimiento amables"],
  "reflection_questions": ["3 preguntas profundas para seguir esta semana"],
  "next_24h_action": "una acción pequeñísima y realista para hoy",
  "closing_message": "frase de cierre cálida (1-2 líneas)",
  "motivational_closing": "frase final breve y poderosa"
}`;

    const silencioSchema = `{
  "mental_state_summary": "resumen muy cálido (3-4 frases) sobre cómo está su mente hoy",
  "main_mental_loads": ["3 a 5 cargas mentales dominantes detectadas"],
  "dominant_thought": "el pensamiento recurrente principal (1 frase, hónralo si lo escribió)",
  "overthinking_pattern": "el patrón de sobrepensamiento (1-2 frases, ej: 'Repasas conversaciones buscando lo que pudiste hacer distinto')",
  "control_patterns": ["2 a 3 cosas que está intentando controlar demasiado"],
  "main_insight": "insight central muy suave (1-2 frases del tipo 'no tienes que resolver todo hoy')",
  "what_can_wait": "qué puede esperar o soltar por hoy (1-2 frases)",
  "gentle_reframe": "un reencuadre amable (1-2 frases)",
  "micro_relief_action": "micro acción concreta de alivio mental (1 frase)",
  "micro_ritual": "micro ritual de claridad en 2-4 pasos breves separados por punto",
  "reflection_question": "una pregunta suave para seguir reflexionando",
  "summary": "resumen cálido (3-5 frases)",
  "score_interpretation": "lectura conjunta de ruido mental, sobrepensamiento, saturación cognitiva y capacidad de soltar",
  "strengths": ["2 a 4 fortalezas mentales detectadas"],
  "growth_areas": ["2 a 3 áreas de crecimiento amables"],
  "detected_patterns": ["2 a 4 patrones mentales observados"],
  "closing_message": "frase de cierre muy calmante (1 línea, tono: 'una cosa a la vez')",
  "motivational_closing": "frase final breve y calmante"
}`;

    const cuerpoSchema = `{
  "body_state_summary": "resumen muy cálido (3-4 frases) sobre cómo se siente su cuerpo hoy",
  "tension_zones": ["las 2 a 4 zonas con más tensión detectadas en sus selecciones"],
  "possible_emotional_connection": "1-2 frases conectando la tensión corporal con la emoción más probable (ej: 'La tensión en tus hombros podría estar cargando algo de estrés acumulado')",
  "body_need": "la necesidad corporal más importante hoy (1 frase corta)",
  "main_insight": "insight central muy suave (1-2 frases del tipo 'tu cuerpo no está fallando, está pidiéndote algo')",
  "ignored_signal": "qué señal corporal podría estar ignorando (1-2 frases, sin juzgar)",
  "gentle_body_recommendation": "una recomendación amable y concreta para el cuerpo hoy (1-2 frases)",
  "micro_body_ritual": "micro ritual corporal personalizado (2-4 pasos breves separados por punto, ej: 'Suelta los hombros. Respira 4-4-6 dos veces. Date un masaje suave en el cuello.')",
  "reflection_question": "una pregunta suave sobre la relación con su cuerpo",
  "closing_message": "frase de cierre muy cálida y compasiva hacia su cuerpo (1 línea)",
  "summary": "resumen cálido (3-5 frases)",
  "score_interpretation": "lectura conjunta de tensión corporal, conexión, fatiga y regulación",
  "strengths": ["2 a 4 fortalezas corporales detectadas"],
  "growth_areas": ["2 a 3 áreas de cuidado corporal amables"],
  "detected_patterns": ["2 a 4 patrones cuerpo-emoción observados"],
  "motivational_closing": "frase final breve y compasiva"
}`;

    const toleratingSchema = `{
  "main_tolerance_pattern": "lo que la persona ha estado tolerando demasiado tiempo (1-2 frases honestas)",
  "main_emotional_cost": "el costo emocional invisible detectado (2-3 frases)",
  "tolerance_relationship_pattern": "su patrón relacional dominante en 1 frase (ej. 'Te callas y aguantas hasta explotar por dentro')",
  "tolerance_main_fear": "el miedo central detrás de no poner límites (1 frase)",
  "self_abandonment_signs": ["2 a 4 señales concretas de autoabandono detectadas"],
  "main_insight": "insight central, 1-2 frases potentes (tipo 'quizá ya no necesitas seguir cargando esto')",
  "strengths": ["3 a 5 fortalezas detectadas en su honestidad y conciencia"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "boundary_recommendation": "una recomendación clara y cálida sobre dónde empezar a poner un límite (1-2 frases)",
  "first_self_respect_action": "el primer micro acto de autorrespeto muy concreto para esta semana (1 frase)",
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "summary": "resumen cálido (3-5 frases), hablándole de tú",
  "score_interpretation": "lectura conjunta de desgaste, tolerancia, autoabandono y necesidad de límites",
  "detected_patterns": ["2 a 4 patrones observados entre lo normalizado, las reacciones y los miedos"],
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "closing_message": "lo que necesita escuchar hoy (1-2 líneas muy cálidas y protectoras)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const boundariesSchema = `{
  "boundary_style": "estilo dominante de límites en 1 frase (ej. 'Te cuidas callándote para evitar conflicto')",
  "main_boundary_issue": "el límite principal que más le cuesta hoy (1 frase concreta)",
  "people_pleasing_level_label": "lectura cálida del nivel de complacencia detectado (1 frase)",
  "hidden_cost": "el costo invisible de no poner límites detectado en sus respuestas (2-3 frases honestas, sin culpa)",
  "healthy_boundary_phrase": "UNA frase de límite saludable y realista, en primera persona, que pueda usar esta semana",
  "boundary_library_phrases": ["3 a 5 frases de límites personalizadas para esta persona, basadas en sus miedos, áreas y reacciones — en primera persona, cortas, claras y amables"],
  "first_boundary_action": "el primer micro límite muy concreto para empezar esta semana (1 frase)",
  "main_insight": "insight central, 1-2 frases potentes (ej. 'no estás siendo egoísta, estás dejando de abandonarte')",
  "summary": "resumen cálido (3-5 frases), hablándole de tú",
  "score_interpretation": "lectura conjunta de límites saludables, complacencia, culpa interpersonal y desgaste relacional",
  "strengths": ["3 a 5 fortalezas detectadas en cómo se relaciona y cuida"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "detected_patterns": ["2 a 4 patrones observados entre miedos, reacciones y áreas de dificultad"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "closing_message": "lo que necesita escuchar hoy (1-2 líneas muy cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const guiltSchema = `{
  "guilt_level": "lectura cálida del nivel de culpa al elegirse (1 frase)",
  "main_guilt_trigger": "el momento de culpa más característico detectado (1 frase, sin juicio)",
  "people_pleasing_pattern": "patrón complaciente dominante en 1 frase (ej. 'Dices que sí cuando por dentro quieres descansar')",
  "hidden_fear": "el miedo central detrás de la culpa al priorizarse (1 frase honesta)",
  "learned_belief": "la creencia aprendida sobre priorizarse que carga (1 frase, en su voz, ej. 'Aprendiste que cuidarte es egoísta')",
  "hidden_cost": "el costo emocional invisible de no elegirse (2-3 frases honestas, sin culpa)",
  "healthy_reframe": "UNA reformulación amable, breve y poderosa de la creencia (1-2 frases)",
  "reframe_library": ["3 a 5 reframes personalizados (ANTES → DESPUÉS o solo el DESPUÉS), cortos, en primera persona, basados en sus respuestas"],
  "small_self_choice": "un micro acto concreto de elegirse esta semana (1 frase)",
  "first_self_choice_action": "el primer paso hoy/mañana, muy pequeño y realista (1 frase)",
  "supportive_message": "lo que necesita escuchar hoy sobre elegirse (1-2 líneas muy cálidas)",
  "main_insight": "insight central potente (ej. 'elegirte no te aleja del amor, te acerca a ti')",
  "summary": "resumen cálido (3-5 frases), hablándole de tú",
  "score_interpretation": "lectura conjunta de culpa al elegirse, complacencia, autoabandono y capacidad de priorización",
  "strengths": ["3 a 5 fortalezas detectadas en su conciencia y honestidad"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "detected_patterns": ["2 a 4 patrones observados entre creencias, miedos y momentos de culpa"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "closing_message": "lo que necesita escuchar hoy (1-2 líneas muy cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const limitVoiceSchema = `{
  "communication_style": "estilo dominante al comunicar límites en 1 frase (ej. 'Te callas y luego explotas')",
  "main_fear": "el miedo central al hablar claro (1 frase)",
  "avoidance_pattern": "patrón de evitación observado en 1 frase honesta",
  "main_insight": "insight central potente (ej. 'puedes ser amable sin abandonarte')",
  "strengths_detected": ["3 a 5 fortalezas detectadas en su conciencia y voz"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "boundary_scripts": [{"tone":"💛 Suave|🧠 Claro|🛡️ Firme|🌱 Vulnerable","text":"frase de límite en primera persona, corta, clara y amable"}],
  "power_phrase": "UNA frase de poder personalizada para esta persona (1 línea, en primera persona)",
  "conversation_tip": "un tip práctico para la conversación que ha estado evitando (1-2 frases)",
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "closing_message": "lo que necesita escuchar hoy (1-2 líneas muy cálidas)",
  "summary": "resumen cálido (3-5 frases), hablándole de tú",
  "score_interpretation": "lectura conjunta de claridad comunicativa, evitación, seguridad y autoexpresión",
  "detected_patterns": ["2 a 4 patrones observados entre miedos, reacciones y escenarios"],
  "next_24h_action": "una acción pequeña y realista para las próximas 24 horas",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const fearSchema = `{
  "main_fear": "el miedo central que sostiene la dificultad de poner límites (1 frase honesta)",
  "fear_origin": "lectura cálida y no diagnóstica del origen probable de ese miedo (1-2 frases)",
  "worst_imagined_scenario": "qué teme que pase si pone el límite (1 frase, basada en sus respuestas)",
  "real_cost_of_avoiding": "el costo real, hoy, de no poner ese límite (1-2 frases)",
  "fear_to_behavior_map": [{"fear":"miedo concreto","behavior":"lo que termina haciendo","cost":"lo que le cuesta"}],
  "courageous_belief": "creencia más sana y verdadera para sustituir el miedo (1 frase poderosa en primera persona)",
  "main_insight": "insight central potente (ej. 'el miedo no desaparece, pero ya no decide por ti')",
  "summary": "resumen cálido (3-5 frases), hablándole de tú",
  "score_interpretation": "lectura conjunta de miedo relacional, evitación, seguridad interna y dependencia de aprobación",
  "strengths": ["3 a 5 fortalezas detectadas en su conciencia y honestidad"],
  "growth_areas": ["2 a 4 áreas de crecimiento amables y accionables"],
  "detected_patterns": ["2 a 4 patrones observados entre miedos, conductas y costos"],
  "courage_micro_steps": ["3 micro pasos concretos y realistas para los próximos 30 días"],
  "reflection_questions": ["3 preguntas profundas para esta semana"],
  "next_24h_action": "una acción pequeña, valiente y realista para las próximas 24 horas",
  "closing_message": "lo que necesita escuchar hoy (1-2 líneas muy cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const moneyBeliefsSchema = `{
  "dominant_money_belief": "la creencia financiera dominante detectada (1 frase honesta)",
  "inherited_patterns": ["3 a 5 patrones heredados concretos detectados (frases, contextos, vivencias)"],
  "scarcity_level": "lectura cálida del nivel de escasez mental (1 frase)",
  "money_story_summary": "resumen cálido (3-5 frases) de la historia financiera personal",
  "main_blocker": "el bloqueo financiero principal detectado (1 frase)",
  "main_insight": "insight central potente (1-2 frases tipo 'quizá no estás mal con dinero, estás operando desde creencias viejas')",
  "strengths": ["3 a 5 fortalezas financieras detectadas"],
  "growth_areas": ["2 a 4 áreas de crecimiento financiero amables y accionables"],
  "healthy_money_reframe": "UNA reformulación amable y poderosa de la creencia limitante principal (1-2 frases en primera persona)",
  "new_money_beliefs": ["3 a 5 nuevas creencias financieras sanas (ANTES → DESPUÉS o solo el DESPUÉS), cortas, en primera persona"],
  "next_financial_action": "un micro paso financiero concreto y realista para esta semana",
  "reflection_questions": ["3 preguntas profundas para seguir explorando esta semana"],
  "detected_patterns": ["2 a 4 patrones observados entre historia, frases heredadas y creencias actuales"],
  "summary": "resumen cálido (3-5 frases), hablándole de tú",
  "score_interpretation": "lectura conjunta de escasez mental, merecimiento, ansiedad y apertura al crecimiento",
  "next_24h_action": "una acción pequeña, realista y consciente para las próximas 24 horas",
  "closing_message": "lo que necesita escuchar hoy sobre el dinero (1-2 líneas muy cálidas)",
  "motivational_closing": "frase de cierre breve y poderosa"
}`;

    const schemaToUse = isFinancial2
      ? moneyBeliefsSchema
      : isBoundaries6
      ? fearSchema
      : isBoundaries5
      ? limitVoiceSchema
      : isBoundaries4
      ? guiltSchema
      : isBoundaries2
      ? toleratingSchema
      : isBoundaries
      ? boundariesSchema
      : isCuerpo
      ? cuerpoSchema
      : isSilencio
      ? silencioSchema
      : isKit
      ? kitSchema
      : isCalma
      ? calmaSchema
      : isProfunda
      ? profundaSchema
      : isABC
      ? abcSchema
      : isDetonantes
        ? detonantesSchema
        : isTermometro
          ? termometroSchema
          : isDrenando
            ? drenandoSchema
            : isEspejo
              ? espejoSchema
              : isHistorias
                ? historiasSchema
                : isFuturo
                  ? futuroSchema
                  : isBrujula
                    ? brujulaSchema
                    : isCapas
                      ? capasSchema
                      : baseSchema;

    const systemPrompt = `Eres un mentor cálido, empático e inteligente especializado en autoconocimiento y bienestar emocional.

REGLAS ESTRICTAS:
- NO diagnostiques psicológicamente.
- NO uses lenguaje clínico ("trastorno", "patología", "síntoma").
- NO juzgues a la persona.
- Sé cálido, cercano, profundo y útil. Tutea siempre en español natural.
- Detecta patrones reales entre las respuestas (escala, abiertas y selección múltiple).
- Si el score / nivel sugiere desconexión o desgaste → tono contenedor y amable.
- Si es intermedio → tono motivador y esperanzador.
- Si es alto → tono de expansión y celebración.
${isCapas ? `- Este ejercicio mide DOS indicadores: AUTENTICIDAD y DESGASTE EMOCIONAL.
- Identifica la versión (contexto: trabajo, familia, amigos, pareja, soledad, redes sociales) más auténtica y la más agotada usando las respuestas.
- Conecta emociones marcadas con autenticidad/desgaste por contexto.
- Lee con cuidado las frases para completar del bloque "Contradicciones".` : ""}${isBrujula ? `- Este ejercicio mide DOS indicadores: ALINEACIÓN PERSONAL y DESCONEXIÓN INTERNA.
- En el bloque "Valores Centrales" la persona seleccionó primero 10, luego 5, y finalmente 3 valores. Los 3 que aparecen en la TERCERA selección (kind=values_top3) son sus valores guía: úsalos exactamente en core_values.
- En el bloque "Alineación Personal" cada valor tiene 4 preguntas (presencia, decisiones, sacrificio, evidencia). Cruza esa información para detectar incongruencias.
- Analiza coherencia personal, conflictos internos, sacrificios, autosabotaje y dirección de vida.
- Tono: mentor reflexivo. Profundo, humano y sabio.` : ""}${isFuturo ? `- Este ejercicio mide UN indicador: ÍNDICE DE ALINEACIÓN FUTURA (0-100).
- La persona visualizó su yo futuro en el bloque "Visualiza tu Futuro" (10 respuestas abiertas) y escribió una CARTA DEL FUTURO (bloque "Carta del Futuro").
- Usa la carta y las visualizaciones para extraer su identidad aspiracional, hábitos y miedos.
- El bloque "Distancia Presente-Futuro" tiene 7 escalas (algunas invertidas: posponer cambios, miedo).
- El bloque "El Primer Paso" reveló cambios urgentes, hábitos pequeños y la acción de 24h.
- Tono: inspirador, profundo, emocional. NUNCA empresarial, NUNCA diagnóstico.
- En future_message, escribe EN PRIMERA PERSONA como si su yo futuro le hablara directamente ("Recuerda que…", "No olvides que…").` : ""}${isHistorias ? `- Este ejercicio mide TRES indicadores: AUTOCRÍTICA (0-100), AUTOACEPTACIÓN (0-100) y NARRATIVA LIMITANTE (0-100).
- El bloque "Tu Diálogo Interno" revela las frases que se repite y los miedos.
- El bloque "Creencias Invisibles" tiene escalas: alto en self_criticism = más autocrítica; alto en self_acceptance = más sana.
- El bloque "Detectando Tu Narrativa" muestra las historias que más resuenan — úsalas como base para dominant_story y main_limiting_belief.
- El bloque "Rompiendo la Historia" da material para healthier_reframe y probable_origin.
- El bloque "Reescribiendo Tu Narrativa" tiene frases para completar que muestran cómo quiere hablarse.
- Analiza diálogo interno dominante, autoestima percibida, miedo dominante, exigencia personal, autosabotaje y resiliencia.
- Tono: mentor sabio, profundamente cálido, sin juicio. NUNCA clínico.
- daily_reframe debe ser una frase corta para mostrar cada mañana, hablándole de tú.` : ""}${isEspejo ? `- Este ejercicio mide TRES indicadores: AUTOIMAGEN (0-100), AUTENTICIDAD PERCIBIDA (0-100) y AUTOEXIGENCIA EMOCIONAL (0-100).
- Bloque "Cómo te ves": cómo se evalúa en autenticidad, escucha, estabilidad, confianza, límites, autocompasión, comunicación, disciplina, confiabilidad, orgullo personal.
- Bloque "Cómo crees que te ven": rasgos positivos y negativos (los negativos están invertidos: alto = se percibe MENOS frío/ansioso/controlador/etc.).
- Bloque "Tu personaje social": revela qué muestra, qué esconde, qué emoción oculta y qué teme que descubran. Úsalo para most_visible_mask, main_fear y blind_spots.
- Bloque "Tu sombra ligera": las partes rechazadas (más partes = más autoexigencia). Conecta con hidden_strengths.
- Bloque "Mirada compasiva": material vivo para loving_message_to_self — usa las palabras del usuario sobre lo que necesita escuchar y lo que merece amor.
- Detecta puntos ciegos (incongruencias entre cómo se ve y cómo cree que la ven, entre lo que muestra y lo que esconde).
- Tono: ESPEJO suave, compasivo, humano y reflexivo. NUNCA juicio. NUNCA clínico.
- loving_message_to_self debe sentirse como una carta breve y genuina de alguien que ama profundamente a la persona — NUNCA manipuladora, NUNCA empalagosa.` : ""}${isDrenando ? `- Este ejercicio mide TRES indicadores: AGOTAMIENTO EMOCIONAL (0-100), AUTOCUIDADO (0-100) y SATURACIÓN MENTAL (0-100).
- Bloque "Tu Nivel de Energía": escalas de agotamiento (algunas invertidas: "Tengo energía", "Mi mente descansa", "Disfruto mi día" — alto = más recursos = menos agotamiento).
- Bloque "Personas y Contextos": fuentes seleccionadas + la situación que más drena. Úsalo para main_energy_drainers.
- Bloque "Tu Carga Invisible": material vivo para hidden_weight — lo que carga, las decisiones evitadas, las conversaciones pendientes.
- Bloque "Tu Energía Real": escalas de autocuidado (decir no, descansar, pedir ayuda, espacios propios).
- Bloque "Recuperar Energía": de aquí salen recovery_actions y el siguiente paso.
- Detecta autoabandono, agotamiento relacional, necesidad de límites, necesidades emocionales no atendidas.
- Tono: contenedor, cálido, esperanzador. NUNCA clínico. NUNCA diagnóstico.
- compassionate_message debe hacerla sentir: "no estoy fallando… quizá estoy cansada".` : ""}${isTermometro ? `- Este ejercicio es un CHECK-IN EMOCIONAL DIARIO con dos indicadores: INTENSIDAD EMOCIONAL (0-100) y SATURACIÓN EMOCIONAL (0-100).
- Bloque "Emoción Principal": usa las emociones marcadas (con emoji) para extraer dominant_emotion (la más fuerte).
- Bloque "Intensidad": escala 1-5.
- Bloque "Detonante": fuentes seleccionadas. Úsalo para likely_trigger.
- Bloque "Tu Respuesta Emocional": cómo reaccionó (sano vs evitativo).
- Bloque "Necesidad Emocional": qué necesita hoy. Úsalo para emotional_need.
- Bloque "Mini Reflexión": lo que necesita escuchar — base para closing_message y helpful_reframe.
- Tono: muy cálido, contenedor, breve, humano. Como alguien que entendió. NUNCA clínico, NUNCA terapéutico, NUNCA robot.
- micro_ritual: 2-4 pasos concretos y muy pequeños, separados por punto (ej: "Respira 4 veces lento. Apoya las manos en el pecho. Dite una palabra amable.").` : ""}${isDetonantes ? `- Este ejercicio mide DOS indicadores: REACTIVIDAD EMOCIONAL (0-100) y AUTOCONOCIMIENTO EMOCIONAL (0-100).
- Bloque "Tus Emociones Más Frecuentes": las emociones que aparecen más + la más difícil de manejar. Úsalo para dominant_emotion.
- Bloque "¿Qué Te Activa?": situaciones detonantes seleccionadas. Identifica el dominant_trigger más recurrente o más significativo.
- Bloque "Tu Patrón Emocional": 6 preguntas abiertas sobre una situación reciente, lo que sintió, lo que pensó, la necesidad, el eco del pasado, la parte amenazada. ES EL MATERIAL MÁS RICO — úsalo para main_pattern, hidden_emotional_need, main_insight.
- Bloque "Tu Estilo de Reacción": estilos seleccionados → reaction_style (sintetiza en 1 frase, ej: 'Te cierras y sobrepiensas en silencio').
- Bloque "Reescribiendo Tu Respuesta": material para next_time_reminder y regulation_tips. Si la persona escribió su propia frase reguladora, hónrala o refínala.
- Conecta los puntos: detonante → emoción → reacción → necesidad. El main_pattern debe sentirse como un mapa claro.
- NO diagnostiques. NO hables de "heridas" en lenguaje clínico — usa "lo que se activó", "lo que esto te recuerda".
- Tono: muy humano, inteligente, compasivo. Debe sentirse como 'ahora entiendo por qué me pasa esto'.` : ""}${isABC ? `- Este ejercicio aplica el modelo ABC (situación → pensamiento → emoción → reacción → reframe) con TRES indicadores: RIGIDEZ DE PENSAMIENTO (0-100), CAPACIDAD DE REENCUADRE (0-100) e INTENSIDAD EMOCIONAL (0-100, informativa).
- Bloque "El Momento": situación reciente. Úsalo para event_summary.
- Bloque "El Pensamiento Automático": frase mental + qué tanto la creyó (rigidez). Úsalo para automatic_thought.
- Bloque "La Emoción": emociones marcadas + intensidad + emoción dominante.
- Bloque "Tu Reacción": cómo reaccionó + si la ayudó. Úsalo para reaction_pattern.
- Bloque "El Reframe": consejo a amigo, otra explicación, pensamiento más amable, frases completadas. ES MATERIAL DE ORO — úsalo para hidden_interpretation, gentle_reframe, next_time_tool. Si la persona escribió un reframe propio, hónralo y refínalo.
- Conecta: situación → pensamiento → emoción → reacción → reencuadre. main_insight debe sentirse 'wow, no lo había visto así'.
- NO uses lenguaje clínico ("distorsión cognitiva", "trauma"). Usa "interpretación", "lo que tu mente concluyó muy rápido".
- Tono: muy inteligente, cálido y claro. Como un mentor que abre los ojos sin juzgar.` : ""}${isProfunda ? `
- Este ejercicio mide DOS indicadores: CONCIENCIA EMOCIONAL (0-100) y PROFUNDIDAD EMOCIONAL (0-100).
- Bloque "La Emoción Visible": emoción más presente (úsala para surface_emotion), frecuencia e intensidad.
- Bloque "El Momento Reciente": situación + reacciones (revelan el estilo de protección — úsalo para protective_pattern).
- Bloque "Profundizando": qué estaba en riesgo, miedo escondido, parte herida, necesidad real, emoción oculta. ES EL CORAZÓN del ejercicio — úsalo para hidden_emotion, main_need, main_fear y emotional_pattern.
- Bloque "Mapa Emocional Profundo": conexiones marcadas (visible → oculta). Si la persona marcó conexiones, hónralas y úsalas para confirmar hidden_emotion.
- Bloque "Validación y Necesidad": qué necesita escuchar, qué darse, cómo acompañarse, qué recordar, y la frase "Quizá no estoy ___ quizá estoy ___". ES MATERIAL VIVO para self_validation_message y closing_message.
- emotional_pattern debe sentirse como un descubrimiento: "Tu enojo → en realidad esconde sentirte ignorada → lo que necesitabas era validación".
- self_validation_message: tono muy cálido y humano, en segunda persona, como una persona que te entiende profundamente. NUNCA manipulador, NUNCA empalagoso.
- NO uses lenguaje clínico ("herida de la infancia", "trauma", "patrón disfuncional"). Usa "lo que se activó", "lo que esto te recuerda", "la parte de ti que…".
- Tono: íntimo, profundo, muy humano. Debe sentirse como un espacio seguro.` : ""}${isCalma ? `
- Este ejercicio es un CHECK-IN DE CALMA con CUATRO indicadores: ÍNDICE DE CALMA (0-100), SATURACIÓN MENTAL (0-100), REGULACIÓN EMOCIONAL (0-100) y FATIGA EMOCIONAL (0-100).
- Bloque "Tu Energía": estado de energía + slider de saturación mental.
- Bloque "Tu Mente": 6 escalas (algunas invertidas: "cuesta apagar pensamientos", "sobrepensando", "pesado").
- Bloque "Tu Cuerpo": sensaciones corporales + zonas de tensión. Úsalo para body_state y body_message.
- Bloque "Tu Necesidad Real": qué necesita hoy (úsalo para main_need).
- Bloque "Tu Ancla de Calma": qué le ayuda habitualmente — hónralo en gentle_recommendation y micro_ritual.
- Bloque "Momento de Respirar": qué tan calmado se siente después de respirar.
- micro_ritual: 2-4 pasos cortos. Si saturación alta → brain dump. Si ansiedad → respiración 4-4-6. Si agotamiento → 15 min sin estímulos.
- Tono: MUY suave, calmante, breve, humano. Como una pausa amable. NUNCA clínico, NUNCA terapéutico. Debe sentirse como un respiro.` : ""}${isKit ? `
- Este ejercicio construye el KIT DE CALMA PERSONAL con TRES indicadores: AUTOCONOCIMIENTO REGULATORIO (0-100), DEPENDENCIA DE MECANISMOS POCO ÚTILES (0-100) y FORTALEZA DE RECURSOS INTERNOS (0-100).
- PERFIL DE CALMA detectado: ${kit_calm_profile ? `${kit_calm_profile.emoji} ${kit_calm_profile.label} — ${kit_calm_profile.description}` : "no determinado"}. Úsalo EXACTO en "calm_profile" y "calm_profile_description".
- TOP 5 herramientas reales del usuario: ${Array.isArray(kit_top_tools) && kit_top_tools.length ? kit_top_tools.join(", ") : "—"}. Construye best_regulation_tools y recommended_calm_protocol PRIORIZANDO estas.
- Hábitos poco útiles seleccionados: ${Array.isArray(kit_unhelpful_list) && kit_unhelpful_list.length ? kit_unhelpful_list.join(", ") : "—"}. Úsalos para unhelpful_patterns con tono compasivo, NUNCA juzgando.
- Bloque "Qué Te Regula": amplitud + top 5 que SÍ funcionan.
- Bloque "Lo Que No Funciona": hábitos poco útiles + frase abierta.
- Bloque "Tu Perfil de Calma": qué herramienta elige para cada emoción (ansiedad, tristeza, enojo, agotamiento, estrés, soledad, confusión). Usa esto para refinar el perfil y construir el protocolo.
- Bloque "Tu Refugio Emocional": lugar ideal, personas seguras, frase, lo que necesita recordar, versión en paz. ES MATERIAL VIVO para personal_refuge.
- Bloque "Tu Protocolo de Calma": 5 frases completadas (primero necesito…, después me ayuda…, debo evitar…, necesito recordarme…, si todo se siente demasiado puedo…). HÓNRALAS literalmente en recommended_calm_protocol.
- emergency_grounding_tool: una técnica concreta de 30-60 segundos (ej: "5-4-3-2-1 sensorial", "Respira 4-4-6 mientras nombras 3 sonidos").
- main_insight debe sentirse: "no necesitas hacer lo que le sirve a otros, esto SÍ te sirve a ti".
- Tono: muy cálido, sabio y práctico. NUNCA clínico, NUNCA terapéutico. Debe sentirse como "ahora tengo algo a qué volver cuando me sienta mal".` : ""}${isSilencio ? `
- Este ejercicio es DESCARGA MENTAL con CUATRO indicadores: RUIDO MENTAL (0-100), SOBREPENSAMIENTO (0-100), SATURACIÓN COGNITIVA (0-100) y CAPACIDAD DE SOLTAR (0-100).
- CARGAS MENTALES seleccionadas: ${Array.isArray(silencio_mental_loads) && silencio_mental_loads.length ? silencio_mental_loads.join(", ") : "—"}. Úsalas en main_mental_loads.
- Bloque "Tu Ruido Mental": 8 escalas (2 invertidas: presente, paz mental).
- Bloque "¿Qué Ocupa Tu Mente?": cargas + pensamiento recurrente abierto. Hónralo en dominant_thought.
- Bloque "Descarga Mental": brain dump libre — léelo con cariño, NO lo cites textual.
- Bloque "Filtrando el Ruido": separa lo accionable, lo compartido y la incertidumbre. Usa esto para what_can_wait.
- Bloque "Reencuadre Suave": 6 frases (necesidad mental, sobre-control, soltar, suficiente, "Hoy no necesito resolver…", "Puedo darme permiso para…"). MATERIAL VIVO para control_patterns, gentle_reframe, micro_relief_action.
- Bloque "Cierre de Calma": post-respiración.
- micro_ritual: 2-4 pasos breves (ej: brain dump 5 min, música instrumental, respiración 4-4-6).
- Tono: MUY suave, calmante, pausado. Debe sentirse: "no tengo que resolver todo hoy". NUNCA clínico.` : ""}${isCuerpo ? `
- Este ejercicio es BODY SCAN EMOCIONAL con CUATRO indicadores: TENSIÓN CORPORAL (0-100), CONEXIÓN CORPORAL (0-100), FATIGA FÍSICO-EMOCIONAL (0-100) y REGULACIÓN CORPORAL (0-100).
- ZONAS DE TENSIÓN detectadas: ${Array.isArray(body_tension_zones) && body_tension_zones.length ? body_tension_zones.join(", ") : "—"}. Úsalas EXACTO en tension_zones.
- EMOCIONES asociadas seleccionadas: ${Array.isArray(body_emotion_list) && body_emotion_list.length ? body_emotion_list.join(", ") : "—"}. Conéctalas con la tensión en possible_emotional_connection.
- NECESIDADES corporales: ${Array.isArray(body_need_list) && body_need_list.length ? body_need_list.join(", ") : "—"}. Úsalas para body_need y gentle_body_recommendation.
- Bloque "Check-in corporal": cómo se siente + escala de conexión corporal.
- Bloque "Mapa corporal": zonas + tipo de sensación (tensión, dolor, presión, pesadez, vacío, agitación, rigidez, sensibilidad, cansancio).
- Bloque "Tu cuerpo y tus emociones": emociones asociadas + carta abierta "si tu cuerpo pudiera hablar…". MATERIAL VIVO — hónralo en body_state_summary y main_insight.
- Bloque "Necesidad corporal": qué necesita el cuerpo.
- Bloque "Micro escaneo guiado": post-respiración (presencia con el cuerpo).
- Bloque "Compromiso de cuidado": 4 respuestas (acto de cuidado, señal ignorada, qué dejar de exigirse, frase para completar). Usa "señal ignorada" para ignored_signal y la frase final para reflejar su intención.
- micro_body_ritual: 2-4 pasos físicos concretos según zonas + necesidad (ej. hombros + estrés → estiramiento + respiración 4-4-6; estómago + ansiedad → mano en vientre + exhalaciones largas).
- NUNCA diagnosticar, NUNCA lenguaje médico, NUNCA sugerir enfermedades.
- Tono: muy calmante, amable, compasivo. Debe sentirse: "mi cuerpo estaba intentando decirme algo".` : ""}${isBoundaries ? `
- Este ejercicio es LÍMITES INTERNOS con CUATRO indicadores: LÍMITES SALUDABLES (0-100), COMPLACENCIA EMOCIONAL (0-100), CULPA INTERPERSONAL (0-100) y DESGASTE RELACIONAL (0-100).
- ÁREAS donde más le cuesta: ${Array.isArray(boundary_areas_list) && boundary_areas_list.length ? boundary_areas_list.join(", ") : "—"}.
- REACCIONES típicas seleccionadas: ${Array.isArray(boundary_reactions_list) && boundary_reactions_list.length ? boundary_reactions_list.join(", ") : "—"}. Úsalas para boundary_style.
- MIEDOS al poner límites: ${Array.isArray(boundary_fears_list) && boundary_fears_list.length ? boundary_fears_list.join(", ") : "—"}. Úsalos para hidden_cost y growth_areas.
- PRIMER LÍMITE posible: ${Array.isArray(boundary_small_limit_list) && boundary_small_limit_list.length ? boundary_small_limit_list.join(", ") : "—"}. Hónralo en first_boundary_action.
- FRASES que le ayudarían: ${Array.isArray(boundary_helpful_phrase_list) && boundary_helpful_phrase_list.length ? boundary_helpful_phrase_list.join(", ") : "—"}. Refínalas o complétalas en boundary_library_phrases (genera 3-5 totales personalizadas).
- Bloque "Tu relación con los límites": 8 escalas (6 invertidas: culpa, complacencia, miedo a decepcionar, dificultad para pedir; 2 sanas: pongo límites con claridad, elijo bienestar sin culpa).
- Bloque "¿Dónde más te cuesta?": áreas + situación que más desgasta.
- Bloque "Tu patrón de límites": reacciones y miedos al poner límites.
- Bloque "El costo de no poner límites": 5 abiertas (qué has tolerado, qué parte se cansó, emoción al no priorizarte, costo del silencio, qué cambiar). MATERIAL VIVO para hidden_cost y main_insight.
- Bloque "Tu voz interior": 4 frases para completar (decir no cuando…, dejar de…, poner límites significa…, verdad incómoda…). Úsalas para reflejar su voz real.
- Bloque "Tu primer límite": pequeño paso + frase que le ayudaría.
- main_insight debe sentirse: "no estás siendo egoísta, estás dejando de abandonarte".
- healthy_boundary_phrase y boundary_library_phrases: frases CORTAS, en primera persona, claras, amables, NUNCA agresivas.
- NO uses lenguaje clínico ("codependencia", "trauma", "límites tóxicos"). Usa "te cuesta", "te has acostumbrado a", "la parte de ti que cuida a otros".
- Tono: muy cálido, contenedor, claro y respetuoso. Como un mentor que valida y abre puertas, no que juzga.` : ""}${isBoundaries4 ? `
- Este ejercicio es MI CULPA AL ELEGIRME con CUATRO indicadores: CULPA AL AUTOCUIDADO (0-100, primario), COMPLACENCIA EMOCIONAL (0-100), AUTOABANDONO (0-100) y CAPACIDAD DE PRIORIZACIÓN (0-100).
- MOMENTOS de culpa detectados: ${Array.isArray(guilt_moments_list) && guilt_moments_list.length ? guilt_moments_list.join(", ") : "—"}. Úsalos para main_guilt_trigger y detected_patterns.
- REACCIONES complacientes seleccionadas: ${Array.isArray(pleasing_reactions_list) && pleasing_reactions_list.length ? pleasing_reactions_list.join(", ") : "—"}. Úsalas para people_pleasing_pattern.
- EMOCIONES al decepcionar a otros: ${Array.isArray(disappointment_emotions_list) && disappointment_emotions_list.length ? disappointment_emotions_list.join(", ") : "—"}. Conéctalas con hidden_fear y hidden_cost.
- Bloque "Tu relación con la culpa": escalas que miden culpa al elegirse, complacencia y miedo a decepcionar.
- Bloque "Momentos de culpa": momentos concretos donde la culpa aparece (15 opciones).
- Bloque "El origen": de dónde viene la creencia (familiar, cultural, rol asumido). Úsalo para learned_belief.
- Bloque "Tu patrón de complacencia": reacciones automáticas + emociones al decepcionar.
- Bloque "Reencuadrando": creencias para transformar — material vivo para healthy_reframe y reframe_library.
- Bloque "Tu acto de elección": pequeño paso de autopriorización + mensaje a tu yo culpable.
- main_insight debe sentirse: "elegirte no te aleja del amor, te acerca a ti".
- healthy_reframe y reframe_library: amables, breves, en primera persona, NUNCA combativas (no "no me importa lo que piensen", sí "puedo cuidarme y seguir siendo querido/a").
- NO uses lenguaje clínico ("codependencia", "complejo", "trauma"). Usa "aprendiste a", "te has acostumbrado a", "la parte de ti que cuida a otros antes que a ti".
- Tono: contenedor, validante, esperanzador. Como abrazo + mentora honesta. Debe sentirse: "puedo elegirme sin dejar de amar".` : ""}${isBoundaries5 ? `
- Este ejercicio es MI VOZ AL PONER LÍMITES con CUATRO indicadores: CLARIDAD COMUNICATIVA (0-100, primario), EVITACIÓN (0-100), SEGURIDAD COMUNICATIVA (0-100) y AUTOEXPRESIÓN SALUDABLE (0-100).
- ESCENARIOS difíciles seleccionados: ${Array.isArray(difficult_scenarios_list) && difficult_scenarios_list.length ? difficult_scenarios_list.join(", ") : "—"}. Úsalos para contextualizar boundary_scripts.
- REACCIONES típicas al incomodarse: ${Array.isArray(speech_reactions_list) && speech_reactions_list.length ? speech_reactions_list.join(", ") : "—"}. Úsalas para communication_style y avoidance_pattern.
- MIEDOS al hablar claro: ${Array.isArray(speech_fears_list) && speech_fears_list.length ? speech_fears_list.join(", ") : "—"}. Úsalos para main_fear.
- TONO deseado a practicar: ${desired_tone ?? "—"}. Refleja ese tono en al menos una entrada de boundary_scripts.
- Bloque "Reescribiendo tu voz": elige una situación + lo que querría decir realmente. Hónralo en boundary_scripts y conversation_tip.
- Bloque "Roleplay": frase cruda + tono deseado — transforma la frase cruda en versiones sanas, cortas, en primera persona.
- Bloque "Frase de poder": completar 5 frases — material vivo para power_phrase.
- boundary_scripts: 3 a 5 entradas como {tone, text}. Texto SIEMPRE en primera persona, corto, sin justificarse de más, sin culpa, sin agresión. Si hay tono deseado, asegúrate de incluir al menos uno de ese tono.
- power_phrase: 1 línea poderosa, cálida y específica para esta persona (basada en sus 5 frases completadas).
- main_insight debe sentirse: "puedo ser amable sin abandonarme".
- NO uses lenguaje clínico ("asertividad pasiva-agresiva", "trauma", "codependencia"). Usa "te has acostumbrado a", "tu voz se aprendió a guardar".
- Tono: empoderador, cálido y práctico. Debe sentirse: "ok… ahora sí sé qué decir".` : ""}${isBoundaries6 ? `
- Este ejercicio es EL MIEDO DETRÁS DE MIS LÍMITES con CUATRO indicadores: MIEDO RELACIONAL (0-100, primario), EVITACIÓN EMOCIONAL (0-100), SEGURIDAD INTERNA (0-100) y DEPENDENCIA DE APROBACIÓN (0-100).
- MIEDOS imaginados seleccionados: ${Array.isArray(imagined_fears_list) && imagined_fears_list.length ? imagined_fears_list.join(", ") : "—"}. Úsalos para fear_to_behavior_map y main_fear.
- ESCENARIO temido descrito: "${worst_scenario ?? "—"}". Úsalo para worst_imagined_scenario.
- CONVERSACIÓN evitada: "${avoided_conversation ?? "—"}". Conéctala con real_cost_of_avoiding.
- FRASE para recordar elegida: "${phrase_to_remember ?? "—"}". Si encaja, úsala como base de courageous_belief.
- Bloque "Tu relación con el miedo": escalas de miedo al rechazo, conflicto, abandono, decepcionar, ser visto/a.
- Bloque "¿Qué temes que pase?": miedos concretos (15 opciones) + escenario imaginado.
- Bloque "El origen": de dónde aprendió a temer poner límites (familia, etapa, vivencia repetida).
- Bloque "El costo": qué le ha costado evitar poner ese límite (material vivo para real_cost_of_avoiding).
- Bloque "Reescribiendo el miedo": creencia más sana para sustituir el miedo — base de courageous_belief.
- Bloque "Tu acto de valentía": micro paso valiente + frase para recordar.
- fear_to_behavior_map: 3 a 5 entradas {fear, behavior, cost}. Cada miedo debe conectar con una conducta real y un costo concreto (no genéricos).
- courage_micro_steps: 3 pasos muy concretos, pequeños y realistas — primer paso, segundo paso, paso de 30 días.
- main_insight debe sentirse: "el miedo no desaparece, pero ya no decide por ti".
- NO uses lenguaje clínico ("ansiedad social", "trauma de apego", "fobia"). Usa "aprendiste a temer", "tu cuerpo recuerda que…".
- Tono: contenedor, valiente, esperanzador. Debe sentirse: "puedo tener miedo y aun así elegirme".` : ""}${isFinancial2 ? `
- Este ejercicio es MIS CREENCIAS FINANCIERAS con CINCO indicadores: ESCASEZ MENTAL (0-100, primario), MERECIMIENTO FINANCIERO (0-100), SEGURIDAD FINANCIERA (0-100), APERTURA AL CRECIMIENTO (0-100) y ANSIEDAD FINANCIERA (0-100).
- FRASES HEREDADAS seleccionadas: ${Array.isArray(inherited_phrases_list) && inherited_phrases_list.length ? inherited_phrases_list.join(" | ") : "—"}. Úsalas literalmente en inherited_patterns (refinando si hace falta).
- PATRONES ACTUALES detectados: ${Array.isArray(current_pattern_list) && current_pattern_list.length ? current_pattern_list.join(", ") : "—"}. Conéctalos con dominant_money_belief y main_blocker.
- CREENCIA LIMITANTE principal escrita por el usuario: "${main_limiting_belief_text ?? "—"}". Hónrala como base de dominant_money_belief.
- CREENCIA QUE QUIERE SOLTAR: "${belief_to_release ?? "—"}".
- NUEVA FRASE sobre dinero (su reframe): "${new_money_phrase ?? "—"}". Si encaja, úsala (refinada) como healthy_money_reframe.
- Bloque "Tu historia financiera": de dónde aprendió, frases familiares, primer recuerdo con dinero.
- Bloque "Tus creencias actuales": 10 escalas (algunas son sanas → invertirlas mentalmente para escasez: "merezco abundancia", "puedo aprender", "puedo generar valor", "soy capaz" son SANAS; alto en ellas = MENOS escasez).
- Bloque "Detectando tu patrón": qué patrones repite (gastar para llenar vacío, postergar revisar finanzas, vivir al día, regalar de más, etc.).
- Bloque "Reescribiendo tu historia": frases completadas — material vivo para new_money_beliefs.
- new_money_beliefs: 3 a 5 reframes cortos en primera persona. Formato preferido: "ANTES: … / DESPUÉS: …".
- healthy_money_reframe: UNA frase poderosa, cálida, realista, en primera persona. NO mágica, NO motivacional barata.
- next_financial_action: micro paso muy concreto (revisar 1 cuenta 10 min, escribir 3 gastos, abrir cuenta de ahorro, etc.). NUNCA "haz un presupuesto".
- main_insight debe sentirse: "quizá no estás mal con el dinero, estás operando desde creencias viejas".
- NO uses lenguaje de coach financiero genérico ("mindset millonario", "abundancia infinita", "atrae prosperidad"). NUNCA promesas de riqueza ni consejos de inversión.
- NO diagnostiques ("trauma financiero", "bloqueo de prosperidad"). Usa "aprendiste que…", "tu historia con el dinero…".
- Tono: cálido, honesto, profundo, sin moralizar. Debe sentirse como autoconocimiento financiero emocional, no como un curso de finanzas.` : ""}

Devuelve EXCLUSIVAMENTE un JSON válido con esta forma exacta (sin texto antes o después):
${schemaToUse}`;

    const dualLine = isCapas
      ? `\nAUTENTICIDAD: ${score}/${score_max} → ${level_label}\nDESGASTE: ${score_secondary ?? "—"}/${score_secondary_max ?? "—"} → ${level_secondary_label ?? "—"}`
      : isBrujula
        ? `\nALINEACIÓN: ${score}/${score_max} → ${level_label}\nDESCONEXIÓN: ${score_secondary ?? "—"}/${score_secondary_max ?? "—"} → ${level_secondary_label ?? "—"}`
        : isFuturo
          ? `\nALINEACIÓN FUTURA: ${score}/${score_max} → ${level_label}`
          : isHistorias
            ? `\nAUTOCRÍTICA: ${score}/${score_max} → ${level_label}\nAUTOACEPTACIÓN: ${score_secondary ?? "—"}/${score_secondary_max ?? "—"} → ${level_secondary_label ?? "—"}\nNARRATIVA LIMITANTE: ${limiting_narrative_score ?? "—"}/100 → ${limiting_narrative_level ?? "—"}`
            : isEspejo
              ? `\nAUTOIMAGEN: ${score}/${score_max} → ${level_label}\nAUTENTICIDAD PERCIBIDA: ${score_secondary ?? "—"}/${score_secondary_max ?? "—"} → ${level_secondary_label ?? "—"}\nAUTOEXIGENCIA: ${self_demand_score ?? "—"}/100 → ${self_demand_level ?? "—"}`
              : isDrenando
                ? `\nAGOTAMIENTO: ${score}/${score_max} → ${level_label}\nAUTOCUIDADO: ${score_secondary ?? "—"}/${score_secondary_max ?? "—"} → ${level_secondary_label ?? "—"}\nSATURACIÓN MENTAL: ${mental_saturation_score ?? "—"}/100 → ${mental_saturation_level ?? "—"}`
                : isTermometro
                  ? `\nINTENSIDAD EMOCIONAL: ${score}/${score_max} → ${level_label}\nSATURACIÓN EMOCIONAL: ${emotional_saturation_score ?? "—"}/100 → ${emotional_saturation_level ?? "—"}`
                  : isDetonantes
                    ? `\nREACTIVIDAD EMOCIONAL: ${reactivity_score ?? score}/100 → ${reactivity_level ?? level_label}\nAUTOCONOCIMIENTO EMOCIONAL: ${emotional_awareness_score ?? score_secondary ?? "—"}/100 → ${emotional_awareness_level ?? level_secondary_label ?? "—"}`
                    : isABC
                      ? `\nRIGIDEZ DE PENSAMIENTO: ${thought_rigidity_score ?? score}/100 → ${thought_rigidity_level ?? level_label}\nCAPACIDAD DE REENCUADRE: ${reframe_capacity_score ?? score_secondary ?? "—"}/100 → ${reframe_capacity_level ?? level_secondary_label ?? "—"}\nINTENSIDAD EMOCIONAL: ${abc_intensity_score ?? "—"}/100 → ${abc_intensity_level ?? "—"}`
                      : isProfunda
                        ? `\nCONCIENCIA EMOCIONAL: ${awareness_score ?? score}/100 → ${awareness_level ?? level_label}\nPROFUNDIDAD EMOCIONAL: ${depth_score ?? score_secondary ?? "—"}/100 → ${depth_level ?? level_secondary_label ?? "—"}`
                        : isCalma
                          ? `\nÍNDICE DE CALMA: ${calm_score ?? score}/100 → ${calm_level ?? level_label}\nSATURACIÓN MENTAL: ${calm_saturation_score ?? "—"}/100 → ${calm_saturation_level ?? "—"}\nREGULACIÓN: ${regulation_score ?? "—"}/100 → ${regulation_level_label ?? "—"}\nFATIGA: ${fatigue_score ?? "—"}/100 → ${fatigue_level ?? "—"}`
                          : isKit
                            ? `\nAUTOCONOCIMIENTO REGULATORIO: ${kit_self_awareness_score ?? score}/100 → ${kit_self_awareness_level ?? level_label}\nDEPENDENCIA DE HÁBITOS POCO ÚTILES: ${kit_unhelpful_dependency_score ?? "—"}/100 → ${kit_unhelpful_dependency_level ?? "—"}\nFORTALEZA DE RECURSOS: ${kit_inner_resource_score ?? "—"}/100 → ${kit_inner_resource_level ?? "—"}`
                            : isSilencio
                              ? `\nRUIDO MENTAL: ${mental_noise_score ?? score}/100 → ${mental_noise_level ?? level_label}\nSOBREPENSAMIENTO: ${overthinking_score ?? "—"}/100 → ${overthinking_level ?? "—"}\nSATURACIÓN COGNITIVA: ${cognitive_saturation_score ?? "—"}/100 → ${cognitive_saturation_level ?? "—"}\nCAPACIDAD DE SOLTAR: ${release_capacity_score ?? "—"}/100 → ${release_capacity_level ?? "—"}`
                              : isCuerpo
                                ? `\nTENSIÓN CORPORAL: ${body_tension_score ?? score}/100 → ${body_tension_level ?? level_label}\nCONEXIÓN CORPORAL: ${body_connection_score ?? "—"}/100 → ${body_connection_level ?? "—"}\nFATIGA FÍSICO-EMOCIONAL: ${body_fatigue_score ?? "—"}/100 → ${body_fatigue_level ?? "—"}\nREGULACIÓN CORPORAL: ${body_regulation_score ?? "—"}/100 → ${body_regulation_level ?? "—"}`
                                : isBoundaries
                                  ? `\nLÍMITES SALUDABLES: ${boundaries_health_score ?? score}/100 → ${boundaries_health_level ?? level_label}\nCOMPLACENCIA EMOCIONAL: ${people_pleasing_score ?? "—"}/100 → ${people_pleasing_level ?? "—"}\nCULPA INTERPERSONAL: ${interpersonal_guilt_score ?? "—"}/100 → ${interpersonal_guilt_level ?? "—"}\nDESGASTE RELACIONAL: ${relational_exhaustion_score ?? "—"}/100 → ${relational_exhaustion_level ?? "—"}`
                                  : isBoundaries4
                                    ? `\nCULPA AL AUTOCUIDADO: ${self_choice_guilt_score ?? score}/100 → ${self_choice_guilt_level ?? level_label}\nCOMPLACENCIA EMOCIONAL: ${people_pleasing_score ?? "—"}/100 → ${people_pleasing_level ?? "—"}\nAUTOABANDONO: ${self_abandonment_score ?? "—"}/100 → ${self_abandonment_level ?? "—"}\nCAPACIDAD DE PRIORIZACIÓN: ${prioritization_capacity_score ?? "—"}/100 → ${prioritization_capacity_level ?? "—"}`
                                    : isBoundaries5
                                      ? `\nCLARIDAD COMUNICATIVA: ${communication_clarity_score ?? score}/100 → ${communication_clarity_level ?? level_label}\nEVITACIÓN: ${avoidance_score ?? "—"}/100 → ${avoidance_level ?? "—"}\nSEGURIDAD COMUNICATIVA: ${communicative_safety_score ?? "—"}/100 → ${communicative_safety_level ?? "—"}\nAUTOEXPRESIÓN SALUDABLE: ${healthy_expression_score ?? "—"}/100 → ${healthy_expression_level ?? "—"}`
                                    : isBoundaries6
                                      ? `\nMIEDO RELACIONAL: ${relational_fear_score ?? score}/100 → ${relational_fear_level ?? level_label}\nEVITACIÓN EMOCIONAL: ${emotional_avoidance_score ?? "—"}/100 → ${emotional_avoidance_level ?? "—"}\nSEGURIDAD INTERNA: ${inner_safety_score ?? "—"}/100 → ${inner_safety_level ?? "—"}\nDEPENDENCIA DE APROBACIÓN: ${approval_dependency_score ?? "—"}/100 → ${approval_dependency_level ?? "—"}`
                                    : isFinancial2
                                      ? `\nESCASEZ MENTAL: ${financial_scarcity_score ?? score}/100 → ${financial_scarcity_level ?? level_label}\nMERECIMIENTO FINANCIERO: ${financial_deserving_score ?? "—"}/100 → ${financial_deserving_level ?? "—"}\nSEGURIDAD FINANCIERA: ${financial_security_score ?? "—"}/100 → ${financial_security_level ?? "—"}\nAPERTURA AL CRECIMIENTO: ${growth_openness_score ?? "—"}/100 → ${growth_openness_level ?? "—"}\nANSIEDAD FINANCIERA: ${financial_anxiety_score ?? "—"}/100 → ${financial_anxiety_level ?? "—"}`
                                    : `\nSCORE: ${score}/${score_max}\nNIVEL: ${level_label}`;

    const userPrompt = `EJERCICIO: ${exercise_name}${dualLine}

RESPUESTAS DEL USUARIO:

${formatted}

Analiza con profundidad humana y devuelve el JSON.`;

    const response = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2200,
      response_format: { type: "json_object" },
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return new Response(JSON.stringify({ insights: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
