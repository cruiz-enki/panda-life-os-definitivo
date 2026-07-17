/**
 * Hook de **Introspección** — sesiones, respuestas y resultados de ejercicios.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type {
  IntrospectionAnswer,
  IntrospectionExercise,
  IntrospectionInsights,
  IntrospectionQuestion,
  IntrospectionSession,
} from "@/lib/introspection-types";
import {
  authenticityLevelFromAvg,
  exhaustionLevelFromAvg,
  alignmentLevelFromScore,
  disconnectionLevelFromScore,
  futureAlignmentLevelFromScore,
  levelFromScore,
  selfCriticismLevelFromScore,
  selfAcceptanceLevelFromScore,
  limitingNarrativeLevelFromScore,
  selfImageLevelFromScore,
  perceivedAuthenticityLevelFromScore,
  selfDemandLevelFromScore,
  drainExhaustionLevelFromScore,
  selfCareLevelFromScore,
  mentalSaturationLevelFromScore,
  intensityLevelFromScore,
  emotionalSaturationLevelFromScore,
  reactivityLevelFromScore,
  emotionalAwarenessLevelFromScore,
  thoughtRigidityLevelFromScore,
  reframeCapacityLevelFromScore,
  awarenessLevelFromScore,
  depthLevelFromScore,
  calmLevelFromScore,
  calmSaturationLevelFromScore,
  regulationLevelFromScore,
  fatigueLevelFromScore,
  selfAwarenessRegLevelFromScore,
  unhelpfulDependencyLevelFromScore,
  innerResourceLevelFromScore,
  detectCalmProfile,
  mentalNoiseLevelFromScore,
  overthinkingLevelFromScore,
  cognitiveSaturationLevelFromScore,
  releaseCapacityLevelFromScore,
  bodyTensionLevelFromScore,
  bodyConnectionLevelFromScore,
  bodyFatigueLevelFromScore,
  bodyRegulationLevelFromScore,
  boundariesHealthLevelFromScore,
  peoplePleasingLevelFromScore,
  interpersonalGuiltLevelFromScore,
  relationalExhaustionLevelFromScore,
  toleranceDrainLevelFromScore,
  excessToleranceLevelFromScore,
  selfAbandonmentLevelFromScore,
  boundaryNeedLevelFromScore,
  selfChoiceGuiltLevelFromScore,
  prioritizationCapacityLevelFromScore,
  communicationClarityLevelFromScore,
  avoidanceLevelFromScore,
  communicativeSafetyLevelFromScore,
  healthyExpressionLevelFromScore,
  relationalFearLevelFromScore,
  emotionalAvoidanceLevelFromScore,
  innerSafetyLevelFromScore,
  approvalDependencyLevelFromScore,
  financialScarcityLevelFromScore,
  financialSecurityLevelFromScore,
  financialDeservingLevelFromScore,
  growthOpennessLevelFromScore,
  financialAnxietyLevelFromScore,
} from "@/lib/introspection-types";

export function useIntrospectionExercises() {
  const [exercises, setExercises] = useState<IntrospectionExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from("introspection_exercises")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (!cancel) {
        if (!error && data) setExercises(data as IntrospectionExercise[]);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return { exercises, loading };
}

export function useIntrospectionExercise(exerciseId: string) {
  const { user } = useAuth();
  const [exercise, setExercise] = useState<IntrospectionExercise | null>(null);
  const [questions, setQuestions] = useState<IntrospectionQuestion[]>([]);
  const [session, setSession] = useState<IntrospectionSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, IntrospectionAnswer>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ex }, { data: qs }] = await Promise.all([
      supabase.from("introspection_exercises").select("*").eq("id", exerciseId).maybeSingle(),
      supabase
        .from("introspection_questions")
        .select("*")
        .eq("exercise_id", exerciseId)
        .order("sort_order", { ascending: true }),
    ]);
    setExercise((ex as IntrospectionExercise) ?? null);
    setQuestions((qs as IntrospectionQuestion[]) ?? []);

    const { data: sess } = await supabase
      .from("introspection_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("exercise_id", exerciseId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sess) {
      setSession(sess as IntrospectionSession);
      const { data: ans } = await supabase
        .from("introspection_answers")
        .select("*")
        .eq("session_id", (sess as IntrospectionSession).id);
      const map: Record<string, IntrospectionAnswer> = {};
      (ans as IntrospectionAnswer[] | null)?.forEach((a) => {
        map[a.question_id] = a;
      });
      setAnswers(map);
    } else {
      setSession(null);
      setAnswers({});
    }
    setLoading(false);
  }, [user, exerciseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startSession = useCallback(async (): Promise<IntrospectionSession | null> => {
    if (!user) return null;
    if (session) return session;
    const { data, error } = await supabase
      .from("introspection_sessions")
      .insert({ user_id: user.id, exercise_id: exerciseId, status: "in_progress" })
      .select("*")
      .single();
    if (error || !data) return null;
    setSession(data as IntrospectionSession);
    return data as IntrospectionSession;
  }, [user, session, exerciseId]);

  const saveAnswer = useCallback(
    async (
      questionId: string,
      payload: { value_number?: number | null; value_text?: string | null; value_json?: unknown | null },
    ) => {
      if (!user) return;
      let sess = session;
      if (!sess) sess = await startSession();
      if (!sess) return;
      const existing = answers[questionId];
      const body = {
        value_number: payload.value_number ?? null,
        value_text: payload.value_text ?? null,
        value_json: (payload.value_json ?? null) as never,
      };
      if (existing) {
        const { data } = await supabase
          .from("introspection_answers")
          .update(body)
          .eq("id", existing.id)
          .select("*")
          .single();
        if (data) setAnswers((a) => ({ ...a, [questionId]: data as IntrospectionAnswer }));
      } else {
        const { data } = await supabase
          .from("introspection_answers")
          .insert({
            session_id: sess.id,
            question_id: questionId,
            user_id: user.id,
            ...body,
          })
          .select("*")
          .single();
        if (data) setAnswers((a) => ({ ...a, [questionId]: data as IntrospectionAnswer }));
      }
    },
    [user, session, answers, startSession],
  );

  const completeSession = useCallback(async (): Promise<IntrospectionSession | null> => {
    if (!user || !session || !exercise) return null;

    // ---- Scoring genérico vs dual ----
    const scaleQuestions = questions.filter((q) => q.type === "scale");
    const authScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "authenticity");
    const exhScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "exhaustion");
    const alignScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "alignment");
    const disconScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "disconnection");
    const futureScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "future_alignment");
    const critScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "self_criticism");
    const acceptScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "self_acceptance");
    const selfImageScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "self_image");
    const percAuthScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "perceived_authenticity");
    const drainScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "drain_exhaustion");
    const selfCareScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "self_care");
    const narrativeQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "limiting_narratives");
    const shadowQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "shadow_parts");
    const drainersQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "energy_drainers");
    const intensityQ = scaleQuestions.find((q) => q.meta?.scale_kind === "intensity");
    const emotionsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "emotions");
    const triggersQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "triggers");
    const reactionsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "reactions");
    const needsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "needs");
    const emotionalTriggersQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "emotional_triggers");
    const reactionStylesQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "reaction_styles");
    const awarenessQ = scaleQuestions.find((q) => q.meta?.scale_kind === "emotional_awareness");
    const isAuthExh = authScales.length > 0 && exhScales.length > 0;
    const isAlignDiscon = alignScales.length > 0 && disconScales.length > 0;
    const isEspejo = selfImageScales.length > 0 && percAuthScales.length > 0;
    const isDrain = drainScales.length > 0 && selfCareScales.length > 0;
    const isFuture = futureScales.length > 0 && !isAuthExh && !isAlignDiscon;
    const isCritAccept = critScales.length > 0 && acceptScales.length > 0;
    const isTermometro = intensityQ !== undefined && emotionsQ !== undefined;
    const isDetonantes = emotionalTriggersQ !== undefined && reactionStylesQ !== undefined && awarenessQ !== undefined;
    const isABC = exercise.id === "emotional_mastery_003";
    const isProfunda = exercise.id === "emotional_mastery_004";
    const isCalma = exercise.id === "find_calm_001";
    const isKit = exercise.id === "find_calm_002";
    const isSilencio = exercise.id === "find_calm_003";
    const isCuerpo = exercise.id === "find_calm_004";
    const isBoundaries = exercise.id === "inner_boundaries_001";
    const isBoundaries2 = exercise.id === "inner_boundaries_002";
    const isBoundaries4 = exercise.id === "inner_boundaries_004";
    const isBoundaries5 = exercise.id === "inner_boundaries_005";
    const isBoundaries6 = exercise.id === "inner_boundaries_006";
    const isFinancial2 = exercise.id === "financial_intelligence_002";
    const isDual = isAuthExh || isAlignDiscon || isCritAccept || isEspejo || isDrain || isDetonantes || isABC || isProfunda || isCalma || isKit || isSilencio || isCuerpo || isBoundaries || isBoundaries2 || isBoundaries4 || isBoundaries5 || isBoundaries6 || isFinancial2;


    let scoreSum = 0;
    let scoreMax = 0;
    let levelLabel: string;
    let scoreSecondary: number | null = null;
    let scoreSecondaryMax: number | null = null;
    let levelSecondaryLabel: string | null = null;
    let limitingNarrativeScore: number | null = null;
    let limitingNarrativeLevel: string | null = null;
    let selfDemandScore: number | null = null;
    let selfDemandLevel: string | null = null;
    let mentalSaturationScore: number | null = null;
    let mentalSaturationLevel: string | null = null;
    let emotionalSaturationScore: number | null = null;
    let emotionalSaturationLevel: string | null = null;
    let emotionalSaturationEmoji: string | null = null;
    let reactivityScore: number | null = null;
    let reactivityLevel: string | null = null;
    let emotionalAwarenessScore: number | null = null;
    let emotionalAwarenessLevel: string | null = null;
    let thoughtRigidityScore: number | null = null;
    let thoughtRigidityLevel: string | null = null;
    let reframeCapacityScore: number | null = null;
    let reframeCapacityLevel: string | null = null;
    let abcIntensityScore: number | null = null;
    let abcIntensityLevel: string | null = null;
    let awarenessScore: number | null = null;
    let awarenessLevel: string | null = null;
    let depthScore: number | null = null;
    let depthLevel: string | null = null;
    let calmScore: number | null = null;
    let calmLevel: string | null = null;
    let calmSaturationScore: number | null = null;
    let calmSaturationLevel: string | null = null;
    let regulationScore: number | null = null;
    let regulationLabel: string | null = null;
    let fatigueScore: number | null = null;
    let fatigueLabel: string | null = null;
    let kitSelfAwarenessScore: number | null = null;
    let kitSelfAwarenessLevel: string | null = null;
    let kitUnhelpfulScore: number | null = null;
    let kitUnhelpfulLevel: string | null = null;
    let kitInnerResourceScore: number | null = null;
    let kitInnerResourceLevel: string | null = null;
    let kitCalmProfile: ReturnType<typeof detectCalmProfile> | null = null;
    let kitTopTools: string[] = [];
    let kitUnhelpfulList: string[] = [];
    let mentalNoiseScore: number | null = null;
    let mentalNoiseLevel: string | null = null;
    let overthinkingScore: number | null = null;
    let overthinkingLevel: string | null = null;
    let cognitiveSaturationScore: number | null = null;
    let cognitiveSaturationLevel: string | null = null;
    let releaseCapacityScore: number | null = null;
    let releaseCapacityLevel: string | null = null;
    let silencioMentalLoads: string[] = [];
    let bodyTensionScore: number | null = null;
    let bodyTensionLevel: string | null = null;
    let bodyConnectionScore: number | null = null;
    let bodyConnectionLevel: string | null = null;
    let bodyFatigueScore: number | null = null;
    let bodyFatigueLevel: string | null = null;
    let bodyRegulationScore: number | null = null;
    let bodyRegulationLevel: string | null = null;
    let bodyTensionZones: string[] = [];
    let bodyNeedList: string[] = [];
    let bodyEmotionList: string[] = [];
    let boundariesHealthScore: number | null = null;
    let boundariesHealthLevel: string | null = null;
    let peoplePleasingScore: number | null = null;
    let peoplePleasingLevel: string | null = null;
    let interpersonalGuiltScore: number | null = null;
    let interpersonalGuiltLevel: string | null = null;
    let relationalExhaustionScore: number | null = null;
    let relationalExhaustionLevel: string | null = null;
    let boundaryAreasList: string[] = [];
    let boundaryReactionsList: string[] = [];
    let boundaryFearsList: string[] = [];
    let boundarySmallLimitList: string[] = [];
    let boundaryHelpfulPhraseList: string[] = [];
    let toleranceDrainScore: number | null = null;
    let toleranceDrainLevel: string | null = null;
    let excessToleranceScore: number | null = null;
    let excessToleranceLevel: string | null = null;
    let selfAbandonmentScore: number | null = null;
    let selfAbandonmentLevel: string | null = null;
    let boundaryNeedScore: number | null = null;
    let boundaryNeedLevel: string | null = null;
    let normalizedThings: string[] = [];
    let toleranceReactions: string[] = [];
    let toleranceFears: string[] = [];
    let selfChoiceGuiltScore: number | null = null;
    let selfChoiceGuiltLevel: string | null = null;
    let prioritizationCapacityScore: number | null = null;
    let prioritizationCapacityLevel: string | null = null;
    let guiltMomentsList: string[] = [];
    let pleasingReactionsList: string[] = [];
    let disappointmentEmotionsList: string[] = [];
    let communicationClarityScore: number | null = null;
    let communicationClarityLevel: string | null = null;
    let avoidanceScore: number | null = null;
    let avoidanceLevel: string | null = null;
    let communicativeSafetyScore: number | null = null;
    let communicativeSafetyLevel: string | null = null;
    let healthyExpressionScore: number | null = null;
    let healthyExpressionLevel: string | null = null;
    let difficultScenariosList: string[] = [];
    let speechReactionsList: string[] = [];
    let speechFearsList: string[] = [];
    let desiredTone: string | null = null;
    let relationalFearScore: number | null = null;
    let relationalFearLevel: string | null = null;
    let emotionalAvoidanceScore: number | null = null;
    let emotionalAvoidanceLevel: string | null = null;
    let innerSafetyScore: number | null = null;
    let innerSafetyLevel: string | null = null;
    let approvalDependencyScoreVal: number | null = null;
    let approvalDependencyLevel: string | null = null;
    let imaginedFearsList: string[] = [];
    let worstScenarioText = "";
    let avoidedConversationText = "";
    let phraseToRememberText = "";
    let financialScarcityScore: number | null = null;
    let financialScarcityLevel: string | null = null;
    let financialSecurityScore: number | null = null;
    let financialSecurityLevel: string | null = null;
    let financialDeservingScore: number | null = null;
    let financialDeservingLevel: string | null = null;
    let growthOpennessScore: number | null = null;
    let growthOpennessLevel: string | null = null;
    let financialAnxietyScore: number | null = null;
    let financialAnxietyLevel: string | null = null;
    let inheritedPhrasesList: string[] = [];
    let currentPatternList: string[] = [];
    let mainLimitingBeliefText = "";
    let beliefToReleaseText = "";
    let newMoneyPhraseText = "";

    const avg = (qs: IntrospectionQuestion[]) => {
      const vals = qs.map((q) => answers[q.id]?.value_number).filter((v): v is number => typeof v === "number");
      if (vals.length === 0) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    /** Promedio respetando preguntas invertidas (meta.reversed). */
    const avgWithReverse = (qs: IntrospectionQuestion[]) => {
      const vals = qs
        .map((q) => {
          const raw = answers[q.id]?.value_number;
          if (typeof raw !== "number") return null;
          return q.meta?.reversed ? 6 - raw : raw;
        })
        .filter((v): v is number => typeof v === "number");
      if (vals.length === 0) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    if (isAuthExh) {
      const authAvg = avg(authScales);
      const exhAvg = avg(exhScales);
      scoreSum = Math.round(authAvg * 20);
      scoreMax = 100;
      levelLabel = authenticityLevelFromAvg(authAvg);
      scoreSecondary = Math.round(exhAvg * 20);
      scoreSecondaryMax = 100;
      levelSecondaryLabel = exhaustionLevelFromAvg(exhAvg);
    } else if (isAlignDiscon) {
      const alignAvg = avg(alignScales);
      const disconAvg = avg(disconScales);
      scoreSum = Math.round(alignAvg * 20);
      scoreMax = 100;
      levelLabel = alignmentLevelFromScore(scoreSum);
      scoreSecondary = Math.round(disconAvg * 20);
      scoreSecondaryMax = 100;
      levelSecondaryLabel = disconnectionLevelFromScore(scoreSecondary);
    } else if (isCritAccept) {
      const critAvg = avg(critScales);
      const acceptAvg = avg(acceptScales);
      scoreSum = Math.round(critAvg * 20);
      scoreMax = 100;
      levelLabel = selfCriticismLevelFromScore(scoreSum);
      scoreSecondary = Math.round(acceptAvg * 20);
      scoreSecondaryMax = 100;
      levelSecondaryLabel = selfAcceptanceLevelFromScore(scoreSecondary);
    } else if (isEspejo) {
      const selfImgAvg = avg(selfImageScales);
      const percAvg = avgWithReverse(percAuthScales);
      scoreSum = Math.round(selfImgAvg * 20);
      scoreMax = 100;
      levelLabel = selfImageLevelFromScore(scoreSum);
      scoreSecondary = Math.round(percAvg * 20);
      scoreSecondaryMax = 100;
      levelSecondaryLabel = perceivedAuthenticityLevelFromScore(scoreSecondary);
    } else if (isDrain) {
      const drainAvg = avgWithReverse(drainScales);
      const careAvg = avg(selfCareScales);
      scoreSum = Math.round(drainAvg * 20);
      scoreMax = 100;
      levelLabel = drainExhaustionLevelFromScore(scoreSum);
      scoreSecondary = Math.round(careAvg * 20);
      scoreSecondaryMax = 100;
      levelSecondaryLabel = selfCareLevelFromScore(scoreSecondary);
    } else if (isFuture) {
      const futAvg = avgWithReverse(futureScales);
      scoreSum = Math.round(futAvg * 20);
      scoreMax = 100;
      levelLabel = futureAlignmentLevelFromScore(scoreSum);
    } else if (isABC) {
      // Rigidez: belief en pensamiento (scale 1-5)
      const rigidityQ = scaleQuestions.find((q) => q.meta?.scale_kind === "thought_rigidity");
      const intensityAbcQ = scaleQuestions.find((q) => q.meta?.scale_kind === "emotion_intensity_abc");
      const belief = rigidityQ ? answers[rigidityQ.id]?.value_number ?? 0 : 0;
      thoughtRigidityScore = Math.round((belief / 5) * 100);
      thoughtRigidityLevel = thoughtRigidityLevelFromScore(thoughtRigidityScore);
      // Intensidad emocional (informativa)
      const intensity = intensityAbcQ ? answers[intensityAbcQ.id]?.value_number ?? 0 : 0;
      abcIntensityScore = Math.round((intensity / 5) * 100);
      abcIntensityLevel = intensityLevelFromScore(abcIntensityScore);
      // Capacidad de reencuadre: densidad y longitud de respuestas del bloque reframe
      const reframeQs = questions.filter((q) => q.block_key === "reframe" && q.type === "open");
      const reframeAnswers = reframeQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const filledCount = reframeAnswers.filter((t) => t.length > 0).length;
      const avgLen = reframeAnswers.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, reframeQs.length);
      const completeness = reframeQs.length > 0 ? (filledCount / reframeQs.length) * 60 : 0;
      const depth = (avgLen / 120) * 40;
      reframeCapacityScore = Math.min(100, Math.round(completeness + depth));
      reframeCapacityLevel = reframeCapacityLevelFromScore(reframeCapacityScore);
      scoreSum = thoughtRigidityScore;
      scoreMax = 100;
      levelLabel = thoughtRigidityLevel;
      scoreSecondary = reframeCapacityScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = reframeCapacityLevel;
    } else if (isProfunda) {
      // Conciencia emocional: densidad + profundidad de respuestas en bloques "deep" y "validation"
      const deepQs = questions.filter((q) => (q.block_key === "deep" || q.block_key === "validation") && q.type === "open");
      const deepTexts = deepQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const filled = deepTexts.filter((t) => t.length > 0).length;
      const avgLenDeep = deepTexts.reduce((acc, t) => acc + Math.min(140, t.length), 0) / Math.max(1, deepQs.length);
      const completeness = deepQs.length > 0 ? (filled / deepQs.length) * 60 : 0;
      const depthPart = (avgLenDeep / 140) * 40;
      awarenessScore = Math.min(100, Math.round(completeness + depthPart));
      awarenessLevel = awarenessLevelFromScore(awarenessScore);

      // Profundidad emocional: combinación de conexiones del mapa + at_risk + intensidad
      const atRiskQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "below_at_risk");
      const connectionsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "below_connections");
      const intensityQ2 = scaleQuestions.find((q) => q.meta?.scale_kind === "below_intensity");
      const atRiskSel = Array.isArray(answers[atRiskQ?.id ?? ""]?.value_json)
        ? (answers[atRiskQ!.id]?.value_json as string[]).length : 0;
      const connSel = Array.isArray(answers[connectionsQ?.id ?? ""]?.value_json)
        ? (answers[connectionsQ!.id]?.value_json as string[]).length : 0;
      const intensityVal = intensityQ2 ? answers[intensityQ2.id]?.value_number ?? 0 : 0;
      const atRiskMax = atRiskQ?.options?.choices?.length ?? 10;
      const connMax = connectionsQ?.options?.choices?.length ?? 16;
      const connPart = (connSel / connMax) * 45;
      const riskPart = (atRiskSel / atRiskMax) * 35;
      const intensityPart = (intensityVal / 5) * 20;
      depthScore = Math.min(100, Math.round(connPart + riskPart + intensityPart));
      depthLevel = depthLevelFromScore(depthScore);

      scoreSum = awarenessScore;
      scoreMax = 100;
      levelLabel = awarenessLevel;
      scoreSecondary = depthScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = depthLevel;
    } else if (isTermometro && intensityQ) {
      const intensity = answers[intensityQ.id]?.value_number ?? 0;
      scoreSum = Math.round(intensity * 20);
      scoreMax = 100;
      levelLabel = intensityLevelFromScore(scoreSum);
    } else if (isDetonantes && emotionalTriggersQ && reactionStylesQ && awarenessQ) {
      // Reactividad: combina densidad de detonantes + estilos reactivos (con peso a reactivos evitativos)
      const triggersSel = Array.isArray(answers[emotionalTriggersQ.id]?.value_json)
        ? (answers[emotionalTriggersQ.id]?.value_json as string[])
        : [];
      const reactionsSel = Array.isArray(answers[reactionStylesQ.id]?.value_json)
        ? (answers[reactionStylesQ.id]?.value_json as string[])
        : [];
      const avoidant = new Set([
        "Me cierro","Exploto","Sobrepienso","Me distraigo","Me aíslo","Me culpo",
        "Busco aprobación","Finjo que no pasa nada","Trabajo demasiado","Evito el conflicto","Me desconecto emocionalmente",
      ]);
      const totalTriggers = emotionalTriggersQ.options?.choices?.length ?? 21;
      const totalReactions = reactionStylesQ.options?.choices?.length ?? 14;
      const avoidantCount = reactionsSel.filter((r) => avoidant.has(r)).length;
      const triggerPart = (triggersSel.length / totalTriggers) * 60;
      const reactionPart = (avoidantCount / totalReactions) * 40;
      reactivityScore = Math.min(100, Math.round(triggerPart + reactionPart));
      reactivityLevel = reactivityLevelFromScore(reactivityScore);
      const awareness = answers[awarenessQ.id]?.value_number ?? 0;
      emotionalAwarenessScore = Math.round((awareness / 5) * 100);
      emotionalAwarenessLevel = emotionalAwarenessLevelFromScore(emotionalAwarenessScore);
      scoreSum = reactivityScore;
      scoreMax = 100;
      levelLabel = reactivityLevel;
      scoreSecondary = emotionalAwarenessScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = emotionalAwarenessLevel;
    } else if (isCalma) {
      // Índice de calma: avg con reverse de las 6 escalas calm_index
      const calmScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "calm_index");
      const calmAvg = avgWithReverse(calmScales);
      calmScore = Math.round(calmAvg * 20);
      calmLevel = calmLevelFromScore(calmScore);

      // Saturación mental: slider calm_mental_saturation 1-5 → 0-100
      const satQ = scaleQuestions.find((q) => q.meta?.scale_kind === "calm_mental_saturation");
      const satVal = satQ ? answers[satQ.id]?.value_number ?? 0 : 0;
      calmSaturationScore = Math.round((satVal / 5) * 100);
      calmSaturationLevel = calmSaturationLevelFromScore(calmSaturationScore);

      // Regulación emocional: combina calma + post-respiración
      const postQ = scaleQuestions.find((q) => q.meta?.scale_kind === "calm_post_breath");
      const postVal = postQ ? answers[postQ.id]?.value_number ?? 0 : 0;
      const regAvg = (calmAvg + postVal) / 2;
      regulationScore = Math.round((regAvg / 5) * 100);
      regulationLabel = regulationLevelFromScore(regulationScore);

      // Fatiga emocional: energía baja + cantidad de sensaciones corporales drenantes + tensión
      const energyQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "calm_energy_state");
      const bodyQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_sensations");
      const tensionQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_tension");
      const energySel = Array.isArray(answers[energyQ?.id ?? ""]?.value_json)
        ? (answers[energyQ!.id]?.value_json as string[])[0] ?? "" : "";
      const energyMap: Record<string, number> = {
        "🔥 Muy alta": 0, "🙂 Bien": 20, "😐 Neutral": 45, "🥱 Cansada": 75, "😵 Muy agotada": 100,
      };
      const energyPart = (energyMap[energySel] ?? 50) * 0.5;
      const draining = new Set(["Tenso","Agotado","Inquieto","Sin energía","Sobrecargado","Dolor corporal","Pesadez mental","Respiración acelerada"]);
      const bodySel = Array.isArray(answers[bodyQ?.id ?? ""]?.value_json) ? (answers[bodyQ!.id]?.value_json as string[]) : [];
      const drainCount = bodySel.filter((b) => draining.has(b)).length;
      const bodyPart = Math.min(30, drainCount * 8);
      const tensionSel = Array.isArray(answers[tensionQ?.id ?? ""]?.value_json) ? (answers[tensionQ!.id]?.value_json as string[]).length : 0;
      const tensionPart = Math.min(20, tensionSel * 7);
      fatigueScore = Math.min(100, Math.round(energyPart + bodyPart + tensionPart));
      fatigueLabel = fatigueLevelFromScore(fatigueScore);

      scoreSum = calmScore;
      scoreMax = 100;
      levelLabel = calmLevel;
      scoreSecondary = calmSaturationScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = calmSaturationLevel;
    } else if (isKit) {
      // Top 5 herramientas regulatorias reales
      const topQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "calm_top_regulators");
      const allRegQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "calm_regulators");
      const unhelpQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "calm_unhelpful");
      const unhelpOpenQ = questions.find((q) => q.type === "open" && q.meta?.kind === "calm_unhelpful_open");
      const profileQs = questions.filter((q) => q.type === "multi" && q.meta?.kind === "calm_profile_pick");
      const refugeQs = questions.filter((q) => q.type === "open" && q.block_key === "refuge");
      const protocolQs = questions.filter((q) => q.type === "open" && q.block_key === "protocol");

      kitTopTools = Array.isArray(answers[topQ?.id ?? ""]?.value_json)
        ? (answers[topQ!.id]?.value_json as string[])
        : [];
      const allReg = Array.isArray(answers[allRegQ?.id ?? ""]?.value_json)
        ? (answers[allRegQ!.id]?.value_json as string[])
        : [];
      kitUnhelpfulList = Array.isArray(answers[unhelpQ?.id ?? ""]?.value_json)
        ? (answers[unhelpQ!.id]?.value_json as string[])
        : [];
      const unhelpOpenLen = (answers[unhelpOpenQ?.id ?? ""]?.value_text ?? "").trim().length;
      const profileFilled = profileQs.filter((q) => {
        const v = answers[q.id]?.value_json;
        return Array.isArray(v) && (v as string[]).length > 0;
      }).length;

      // Perfil de calma dominante (a partir del top 5 + perfil emocional)
      const profilePicks = profileQs
        .map((q) => (answers[q.id]?.value_json as string[] | undefined)?.[0])
        .filter((v): v is string => typeof v === "string");
      kitCalmProfile = detectCalmProfile([...kitTopTools, ...profilePicks]);

      // 1) Autoconocimiento regulatorio: densidad/longitud de refugio + protocolo
      const openTexts = [...refugeQs, ...protocolQs].map((q) => (answers[q.id]?.value_text ?? "").trim());
      const openTotal = refugeQs.length + protocolQs.length;
      const openFilled = openTexts.filter((t) => t.length > 0).length;
      const avgLenOpen = openTexts.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, openTotal);
      const awComplete = openTotal > 0 ? (openFilled / openTotal) * 55 : 0;
      const awDepth = (avgLenOpen / 120) * 30;
      const awProfile = (profileFilled / Math.max(1, profileQs.length)) * 15;
      kitSelfAwarenessScore = Math.min(100, Math.round(awComplete + awDepth + awProfile));
      kitSelfAwarenessLevel = selfAwarenessRegLevelFromScore(kitSelfAwarenessScore);

      // 2) Dependencia de mecanismos poco útiles
      const unhelpTotal = unhelpQ?.options?.choices?.length ?? 14;
      const unhelpDensity = (kitUnhelpfulList.length / unhelpTotal) * 75;
      const unhelpOpenPart = unhelpOpenLen > 0 ? 25 : 0;
      kitUnhelpfulScore = Math.min(100, Math.round(unhelpDensity + unhelpOpenPart));
      kitUnhelpfulLevel = unhelpfulDependencyLevelFromScore(kitUnhelpfulScore);

      // 3) Fortaleza de recursos internos
      const topPart = (Math.min(5, kitTopTools.length) / 5) * 45;
      const breadthPart = (Math.min(10, allReg.length) / 10) * 25;
      const profilePart = (profileFilled / Math.max(1, profileQs.length)) * 30;
      kitInnerResourceScore = Math.min(100, Math.round(topPart + breadthPart + profilePart));
      kitInnerResourceLevel = innerResourceLevelFromScore(kitInnerResourceScore);

      scoreSum = kitSelfAwarenessScore;
      scoreMax = 100;
      levelLabel = kitSelfAwarenessLevel;
      scoreSecondary = kitUnhelpfulScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = kitUnhelpfulLevel;
    } else if (isSilencio) {
      // Ruido mental: avg con reverse de escalas calm_mind_noise
      const noiseScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "calm_mind_noise");
      const noiseAvg = avgWithReverse(noiseScales);
      mentalNoiseScore = Math.round(((noiseAvg - 1) / 4) * 100);
      if (mentalNoiseScore < 0) mentalNoiseScore = 0;
      mentalNoiseLevel = mentalNoiseLevelFromScore(mentalNoiseScore);

      // Sobrepensamiento: avg de escalas calm_overthink
      const overScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "calm_overthink");
      const overAvg = avg(overScales);
      overthinkingScore = Math.round(((overAvg - 1) / 4) * 100);
      if (overthinkingScore < 0) overthinkingScore = 0;
      overthinkingLevel = overthinkingLevelFromScore(overthinkingScore);

      // Saturación cognitiva: densidad de cargas + longitud del brain dump
      const loadsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "mental_loads");
      const dumpQ = questions.find((q) => q.type === "open" && q.meta?.kind === "brain_dump");
      silencioMentalLoads = Array.isArray(answers[loadsQ?.id ?? ""]?.value_json)
        ? (answers[loadsQ!.id]?.value_json as string[])
        : [];
      const loadsTotal = loadsQ?.options?.choices?.length ?? 20;
      const loadDensity = (silencioMentalLoads.length / loadsTotal) * 50;
      const dumpLen = (answers[dumpQ?.id ?? ""]?.value_text ?? "").trim().length;
      const dumpPart = Math.min(50, (dumpLen / 600) * 50);
      cognitiveSaturationScore = Math.min(100, Math.round(loadDensity + dumpPart));
      cognitiveSaturationLevel = cognitiveSaturationLevelFromScore(cognitiveSaturationScore);

      // Capacidad de soltar: post-breath + densidad/longitud de reframe + filtro de incertidumbre
      const postQ = scaleQuestions.find((q) => q.meta?.scale_kind === "calm_post_breath");
      const postVal = postQ ? answers[postQ.id]?.value_number ?? 0 : 0;
      const reframeQs = questions.filter((q) => q.block_key === "reframe" && q.type === "open");
      const reframeTexts = reframeQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const reframeFilled = reframeTexts.filter((t) => t.length > 0).length;
      const avgReframeLen = reframeTexts.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, reframeQs.length);
      const postPart = (postVal / 5) * 45;
      const reframePart = reframeQs.length > 0 ? (reframeFilled / reframeQs.length) * 30 : 0;
      const depthPart = (avgReframeLen / 120) * 25;
      releaseCapacityScore = Math.min(100, Math.round(postPart + reframePart + depthPart));
      releaseCapacityLevel = releaseCapacityLevelFromScore(releaseCapacityScore);

      scoreSum = mentalNoiseScore;
      scoreMax = 100;
      levelLabel = mentalNoiseLevel;
      scoreSecondary = overthinkingScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = overthinkingLevel;
    } else if (isCuerpo) {
      const zonesQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_zones");
      const sensQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_sensation_type");
      const feelQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_feeling");
      const connQ = scaleQuestions.find((q) => q.meta?.scale_kind === "body_connection");
      const postQ = scaleQuestions.find((q) => q.meta?.scale_kind === "body_post_breath");
      const emoQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_emotion");
      const needQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "body_need");
      const commitmentQs = questions.filter((q) => q.block_key === "body_commitment" && q.type === "open");

      const zones = Array.isArray(answers[zonesQ?.id ?? ""]?.value_json) ? (answers[zonesQ!.id]?.value_json as string[]) : [];
      const sens = Array.isArray(answers[sensQ?.id ?? ""]?.value_json) ? (answers[sensQ!.id]?.value_json as string[]) : [];
      const feel = Array.isArray(answers[feelQ?.id ?? ""]?.value_json) ? (answers[feelQ!.id]?.value_json as string[])[0] ?? "" : "";
      const conn = connQ ? answers[connQ.id]?.value_number ?? 0 : 0;
      const post = postQ ? answers[postQ.id]?.value_number ?? 0 : 0;
      const emo = Array.isArray(answers[emoQ?.id ?? ""]?.value_json) ? (answers[emoQ!.id]?.value_json as string[]) : [];
      const need = Array.isArray(answers[needQ?.id ?? ""]?.value_json) ? (answers[needQ!.id]?.value_json as string[]) : [];

      bodyTensionZones = zones.filter((z) => z !== "No estoy seguro");
      bodyNeedList = need;
      bodyEmotionList = emo;

      // 1) Tensión corporal
      const zonesTotal = (zonesQ?.options?.choices?.length ?? 12) - 2; // sin "Todo el cuerpo" y "No estoy seguro" como neutros
      const sensTotal = sensQ?.options?.choices?.length ?? 9;
      const allBodySel = zones.includes("Todo el cuerpo") ? 15 : 0;
      const zonePart = Math.min(60, (bodyTensionZones.length / Math.max(1, zonesTotal)) * 60 + allBodySel * 0.3);
      const sensPart = (sens.length / Math.max(1, sensTotal)) * 40;
      bodyTensionScore = Math.min(100, Math.round(zonePart + sensPart));
      bodyTensionLevel = bodyTensionLevelFromScore(bodyTensionScore);

      // 2) Conexión corporal
      bodyConnectionScore = Math.round(((conn - 1) / 4) * 100);
      if (bodyConnectionScore < 0) bodyConnectionScore = 0;
      bodyConnectionLevel = bodyConnectionLevelFromScore(bodyConnectionScore);

      // 3) Fatiga física-emocional
      const feelMap: Record<string, number> = {
        "✨ Ligero": 0, "🙂 Bien": 15, "😐 Neutral": 35,
        "🥱 Cansado": 70, "😣 Tenso": 65, "😵 Agotado": 100,
        "⚡ Inquieto": 55, "🫥 Desconectado": 60,
      };
      const drainingEmotions = new Set(["Estrés","Ansiedad","Tristeza","Enojo","Agotamiento","Soledad","Presión","Frustración","Miedo"]);
      const feelPart = (feelMap[feel] ?? 40) * 0.5;
      const emoPart = Math.min(30, emo.filter((e) => drainingEmotions.has(e)).length * 10);
      const restNeeds = new Set(["Dormir","Descansar","Pausa mental","Soltar tensión","Silencio","Tiempo solo"]);
      const needPart = Math.min(20, need.filter((n) => restNeeds.has(n)).length * 7);
      bodyFatigueScore = Math.min(100, Math.round(feelPart + emoPart + needPart));
      bodyFatigueLevel = bodyFatigueLevelFromScore(bodyFatigueScore);

      // 4) Regulación corporal
      const commitTexts = commitmentQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const commitFilled = commitTexts.filter((t) => t.length > 0).length;
      const avgLenCommit = commitTexts.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, commitmentQs.length);
      const postPart = (post / 5) * 50;
      const commitPart = commitmentQs.length > 0 ? (commitFilled / commitmentQs.length) * 30 : 0;
      const commitDepth = (avgLenCommit / 120) * 20;
      bodyRegulationScore = Math.min(100, Math.round(postPart + commitPart + commitDepth));
      bodyRegulationLevel = bodyRegulationLevelFromScore(bodyRegulationScore);

      scoreSum = bodyTensionScore;
      scoreMax = 100;
      levelLabel = bodyTensionLevel;
      scoreSecondary = bodyConnectionScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = bodyConnectionLevel;
    } else if (isBoundaries) {
      const boundaryScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "boundaries");
      // Health: avg with reverse → higher = healthier
      const healthAvg = avgWithReverse(boundaryScales);
      boundariesHealthScore = Math.round(((healthAvg - 1) / 4) * 100);
      if (boundariesHealthScore < 0) boundariesHealthScore = 0;
      boundariesHealthLevel = boundariesHealthLevelFromScore(boundariesHealthScore);

      // People pleasing: from forward (non-reversed-meta) items 1-6
      const pleaseQs = boundaryScales.filter((q) => q.meta?.reversed === true);
      const pleaseAvg = avg(pleaseQs);
      peoplePleasingScore = Math.round(((pleaseAvg - 1) / 4) * 100);
      if (peoplePleasingScore < 0) peoplePleasingScore = 0;
      peoplePleasingLevel = peoplePleasingLevelFromScore(peoplePleasingScore);

      // Interpersonal guilt: items 2,3,5 (q2,q3,q5 ids)
      const guiltIds = new Set(["ib1_b1_q2", "ib1_b1_q3", "ib1_b1_q5"]);
      const guiltQs = boundaryScales.filter((q) => guiltIds.has(q.id));
      const guiltAvg = avg(guiltQs);
      interpersonalGuiltScore = Math.round(((guiltAvg - 1) / 4) * 100);
      if (interpersonalGuiltScore < 0) interpersonalGuiltScore = 0;
      interpersonalGuiltLevel = interpersonalGuiltLevelFromScore(interpersonalGuiltScore);

      // Relational exhaustion: density of avoidant reactions + fears + cost open-text length
      const areasQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "boundary_areas");
      const reactionsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "boundary_reactions");
      const fearsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "boundary_fears");
      const smallLimitQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "small_limit");
      const helpfulQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "helpful_phrase");

      boundaryAreasList = Array.isArray(answers[areasQ?.id ?? ""]?.value_json) ? (answers[areasQ!.id]?.value_json as string[]) : [];
      boundaryReactionsList = Array.isArray(answers[reactionsQ?.id ?? ""]?.value_json) ? (answers[reactionsQ!.id]?.value_json as string[]) : [];
      boundaryFearsList = Array.isArray(answers[fearsQ?.id ?? ""]?.value_json) ? (answers[fearsQ!.id]?.value_json as string[]) : [];
      boundarySmallLimitList = Array.isArray(answers[smallLimitQ?.id ?? ""]?.value_json) ? (answers[smallLimitQ!.id]?.value_json as string[]) : [];
      boundaryHelpfulPhraseList = Array.isArray(answers[helpfulQ?.id ?? ""]?.value_json) ? (answers[helpfulQ!.id]?.value_json as string[]) : [];

      const avoidantReactions = new Set(["Me callo", "Evito conflicto", "Aguanto", "Me adapto", "Exploto después", "Me siento culpable", "Me justifico demasiado", "Me enojo conmigo"]);
      const avoidantCount = boundaryReactionsList.filter((r) => avoidantReactions.has(r)).length;
      const reactionsTotal = reactionsQ?.options?.choices?.length ?? 10;
      const fearsTotal = fearsQ?.options?.choices?.length ?? 10;
      const areasTotal = areasQ?.options?.choices?.length ?? 11;
      const costQs = questions.filter((q) => q.block_key === "cost" && q.type === "open");
      const costTexts = costQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const costFilledLen = costTexts.reduce((acc, t) => acc + Math.min(150, t.length), 0);
      const avgCostLen = costFilledLen / Math.max(1, costQs.length);

      const reactionPart = (avoidantCount / reactionsTotal) * 45;
      const fearPart = (boundaryFearsList.length / fearsTotal) * 30;
      const areasPart = (boundaryAreasList.length / areasTotal) * 10;
      const costPart = (avgCostLen / 150) * 15;
      relationalExhaustionScore = Math.min(100, Math.round(reactionPart + fearPart + areasPart + costPart));
      relationalExhaustionLevel = relationalExhaustionLevelFromScore(relationalExhaustionScore);

      scoreSum = boundariesHealthScore;
      scoreMax = 100;
      levelLabel = boundariesHealthLevel;
      scoreSecondary = peoplePleasingScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = peoplePleasingLevel;
    } else if (isBoundaries2) {
      const drainScales2 = scaleQuestions.filter((q) => q.meta?.scale_kind === "tolerance_drain");
      const drainAvg = avgWithReverse(drainScales2);
      toleranceDrainScore = Math.round(((drainAvg - 1) / 4) * 100);
      if (toleranceDrainScore < 0) toleranceDrainScore = 0;
      toleranceDrainLevel = toleranceDrainLevelFromScore(toleranceDrainScore);

      const normQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "normalized_things");
      const reactQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "tolerance_reactions");
      const fearsQ2 = questions.find((q) => q.type === "multi" && q.meta?.kind === "tolerance_fears");
      normalizedThings = Array.isArray(answers[normQ?.id ?? ""]?.value_json) ? (answers[normQ!.id]?.value_json as string[]) : [];
      toleranceReactions = Array.isArray(answers[reactQ?.id ?? ""]?.value_json) ? (answers[reactQ!.id]?.value_json as string[]) : [];
      toleranceFears = Array.isArray(answers[fearsQ2?.id ?? ""]?.value_json) ? (answers[fearsQ2!.id]?.value_json as string[]) : [];

      const normTotal = normQ?.options?.choices?.length ?? 19;
      excessToleranceScore = Math.round((normalizedThings.length / Math.max(1, normTotal)) * 100);
      excessToleranceLevel = excessToleranceLevelFromScore(excessToleranceScore);

      // Autoabandono emocional: reacciones evitativas + miedos + frase abierta
      const avoidant2 = new Set(["Me callo", "Aguanto", "Me adapto", "Sobreexplico", "Minimizo", "Me culpo", "Espero que cambie solo", "Me resigno"]);
      const avoidantCount2 = toleranceReactions.filter((r) => avoidant2.has(r)).length;
      const reactTotal = reactQ?.options?.choices?.length ?? 11;
      const fearsTotal2 = fearsQ2?.options?.choices?.length ?? 10;
      const costQs2 = questions.filter((q) => q.block_key === "cost2" && q.type === "open");
      const costTexts2 = costQs2.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const avgCostLen2 = costTexts2.reduce((acc, t) => acc + Math.min(150, t.length), 0) / Math.max(1, costQs2.length);
      const reactPart2 = (avoidantCount2 / reactTotal) * 50;
      const fearPart2 = (toleranceFears.length / fearsTotal2) * 25;
      const costPart2 = (avgCostLen2 / 150) * 25;
      selfAbandonmentScore = Math.min(100, Math.round(reactPart2 + fearPart2 + costPart2));
      selfAbandonmentLevel = selfAbandonmentLevelFromScore(selfAbandonmentScore);

      // Necesidad de límites: blend de desgaste + tolerancia + autoabandono
      boundaryNeedScore = Math.min(
        100,
        Math.round(toleranceDrainScore * 0.4 + excessToleranceScore * 0.3 + selfAbandonmentScore * 0.3),
      );
      boundaryNeedLevel = boundaryNeedLevelFromScore(boundaryNeedScore);

      scoreSum = toleranceDrainScore;
      scoreMax = 100;
      levelLabel = toleranceDrainLevel;
      scoreSecondary = excessToleranceScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = excessToleranceLevel;
    } else if (isBoundaries4) {
      const guiltScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "self_choice_guilt");
      const guiltAvg = avgWithReverse(guiltScales);
      selfChoiceGuiltScore = Math.max(0, Math.round(((guiltAvg - 1) / 4) * 100));
      selfChoiceGuiltLevel = selfChoiceGuiltLevelFromScore(selfChoiceGuiltScore);

      const guiltMomentsQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "guilt_moments");
      const pleasingQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "pleasing_reactions");
      const disappointmentQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "disappointment_emotions");
      guiltMomentsList = Array.isArray(answers[guiltMomentsQ?.id ?? ""]?.value_json) ? (answers[guiltMomentsQ!.id]?.value_json as string[]) : [];
      pleasingReactionsList = Array.isArray(answers[pleasingQ?.id ?? ""]?.value_json) ? (answers[pleasingQ!.id]?.value_json as string[]) : [];
      disappointmentEmotionsList = Array.isArray(answers[disappointmentQ?.id ?? ""]?.value_json) ? (answers[disappointmentQ!.id]?.value_json as string[]) : [];

      // Complacencia (secundario): densidad de reacciones complacientes + emociones de decepción
      const pleasingTotal = pleasingQ?.options?.choices?.length ?? 10;
      const disappointmentTotal = disappointmentQ?.options?.choices?.length ?? 6;
      const pleasingPart = (pleasingReactionsList.length / pleasingTotal) * 60;
      const disappointmentPart = (disappointmentEmotionsList.length / disappointmentTotal) * 40;
      const peoplePleasingScore4 = Math.min(100, Math.round(pleasingPart + disappointmentPart));
      peoplePleasingScore = peoplePleasingScore4;
      peoplePleasingLevel = peoplePleasingLevelFromScore(peoplePleasingScore4);

      // Autoabandono: blend de culpa + complacencia + densidad de momentos de culpa
      const momentsTotal = guiltMomentsQ?.options?.choices?.length ?? 15;
      const momentsPart = Math.min(100, (guiltMomentsList.length / momentsTotal) * 100);
      const selfAbandon4 = Math.min(100, Math.round(selfChoiceGuiltScore * 0.5 + peoplePleasingScore4 * 0.3 + momentsPart * 0.2));
      selfAbandonmentScore = selfAbandon4;
      selfAbandonmentLevel = selfAbandonmentLevelFromScore(selfAbandon4);

      // Capacidad de priorización: inverso de culpa, modulado por completitud de reframe
      const reframeQs4 = questions.filter((q) => q.block_key === "reframe" && q.type === "open");
      const reframeTexts4 = reframeQs4.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const filledReframe = reframeTexts4.filter((t) => t.length > 0).length;
      const avgLenReframe = reframeTexts4.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, reframeQs4.length);
      const reframeCompletion = reframeQs4.length > 0 ? (filledReframe / reframeQs4.length) * 60 + (avgLenReframe / 120) * 40 : 0;
      prioritizationCapacityScore = Math.max(0, Math.min(100, Math.round((100 - selfChoiceGuiltScore) * 0.7 + reframeCompletion * 0.3)));
      prioritizationCapacityLevel = prioritizationCapacityLevelFromScore(prioritizationCapacityScore);

      scoreSum = selfChoiceGuiltScore;
      scoreMax = 100;
      levelLabel = selfChoiceGuiltLevel;
      scoreSecondary = peoplePleasingScore4;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = peoplePleasingLevel;
    } else if (isBoundaries5) {
      // Claridad/asertividad comunicativa (primario) a partir de escalas comunicativas con preguntas invertidas
      const commScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "communication_clarity");
      // avgWithReverse devuelve un promedio "saludable" cuando hay claridad: invertimos las 5 escalas "negativas".
      // Para obtener un score de CLARIDAD (alto = mejor) calculamos como 1->1 invertidas? Aquí: reversed=true ya son las sanas, sin reversed=invertir aquí.
      const vals = commScales
        .map((q) => {
          const raw = answers[q.id]?.value_number;
          if (typeof raw !== "number") return null;
          // q.meta.reversed marca preguntas "sanas" (Puedo expresar, Puedo comunicarme, Puedo priorizarme sin agresividad)
          // Para puntuar CLARIDAD: las sanas suman directo; las "negativas" se invierten (6-raw).
          return q.meta?.reversed ? raw : 6 - raw;
        })
        .filter((v): v is number => typeof v === "number");
      const clarityAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      communicationClarityScore = Math.max(0, Math.min(100, Math.round(((clarityAvg - 1) / 4) * 100)));
      communicationClarityLevel = communicationClarityLevelFromScore(communicationClarityScore);

      const scenariosQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "difficult_scenarios");
      const reactionsQ5 = questions.find((q) => q.type === "multi" && q.meta?.kind === "speech_reactions");
      const fearsQ5 = questions.find((q) => q.type === "multi" && q.meta?.kind === "speech_fears");
      const toneQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "desired_tone");
      difficultScenariosList = Array.isArray(answers[scenariosQ?.id ?? ""]?.value_json) ? (answers[scenariosQ!.id]?.value_json as string[]) : [];
      speechReactionsList = Array.isArray(answers[reactionsQ5?.id ?? ""]?.value_json) ? (answers[reactionsQ5!.id]?.value_json as string[]) : [];
      speechFearsList = Array.isArray(answers[fearsQ5?.id ?? ""]?.value_json) ? (answers[fearsQ5!.id]?.value_json as string[]) : [];
      const toneSelected = Array.isArray(answers[toneQ?.id ?? ""]?.value_json) ? (answers[toneQ!.id]?.value_json as string[]) : [];
      desiredTone = toneSelected[0] ?? null;

      // Evitación: densidad de reacciones evitativas + miedos
      const avoidantSet = new Set(["Me callo", "Aguanto demasiado", "Me justifico", "Sobreexplico", "Exploto después", "Me alejo", "Lo digo con culpa", "Hago indirectas", "Cambio el tema"]);
      const avoidCount = speechReactionsList.filter((r) => avoidantSet.has(r)).length;
      const reactTotal = reactionsQ5?.options?.choices?.length ?? 10;
      const fearsTotal = fearsQ5?.options?.choices?.length ?? 9;
      const reactPart = (avoidCount / reactTotal) * 60;
      const fearPart = (speechFearsList.length / fearsTotal) * 40;
      avoidanceScore = Math.min(100, Math.round(reactPart + fearPart));
      avoidanceLevel = avoidanceLevelFromScore(avoidanceScore);

      // Seguridad comunicativa: inverso de evitación, modulada por claridad
      communicativeSafetyScore = Math.max(0, Math.min(100, Math.round((100 - avoidanceScore) * 0.6 + communicationClarityScore * 0.4)));
      communicativeSafetyLevel = communicativeSafetyLevelFromScore(communicativeSafetyScore);

      // Autoexpresión saludable: blend de claridad + completitud de bloques abiertos (poder, voz, roleplay)
      const expressionQs = questions.filter((q) => (q.block_key === "power_phrase" || q.block_key === "rewriting_voice" || q.block_key === "roleplay") && q.type === "open");
      const expressionTexts = expressionQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const filledExp = expressionTexts.filter((t) => t.length > 0).length;
      const avgLenExp = expressionTexts.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, expressionQs.length);
      const expressionCompletion = expressionQs.length > 0 ? (filledExp / expressionQs.length) * 60 + (avgLenExp / 120) * 40 : 0;
      healthyExpressionScore = Math.max(0, Math.min(100, Math.round(communicationClarityScore * 0.6 + expressionCompletion * 0.4)));
      healthyExpressionLevel = healthyExpressionLevelFromScore(healthyExpressionScore);

      scoreSum = communicationClarityScore;
      scoreMax = 100;
      levelLabel = communicationClarityLevel;
      scoreSecondary = avoidanceScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = avoidanceLevel;
    } else if (isBoundaries6) {
      // Miedo relacional (primario): promedio de 8 escalas con preguntas 7 y 8 invertidas.
      // avgWithReverse devuelve avg "saludable"; lo invertimos para MIEDO (alto = más miedo).
      const fearScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "relational_fear");
      const vals = fearScales
        .map((q) => {
          const raw = answers[q.id]?.value_number;
          if (typeof raw !== "number") return null;
          // reversed=true marca las preguntas "sanas" (sostener incomodidad, manejar rechazo) → invertir para sumar miedo
          return q.meta?.reversed ? 6 - raw : raw;
        })
        .filter((v): v is number => typeof v === "number");
      const fearAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      relationalFearScore = Math.max(0, Math.min(100, Math.round(((fearAvg - 1) / 4) * 100)));
      relationalFearLevel = relationalFearLevelFromScore(relationalFearScore);

      const fearsQ6 = questions.find((q) => q.type === "multi" && q.meta?.kind === "imagined_fears");
      imaginedFearsList = Array.isArray(answers[fearsQ6?.id ?? ""]?.value_json)
        ? (answers[fearsQ6!.id]?.value_json as string[])
        : [];
      const worstQ = questions.find((q) => q.type === "open" && q.meta?.kind === "worst_scenario");
      worstScenarioText = (answers[worstQ?.id ?? ""]?.value_text ?? "").trim();
      const avoidedQ = questions.find((q) => q.type === "open" && q.meta?.kind === "avoided_conversation");
      avoidedConversationText = (answers[avoidedQ?.id ?? ""]?.value_text ?? "").trim();
      const phraseQ = questions.find((q) => q.type === "open" && q.meta?.kind === "phrase_to_remember");
      phraseToRememberText = (answers[phraseQ?.id ?? ""]?.value_text ?? "").trim();

      // Evitación emocional (secundario): densidad de miedos seleccionados + costo emocional escrito
      const fearsTotal = fearsQ6?.options?.choices?.length ?? 14;
      const costQs6 = questions.filter((q) => q.block_key === "fear_cost" && q.type === "open");
      const costTexts6 = costQs6.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const avgCostLen = costTexts6.reduce((acc, t) => acc + Math.min(150, t.length), 0) / Math.max(1, costQs6.length);
      const fearPart = (imaginedFearsList.length / Math.min(3, fearsTotal)) * 60;
      const costPart = (avgCostLen / 150) * 40;
      emotionalAvoidanceScore = Math.min(100, Math.round(fearPart + costPart));
      emotionalAvoidanceLevel = emotionalAvoidanceLevelFromScore(emotionalAvoidanceScore);

      // Seguridad interna: inverso de miedo + completitud de reframes
      const reframeQs6 = questions.filter((q) => q.block_key === "fear_reframe" && q.type === "open");
      const reframeTexts6 = reframeQs6.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const filledReframe = reframeTexts6.filter((t) => t.length > 0).length;
      const avgLenReframe = reframeTexts6.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, reframeQs6.length);
      const reframeCompletion = reframeQs6.length > 0
        ? (filledReframe / reframeQs6.length) * 60 + (avgLenReframe / 120) * 40
        : 0;
      innerSafetyScore = Math.max(0, Math.min(100, Math.round((100 - relationalFearScore) * 0.7 + reframeCompletion * 0.3)));
      innerSafetyLevel = innerSafetyLevelFromScore(innerSafetyScore);

      // Dependencia de aprobación: blend de miedo + densidad de miedos + evitación
      approvalDependencyScoreVal = Math.min(
        100,
        Math.round(relationalFearScore * 0.5 + emotionalAvoidanceScore * 0.3 + (imaginedFearsList.length / 3) * 100 * 0.2),
      );
      approvalDependencyLevel = approvalDependencyLevelFromScore(approvalDependencyScoreVal);

      scoreSum = relationalFearScore;
      scoreMax = 100;
      levelLabel = relationalFearLevel;
      scoreSecondary = emotionalAvoidanceScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = emotionalAvoidanceLevel;
    } else if (isFinancial2) {
      // Escasez financiera mental (primario): scales 1-10 con reversed=true marcando frases sanas
      const moneyScales = scaleQuestions.filter((q) => q.meta?.scale_kind === "money_beliefs");
      const scarcityVals = moneyScales
        .map((q) => {
          const raw = answers[q.id]?.value_number;
          if (typeof raw !== "number") return null;
          // reversed=true => frase sana (alto = sano). Para ESCASEZ, invertimos las sanas.
          return q.meta?.reversed ? 6 - raw : raw;
        })
        .filter((v): v is number => typeof v === "number");
      const scarcityAvg = scarcityVals.length ? scarcityVals.reduce((a, b) => a + b, 0) / scarcityVals.length : 0;
      const inheritedQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "inherited_phrases");
      const patternQ = questions.find((q) => q.type === "multi" && q.meta?.kind === "current_pattern");
      inheritedPhrasesList = Array.isArray(answers[inheritedQ?.id ?? ""]?.value_json)
        ? (answers[inheritedQ!.id]?.value_json as string[])
        : [];
      currentPatternList = Array.isArray(answers[patternQ?.id ?? ""]?.value_json)
        ? (answers[patternQ!.id]?.value_json as string[])
        : [];
      const inheritedTotal = inheritedQ?.options?.choices?.length ?? 20;
      const patternTotal = patternQ?.options?.choices?.length ?? 14;
      // Modulación: densidad de frases heredadas y patrón refuerzan el score de escasez.
      const scarcityBase = ((scarcityAvg - 1) / 4) * 80;
      const densityBoost = (inheritedPhrasesList.length / inheritedTotal) * 10 + (currentPatternList.length / patternTotal) * 10;
      financialScarcityScore = Math.max(0, Math.min(100, Math.round(scarcityBase + densityBoost)));
      financialScarcityLevel = financialScarcityLevelFromScore(financialScarcityScore);

      // Merecimiento financiero: escalas 3 (merezco), 4 (capaz), 6 (abundancia) directas; 7 (culpa) y 8 (cobrar) invertidas.
      const deservingIds = new Set(["fi2_b3_q3", "fi2_b3_q4", "fi2_b3_q6"]);
      const guiltIds = new Set(["fi2_b3_q7", "fi2_b3_q8"]);
      const deservingVals: number[] = [];
      for (const q of moneyScales) {
        const raw = answers[q.id]?.value_number;
        if (typeof raw !== "number") continue;
        if (deservingIds.has(q.id)) deservingVals.push(raw);
        else if (guiltIds.has(q.id)) deservingVals.push(6 - raw);
      }
      const deservingAvg = deservingVals.length ? deservingVals.reduce((a, b) => a + b, 0) / deservingVals.length : 0;
      financialDeservingScore = Math.max(0, Math.min(100, Math.round(((deservingAvg - 1) / 4) * 100)));
      financialDeservingLevel = financialDeservingLevelFromScore(financialDeservingScore);

      // Ansiedad financiera: escalas 2 (estrés), 5 (difícil), 10 (miedo perder) + culpa al gastar
      const anxietyIds = new Set(["fi2_b3_q2", "fi2_b3_q5", "fi2_b3_q7", "fi2_b3_q10"]);
      const anxietyVals = moneyScales
        .filter((q) => anxietyIds.has(q.id))
        .map((q) => answers[q.id]?.value_number)
        .filter((v): v is number => typeof v === "number");
      const anxietyAvg = anxietyVals.length ? anxietyVals.reduce((a, b) => a + b, 0) / anxietyVals.length : 0;
      financialAnxietyScore = Math.max(0, Math.min(100, Math.round(((anxietyAvg - 1) / 4) * 100)));
      financialAnxietyLevel = financialAnxietyLevelFromScore(financialAnxietyScore);

      // Apertura al crecimiento: escala 4 (capaz) + completitud de bloques rewriting/reframe
      const capableQ = moneyScales.find((q) => q.id === "fi2_b3_q4");
      const capable = capableQ ? answers[capableQ.id]?.value_number ?? 0 : 0;
      const rewritingQs = questions.filter((q) => (q.block_key === "rewriting" || q.block_key === "reframe") && q.type === "open");
      const rewritingTexts = rewritingQs.map((q) => (answers[q.id]?.value_text ?? "").trim());
      const filledRewriting = rewritingTexts.filter((t) => t.length > 0).length;
      const avgLenRewriting = rewritingTexts.reduce((acc, t) => acc + Math.min(120, t.length), 0) / Math.max(1, rewritingQs.length);
      const rewritingCompletion = rewritingQs.length > 0
        ? (filledRewriting / rewritingQs.length) * 55 + (avgLenRewriting / 120) * 25
        : 0;
      const capablePart = (capable / 5) * 20;
      growthOpennessScore = Math.max(0, Math.min(100, Math.round(rewritingCompletion + capablePart)));
      growthOpennessLevel = growthOpennessLevelFromScore(growthOpennessScore);

      // Seguridad financiera interna: inverso de escasez modulado por merecimiento y apertura
      financialSecurityScore = Math.max(0, Math.min(100, Math.round(
        (100 - financialScarcityScore) * 0.5 + financialDeservingScore * 0.3 + growthOpennessScore * 0.2,
      )));
      financialSecurityLevel = financialSecurityLevelFromScore(financialSecurityScore);

      const limitQ = questions.find((q) => q.type === "open" && q.meta?.kind === "main_limiting_belief");
      mainLimitingBeliefText = (answers[limitQ?.id ?? ""]?.value_text ?? "").trim();
      const releaseQ = questions.find((q) => q.type === "open" && q.meta?.kind === "belief_to_release");
      beliefToReleaseText = (answers[releaseQ?.id ?? ""]?.value_text ?? "").trim();
      const newPhraseQ = questions.find((q) => q.type === "open" && q.meta?.kind === "new_money_phrase");
      newMoneyPhraseText = (answers[newPhraseQ?.id ?? ""]?.value_text ?? "").trim();

      scoreSum = financialScarcityScore;
      scoreMax = 100;
      levelLabel = financialScarcityLevel;
      scoreSecondary = financialDeservingScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = financialDeservingLevel;
    } else {
      scoreSum = scaleQuestions.reduce((acc, q) => acc + (answers[q.id]?.value_number ?? 0), 0);
      scoreMax = scaleQuestions.length * 5;
      levelLabel = levelFromScore(scoreSum);
    }

    // Saturación emocional — combina intensidad + densidad de detonantes + reacciones + necesidades
    if (isTermometro) {
      const intensity = intensityQ ? answers[intensityQ.id]?.value_number ?? 0 : 0;
      const triggerSel = Array.isArray(answers[triggersQ?.id ?? ""]?.value_json)
        ? (answers[triggersQ!.id]?.value_json as string[]).length
        : 0;
      const reactionSel = Array.isArray(answers[reactionsQ?.id ?? ""]?.value_json)
        ? (answers[reactionsQ!.id]?.value_json as string[]).length
        : 0;
      const needsSel = Array.isArray(answers[needsQ?.id ?? ""]?.value_json)
        ? (answers[needsQ!.id]?.value_json as string[]).length
        : 0;
      // intensity weight 0.5 (0-50), density of triggers+reactions+needs weight 0.5 (0-50)
      const intensityPart = (intensity / 5) * 50;
      const densityPart = Math.min(50, (triggerSel + reactionSel + needsSel) * 5);
      emotionalSaturationScore = Math.round(intensityPart + densityPart);
      const sat = emotionalSaturationLevelFromScore(emotionalSaturationScore);
      emotionalSaturationLevel = sat.label;
      emotionalSaturationEmoji = sat.emoji;
      scoreSecondary = emotionalSaturationScore;
      scoreSecondaryMax = 100;
      levelSecondaryLabel = `${sat.emoji} ${sat.label}`;
    }

    // Saturación mental — derivada de la cantidad de fuentes de agotamiento marcadas
    if (drainersQ) {
      const selected = Array.isArray(answers[drainersQ.id]?.value_json)
        ? (answers[drainersQ.id]?.value_json as string[])
        : [];
      const totalChoices = drainersQ.options?.choices?.length ?? 18;
      mentalSaturationScore = Math.round((selected.length / totalChoices) * 100);
      mentalSaturationLevel = mentalSaturationLevelFromScore(mentalSaturationScore);
    }

    // Narrativa limitante — calculada a partir de cuántas resuenan
    if (narrativeQ) {
      const selected = Array.isArray(answers[narrativeQ.id]?.value_json)
        ? (answers[narrativeQ.id]?.value_json as string[])
        : [];
      const totalChoices = narrativeQ.options?.choices?.length ?? 17;
      limitingNarrativeScore = Math.round((selected.length / totalChoices) * 100);
      limitingNarrativeLevel = limitingNarrativeLevelFromScore(limitingNarrativeScore);
    }

    // Autoexigencia / sombra — calculada a partir de partes rechazadas
    if (shadowQ) {
      const selected = Array.isArray(answers[shadowQ.id]?.value_json)
        ? (answers[shadowQ.id]?.value_json as string[])
        : [];
      const totalChoices = shadowQ.options?.choices?.length ?? 12;
      selfDemandScore = Math.round((selected.length / totalChoices) * 100);
      selfDemandLevel = selfDemandLevelFromScore(selfDemandScore);
    }

    // ---- Llamar IA ----
    let insights: IntrospectionInsights | null = null;
    try {
      const payload = questions.map((q) => ({
        block: q.block_label,
        text: q.text,
        type: q.type,
        meta: q.meta ?? null,
        options: q.options ?? null,
        value_number: answers[q.id]?.value_number ?? null,
        value_text: answers[q.id]?.value_text ?? null,
        value_json: answers[q.id]?.value_json ?? null,
      }));
      const { data, error } = await supabase.functions.invoke("ai-introspection-insights", {
        body: {
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          score: scoreSum,
          score_max: scoreMax,
          level_label: levelLabel,
          score_secondary: scoreSecondary,
          score_secondary_max: scoreSecondaryMax,
          level_secondary_label: levelSecondaryLabel,
          is_dual: isDual,
          limiting_narrative_score: limitingNarrativeScore,
          limiting_narrative_level: limitingNarrativeLevel,
          self_demand_score: selfDemandScore,
          self_demand_level: selfDemandLevel,
          mental_saturation_score: mentalSaturationScore,
          mental_saturation_level: mentalSaturationLevel,
          emotional_saturation_score: emotionalSaturationScore,
          emotional_saturation_level: emotionalSaturationLevel,
          reactivity_score: reactivityScore,
          reactivity_level: reactivityLevel,
          emotional_awareness_score: emotionalAwarenessScore,
          emotional_awareness_level: emotionalAwarenessLevel,
          thought_rigidity_score: thoughtRigidityScore,
          thought_rigidity_level: thoughtRigidityLevel,
          reframe_capacity_score: reframeCapacityScore,
          reframe_capacity_level: reframeCapacityLevel,
          abc_intensity_score: abcIntensityScore,
          abc_intensity_level: abcIntensityLevel,
          awareness_score: awarenessScore,
          awareness_level: awarenessLevel,
          depth_score: depthScore,
          depth_level: depthLevel,
          calm_score: calmScore,
          calm_level: calmLevel,
          calm_saturation_score: calmSaturationScore,
          calm_saturation_level: calmSaturationLevel,
          regulation_score: regulationScore,
          regulation_level_label: regulationLabel,
          fatigue_score: fatigueScore,
          fatigue_level: fatigueLabel,
          kit_self_awareness_score: kitSelfAwarenessScore,
          kit_self_awareness_level: kitSelfAwarenessLevel,
          kit_unhelpful_dependency_score: kitUnhelpfulScore,
          kit_unhelpful_dependency_level: kitUnhelpfulLevel,
          kit_inner_resource_score: kitInnerResourceScore,
          kit_inner_resource_level: kitInnerResourceLevel,
          kit_calm_profile: kitCalmProfile ? { key: kitCalmProfile.key, label: kitCalmProfile.label, emoji: kitCalmProfile.emoji, description: kitCalmProfile.description } : null,
          kit_top_tools: kitTopTools,
          kit_unhelpful_list: kitUnhelpfulList,
          mental_noise_score: mentalNoiseScore,
          mental_noise_level: mentalNoiseLevel,
          overthinking_score: overthinkingScore,
          overthinking_level: overthinkingLevel,
          cognitive_saturation_score: cognitiveSaturationScore,
          cognitive_saturation_level: cognitiveSaturationLevel,
          release_capacity_score: releaseCapacityScore,
          release_capacity_level: releaseCapacityLevel,
          silencio_mental_loads: silencioMentalLoads,
          body_tension_score: bodyTensionScore,
          body_tension_level: bodyTensionLevel,
          body_connection_score: bodyConnectionScore,
          body_connection_level: bodyConnectionLevel,
          body_fatigue_score: bodyFatigueScore,
          body_fatigue_level: bodyFatigueLevel,
          body_regulation_score: bodyRegulationScore,
          body_regulation_level: bodyRegulationLevel,
          body_tension_zones: bodyTensionZones,
          body_need_list: bodyNeedList,
          body_emotion_list: bodyEmotionList,
          boundaries_health_score: boundariesHealthScore,
          boundaries_health_level: boundariesHealthLevel,
          people_pleasing_score: peoplePleasingScore,
          people_pleasing_level: peoplePleasingLevel,
          interpersonal_guilt_score: interpersonalGuiltScore,
          interpersonal_guilt_level: interpersonalGuiltLevel,
          relational_exhaustion_score: relationalExhaustionScore,
          relational_exhaustion_level: relationalExhaustionLevel,
          boundary_areas_list: boundaryAreasList,
          boundary_reactions_list: boundaryReactionsList,
          boundary_fears_list: boundaryFearsList,
          boundary_small_limit_list: boundarySmallLimitList,
          boundary_helpful_phrase_list: boundaryHelpfulPhraseList,
          tolerance_drain_score: toleranceDrainScore,
          tolerance_drain_level: toleranceDrainLevel,
          excess_tolerance_score: excessToleranceScore,
          excess_tolerance_level: excessToleranceLevel,
          self_abandonment_score: selfAbandonmentScore,
          self_abandonment_level: selfAbandonmentLevel,
          boundary_need_score: boundaryNeedScore,
          boundary_need_level: boundaryNeedLevel,
          normalized_things: normalizedThings,
          tolerance_reactions: toleranceReactions,
          tolerance_fears: toleranceFears,
          self_choice_guilt_score: selfChoiceGuiltScore,
          self_choice_guilt_level: selfChoiceGuiltLevel,
          prioritization_capacity_score: prioritizationCapacityScore,
          prioritization_capacity_level: prioritizationCapacityLevel,
          guilt_moments_list: guiltMomentsList,
          pleasing_reactions_list: pleasingReactionsList,
          disappointment_emotions_list: disappointmentEmotionsList,
          communication_clarity_score: communicationClarityScore,
          communication_clarity_level: communicationClarityLevel,
          avoidance_score: avoidanceScore,
          avoidance_level: avoidanceLevel,
          communicative_safety_score: communicativeSafetyScore,
          communicative_safety_level: communicativeSafetyLevel,
          healthy_expression_score: healthyExpressionScore,
          healthy_expression_level: healthyExpressionLevel,
          difficult_scenarios_list: difficultScenariosList,
          speech_reactions_list: speechReactionsList,
          speech_fears_list: speechFearsList,
          desired_tone: desiredTone,
          relational_fear_score: relationalFearScore,
          relational_fear_level: relationalFearLevel,
          emotional_avoidance_score: emotionalAvoidanceScore,
          emotional_avoidance_level: emotionalAvoidanceLevel,
          inner_safety_score: innerSafetyScore,
          inner_safety_level: innerSafetyLevel,
          approval_dependency_score: approvalDependencyScoreVal,
          approval_dependency_level: approvalDependencyLevel,
          imagined_fears_list: imaginedFearsList,
          worst_scenario: worstScenarioText,
          avoided_conversation: avoidedConversationText,
          phrase_to_remember: phraseToRememberText,
          financial_scarcity_score: financialScarcityScore,
          financial_scarcity_level: financialScarcityLevel,
          financial_security_score: financialSecurityScore,
          financial_security_level: financialSecurityLevel,
          financial_deserving_score: financialDeservingScore,
          financial_deserving_level: financialDeservingLevel,
          growth_openness_score: growthOpennessScore,
          growth_openness_level: growthOpennessLevel,
          financial_anxiety_score: financialAnxietyScore,
          financial_anxiety_level: financialAnxietyLevel,
          inherited_phrases_list: inheritedPhrasesList,
          current_pattern_list: currentPatternList,
          main_limiting_belief_text: mainLimitingBeliefText,
          belief_to_release: beliefToReleaseText,
          new_money_phrase: newMoneyPhraseText,
          answers: payload,
        },
      });
      if (!error && data && (data as { insights?: IntrospectionInsights }).insights) {
        insights = (data as { insights: IntrospectionInsights }).insights;
      }
    } catch (e) {
      console.error("introspection insights error", e);
    }

    // Inyectar scores calculados localmente en los insights
    if (limitingNarrativeScore !== null || selfDemandScore !== null || mentalSaturationScore !== null || emotionalSaturationScore !== null || isCritAccept || isEspejo || isDrain || isTermometro || isDetonantes || isABC || isProfunda || isCalma || isKit || isSilencio || isCuerpo || isBoundaries || isBoundaries2 || isBoundaries4 || isBoundaries5 || isBoundaries6 || isFinancial2) {
      insights = {
        ...(insights ?? {}),
        limiting_narrative_score: limitingNarrativeScore ?? undefined,
        limiting_narrative_level: limitingNarrativeLevel ?? undefined,
        self_criticism_score: isCritAccept ? scoreSum : undefined,
        self_criticism_level: isCritAccept ? levelLabel : undefined,
        self_acceptance_score: isCritAccept ? scoreSecondary ?? undefined : undefined,
        self_acceptance_level: isCritAccept ? levelSecondaryLabel ?? undefined : undefined,
        self_image_score: isEspejo ? scoreSum : undefined,
        self_image_level: isEspejo ? levelLabel : undefined,
        perceived_authenticity_score: isEspejo ? scoreSecondary ?? undefined : undefined,
        perceived_authenticity_level: isEspejo ? levelSecondaryLabel ?? undefined : undefined,
        self_demand_score: selfDemandScore ?? undefined,
        self_demand_level: selfDemandLevel ?? undefined,
        exhaustion_score: isDrain ? scoreSum : undefined,
        exhaustion_level: isDrain ? levelLabel : undefined,
        self_care_score: isDrain ? scoreSecondary ?? undefined : undefined,
        self_care_level: isDrain ? levelSecondaryLabel ?? undefined : undefined,
        mental_saturation_score: mentalSaturationScore ?? undefined,
        mental_saturation_level: mentalSaturationLevel ?? undefined,
        intensity_score: isTermometro ? scoreSum : undefined,
        intensity_level: isTermometro ? levelLabel : undefined,
        emotional_saturation_score: emotionalSaturationScore ?? undefined,
        emotional_saturation_level: emotionalSaturationLevel
          ? `${emotionalSaturationEmoji ?? ""} ${emotionalSaturationLevel}`.trim()
          : undefined,
        reactivity_score: isDetonantes ? reactivityScore ?? undefined : undefined,
        reactivity_level: isDetonantes ? reactivityLevel ?? undefined : undefined,
        emotional_awareness_score: isDetonantes ? emotionalAwarenessScore ?? undefined : undefined,
        emotional_awareness_level: isDetonantes ? emotionalAwarenessLevel ?? undefined : undefined,
        thought_rigidity_score: isABC ? thoughtRigidityScore ?? undefined : undefined,
        thought_rigidity_level: isABC ? thoughtRigidityLevel ?? undefined : undefined,
        reframe_capacity_score: isABC ? reframeCapacityScore ?? undefined : undefined,
        reframe_capacity_level: isABC ? reframeCapacityLevel ?? undefined : undefined,
        abc_intensity_score: isABC ? abcIntensityScore ?? undefined : undefined,
        abc_intensity_level: isABC ? abcIntensityLevel ?? undefined : undefined,
        awareness_score: isProfunda ? awarenessScore ?? undefined : undefined,
        awareness_level: isProfunda ? awarenessLevel ?? undefined : undefined,
        depth_score: isProfunda ? depthScore ?? undefined : undefined,
        depth_level: isProfunda ? depthLevel ?? undefined : undefined,
        calm_score: isCalma ? calmScore ?? undefined : undefined,
        calm_level: isCalma ? calmLevel ?? undefined : undefined,
        calm_saturation_score: isCalma ? calmSaturationScore ?? undefined : undefined,
        calm_saturation_level: isCalma ? calmSaturationLevel ?? undefined : undefined,
        regulation_score: isCalma ? regulationScore ?? undefined : undefined,
        regulation_level_label: isCalma ? regulationLabel ?? undefined : undefined,
        fatigue_score: isCalma ? fatigueScore ?? undefined : undefined,
        fatigue_level: isCalma ? fatigueLabel ?? undefined : undefined,
        self_awareness_score: isKit ? kitSelfAwarenessScore ?? undefined : undefined,
        self_awareness_level: isKit ? kitSelfAwarenessLevel ?? undefined : undefined,
        unhelpful_dependency_score: isKit ? kitUnhelpfulScore ?? undefined : undefined,
        unhelpful_dependency_level: isKit ? kitUnhelpfulLevel ?? undefined : undefined,
        inner_resource_score: isKit ? kitInnerResourceScore ?? undefined : undefined,
        inner_resource_level: isKit ? kitInnerResourceLevel ?? undefined : undefined,
        calm_profile: isKit && kitCalmProfile ? kitCalmProfile.label : (insights as IntrospectionInsights | null)?.calm_profile,
        calm_profile_emoji: isKit && kitCalmProfile ? kitCalmProfile.emoji : (insights as IntrospectionInsights | null)?.calm_profile_emoji,
        calm_profile_description: isKit && kitCalmProfile ? kitCalmProfile.description : (insights as IntrospectionInsights | null)?.calm_profile_description,
        mental_noise_score: isSilencio ? mentalNoiseScore ?? undefined : undefined,
        mental_noise_level: isSilencio ? mentalNoiseLevel ?? undefined : undefined,
        overthinking_score: isSilencio ? overthinkingScore ?? undefined : undefined,
        overthinking_level: isSilencio ? overthinkingLevel ?? undefined : undefined,
        cognitive_saturation_score: isSilencio ? cognitiveSaturationScore ?? undefined : undefined,
        cognitive_saturation_level: isSilencio ? cognitiveSaturationLevel ?? undefined : undefined,
        release_capacity_score: isSilencio ? releaseCapacityScore ?? undefined : undefined,
        release_capacity_level: isSilencio ? releaseCapacityLevel ?? undefined : undefined,
        main_mental_loads: isSilencio
          ? (((insights as IntrospectionInsights | null)?.main_mental_loads) ?? (silencioMentalLoads.length ? silencioMentalLoads : undefined))
          : (insights as IntrospectionInsights | null)?.main_mental_loads,
        body_tension_score: isCuerpo ? bodyTensionScore ?? undefined : undefined,
        body_tension_level: isCuerpo ? bodyTensionLevel ?? undefined : undefined,
        body_connection_score: isCuerpo ? bodyConnectionScore ?? undefined : undefined,
        body_connection_level: isCuerpo ? bodyConnectionLevel ?? undefined : undefined,
        body_fatigue_score: isCuerpo ? bodyFatigueScore ?? undefined : undefined,
        body_fatigue_level: isCuerpo ? bodyFatigueLevel ?? undefined : undefined,
        body_regulation_score: isCuerpo ? bodyRegulationScore ?? undefined : undefined,
        body_regulation_level: isCuerpo ? bodyRegulationLevel ?? undefined : undefined,
        tension_zones: isCuerpo
          ? (((insights as IntrospectionInsights | null)?.tension_zones) ?? (bodyTensionZones.length ? bodyTensionZones : undefined))
          : (insights as IntrospectionInsights | null)?.tension_zones,
        boundaries_health_score: isBoundaries ? boundariesHealthScore ?? undefined : undefined,
        boundaries_health_level: isBoundaries ? boundariesHealthLevel ?? undefined : undefined,
        // people_pleasing handled below to include boundaries4
        interpersonal_guilt_score: isBoundaries ? interpersonalGuiltScore ?? undefined : undefined,
        interpersonal_guilt_level: isBoundaries ? interpersonalGuiltLevel ?? undefined : undefined,
        relational_exhaustion_score: isBoundaries ? relationalExhaustionScore ?? undefined : undefined,
        relational_exhaustion_level: isBoundaries ? relationalExhaustionLevel ?? undefined : undefined,
        tolerance_drain_score: isBoundaries2 ? toleranceDrainScore ?? undefined : undefined,
        tolerance_drain_level: isBoundaries2 ? toleranceDrainLevel ?? undefined : undefined,
        excess_tolerance_score: isBoundaries2 ? excessToleranceScore ?? undefined : undefined,
        excess_tolerance_level: isBoundaries2 ? excessToleranceLevel ?? undefined : undefined,
        self_abandonment_score: isBoundaries2 || isBoundaries4 ? selfAbandonmentScore ?? undefined : undefined,
        self_abandonment_level: isBoundaries2 || isBoundaries4 ? selfAbandonmentLevel ?? undefined : undefined,
        boundary_need_score: isBoundaries2 ? boundaryNeedScore ?? undefined : undefined,
        boundary_need_level: isBoundaries2 ? boundaryNeedLevel ?? undefined : undefined,
        normalized_things: isBoundaries2
          ? (((insights as IntrospectionInsights | null)?.normalized_things) ?? (normalizedThings.length ? normalizedThings : undefined))
          : (insights as IntrospectionInsights | null)?.normalized_things,
        self_choice_guilt_score: isBoundaries4 ? selfChoiceGuiltScore ?? undefined : undefined,
        self_choice_guilt_level: isBoundaries4 ? selfChoiceGuiltLevel ?? undefined : undefined,
        prioritization_capacity_score: isBoundaries4 ? prioritizationCapacityScore ?? undefined : undefined,
        prioritization_capacity_level: isBoundaries4 ? prioritizationCapacityLevel ?? undefined : undefined,
        people_pleasing_score: isBoundaries || isBoundaries4 ? peoplePleasingScore ?? undefined : undefined,
        people_pleasing_level: isBoundaries || isBoundaries4 ? peoplePleasingLevel ?? undefined : undefined,
        guilt_moments_list: isBoundaries4 ? (guiltMomentsList.length ? guiltMomentsList : undefined) : undefined,
        pleasing_reactions_list: isBoundaries4 ? (pleasingReactionsList.length ? pleasingReactionsList : undefined) : undefined,
        disappointment_emotions_list: isBoundaries4 ? (disappointmentEmotionsList.length ? disappointmentEmotionsList : undefined) : undefined,
        communication_clarity_score: isBoundaries5 ? communicationClarityScore ?? undefined : undefined,
        communication_clarity_level: isBoundaries5 ? communicationClarityLevel ?? undefined : undefined,
        avoidance_score: isBoundaries5 ? avoidanceScore ?? undefined : undefined,
        avoidance_level: isBoundaries5 ? avoidanceLevel ?? undefined : undefined,
        communicative_safety_score: isBoundaries5 ? communicativeSafetyScore ?? undefined : undefined,
        communicative_safety_level: isBoundaries5 ? communicativeSafetyLevel ?? undefined : undefined,
        healthy_expression_score: isBoundaries5 ? healthyExpressionScore ?? undefined : undefined,
        healthy_expression_level: isBoundaries5 ? healthyExpressionLevel ?? undefined : undefined,
        difficult_scenarios_list: isBoundaries5 ? (difficultScenariosList.length ? difficultScenariosList : undefined) : undefined,
        speech_reactions_list: isBoundaries5 ? (speechReactionsList.length ? speechReactionsList : undefined) : undefined,
        speech_fears_list: isBoundaries5 ? (speechFearsList.length ? speechFearsList : undefined) : undefined,
        desired_tone: isBoundaries5 ? desiredTone ?? undefined : undefined,
        relational_fear_score: isBoundaries6 ? relationalFearScore ?? undefined : undefined,
        relational_fear_level: isBoundaries6 ? relationalFearLevel ?? undefined : undefined,
        emotional_avoidance_score: isBoundaries6 ? emotionalAvoidanceScore ?? undefined : undefined,
        emotional_avoidance_level: isBoundaries6 ? emotionalAvoidanceLevel ?? undefined : undefined,
        inner_safety_score: isBoundaries6 ? innerSafetyScore ?? undefined : undefined,
        inner_safety_level: isBoundaries6 ? innerSafetyLevel ?? undefined : undefined,
        approval_dependency_score: isBoundaries6 ? approvalDependencyScoreVal ?? undefined : undefined,
        approval_dependency_level: isBoundaries6 ? approvalDependencyLevel ?? undefined : undefined,
        imagined_fears_list: isBoundaries6 ? (imaginedFearsList.length ? imaginedFearsList : undefined) : undefined,
        worst_scenario: isBoundaries6 && worstScenarioText ? worstScenarioText : undefined,
        avoided_conversation: isBoundaries6 && avoidedConversationText ? avoidedConversationText : undefined,
        phrase_to_remember: isBoundaries6 && phraseToRememberText ? phraseToRememberText : undefined,
        financial_scarcity_score: isFinancial2 ? financialScarcityScore ?? undefined : undefined,
        financial_scarcity_level: isFinancial2 ? financialScarcityLevel ?? undefined : undefined,
        financial_security_score: isFinancial2 ? financialSecurityScore ?? undefined : undefined,
        financial_security_level: isFinancial2 ? financialSecurityLevel ?? undefined : undefined,
        financial_deserving_score: isFinancial2 ? financialDeservingScore ?? undefined : undefined,
        financial_deserving_level: isFinancial2 ? financialDeservingLevel ?? undefined : undefined,
        growth_openness_score: isFinancial2 ? growthOpennessScore ?? undefined : undefined,
        growth_openness_level: isFinancial2 ? growthOpennessLevel ?? undefined : undefined,
        financial_anxiety_score: isFinancial2 ? financialAnxietyScore ?? undefined : undefined,
        financial_anxiety_level: isFinancial2 ? financialAnxietyLevel ?? undefined : undefined,
        inherited_phrases_list: isFinancial2 && inheritedPhrasesList.length ? inheritedPhrasesList : undefined,
        current_pattern_list: isFinancial2 && currentPatternList.length ? currentPatternList : undefined,
        main_limiting_belief_text: isFinancial2 && mainLimitingBeliefText ? mainLimitingBeliefText : undefined,
        belief_to_release: isFinancial2 && beliefToReleaseText ? beliefToReleaseText : undefined,
        new_money_phrase: isFinancial2 && newMoneyPhraseText ? newMoneyPhraseText : undefined,
      };
    }

    const { data: updated } = await supabase
      .from("introspection_sessions")
      .update({
        status: "completed",
        score: scoreSum,
        score_max: scoreMax,
        level_label: levelLabel,
        score_secondary: scoreSecondary,
        score_secondary_max: scoreSecondaryMax,
        level_secondary_label: levelSecondaryLabel,
        ai_result: insights as never,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select("*")
      .single();
    if (updated) setSession(updated as IntrospectionSession);
    return (updated as IntrospectionSession) ?? null;
  }, [user, session, exercise, questions, answers]);

  return {
    exercise,
    questions,
    session,
    answers,
    loading,
    startSession,
    saveAnswer,
    completeSession,
    reload: load,
  };
}

export function useIntrospectionSession(sessionId: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<IntrospectionSession | null>(null);
  const [exercise, setExercise] = useState<IntrospectionExercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { data: sess } = await supabase
        .from("introspection_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancel) return;
      setSession((sess as IntrospectionSession) ?? null);
      if (sess) {
        const { data: ex } = await supabase
          .from("introspection_exercises")
          .select("*")
          .eq("id", (sess as IntrospectionSession).exercise_id)
          .maybeSingle();
        if (!cancel) setExercise((ex as IntrospectionExercise) ?? null);
      }
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [user, sessionId]);

  const updateNotes = useCallback(
    async (notes: string) => {
      if (!session) return;
      const { data } = await supabase
        .from("introspection_sessions")
        .update({ notes })
        .eq("id", session.id)
        .select("*")
        .single();
      if (data) setSession(data as IntrospectionSession);
    },
    [session],
  );

  return { session, exercise, loading, updateNotes };
}
