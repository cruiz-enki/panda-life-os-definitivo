
ALTER TABLE public.introspection_questions DROP CONSTRAINT IF EXISTS introspection_questions_type_check;
ALTER TABLE public.introspection_questions ADD CONSTRAINT introspection_questions_type_check CHECK (type IN ('scale','open','multi'));
ALTER TABLE public.introspection_questions ADD COLUMN IF NOT EXISTS options jsonb;
ALTER TABLE public.introspection_questions ADD COLUMN IF NOT EXISTS meta jsonb;

ALTER TABLE public.introspection_answers ADD COLUMN IF NOT EXISTS value_json jsonb;

ALTER TABLE public.introspection_sessions ADD COLUMN IF NOT EXISTS score_secondary integer;
ALTER TABLE public.introspection_sessions ADD COLUMN IF NOT EXISTS score_secondary_max integer;
ALTER TABLE public.introspection_sessions ADD COLUMN IF NOT EXISTS level_secondary_label text;

-- Ejercicio
INSERT INTO public.introspection_exercises (id, category, name, subtitle, description, intro_text, duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active)
VALUES (
  'know_yourself_002',
  'know_yourself',
  'Las Capas de Mi Identidad',
  'Descubre las distintas versiones de ti que aparecen según el contexto.',
  'Identifica tus versiones según el contexto, detecta autenticidad y desgaste emocional.',
  E'Todos mostramos distintas versiones de nosotros dependiendo del lugar, las personas o las circunstancias.\n\nNo significa que seas falso.\n\nSignifica que eres humano.\n\nPero cuando las diferencias entre tus versiones son demasiado grandes, puede aparecer cansancio, confusión o una sensación de no saber realmente quién eres.\n\nHoy vamos a observar tus capas.',
  10, 15,
  'Inicial–Intermedio',
  'Mixto',
  '#8b5cf6', '#ec4899',
  '🎭', true, 2, true
) ON CONFLICT (id) DO UPDATE SET
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  intro_text = EXCLUDED.intro_text,
  emoji = EXCLUDED.emoji,
  color_from = EXCLUDED.color_from,
  color_to = EXCLUDED.color_to,
  duration_min = EXCLUDED.duration_min,
  duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level,
  type = EXCLUDED.type,
  sort_order = EXCLUDED.sort_order;

-- limpiar preguntas previas (idempotente)
DELETE FROM public.introspection_questions WHERE exercise_id = 'know_yourself_002';

-- Bloque 1: 6 contextos x 4 preguntas
DO $$
DECLARE
  ctxs text[][] := ARRAY[
    ARRAY['work',    'Yo en el trabajo'],
    ARRAY['family',  'Yo con mi familia'],
    ARRAY['friends', 'Yo con mis amigos'],
    ARRAY['partner', 'Yo en pareja'],
    ARRAY['alone',   'Yo cuando estoy solo'],
    ARRAY['social',  'Yo en redes sociales']
  ];
  i int;
  ctx_key text;
  ctx_label text;
  base_sort int;
  emotions jsonb := '["Paz","Ansiedad","Seguridad","Estrés","Alegría","Tristeza","Presión","Libertad","Confusión","Confianza","Cansancio","Motivación"]'::jsonb;
BEGIN
  FOR i IN 1..array_length(ctxs,1) LOOP
    ctx_key   := ctxs[i][1];
    ctx_label := ctxs[i][2];
    base_sort := (i-1)*4;

    INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
      ('ki002-c'||i||'-a', 'know_yourself_002', 'versions', 'Tus versiones', base_sort+1, 'open',
        ctx_label || ' — ¿Cómo te describirías en esta versión de ti?', NULL,
        jsonb_build_object('context', ctx_key, 'context_label', ctx_label, 'kind','description')),
      ('ki002-c'||i||'-b', 'know_yourself_002', 'versions', 'Tus versiones', base_sort+2, 'multi',
        ctx_label || ' — ¿Qué emociones predominan en esta versión?',
        jsonb_build_object('choices', emotions, 'min', 1, 'max', 6),
        jsonb_build_object('context', ctx_key, 'context_label', ctx_label, 'kind','emotions')),
      ('ki002-c'||i||'-c', 'know_yourself_002', 'versions', 'Tus versiones', base_sort+3, 'scale',
        ctx_label || ' — ¿Qué tanto sientes que eres realmente tú en este contexto?', NULL,
        jsonb_build_object('context', ctx_key, 'context_label', ctx_label, 'scale_kind','authenticity', 'min_label','Nada auténtico','max_label','Totalmente auténtico')),
      ('ki002-c'||i||'-d', 'know_yourself_002', 'versions', 'Tus versiones', base_sort+4, 'scale',
        ctx_label || ' — ¿Qué tanto te desgasta emocionalmente esta versión?', NULL,
        jsonb_build_object('context', ctx_key, 'context_label', ctx_label, 'scale_kind','exhaustion', 'min_label','Nada','max_label','Muchísimo'));
  END LOOP;
END $$;

-- Bloque 2 — La máscara
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text) VALUES
  ('ki002-b2-1','know_yourself_002','mask','La máscara',101,'open','¿Qué parte de ti ocultas con más frecuencia?'),
  ('ki002-b2-2','know_yourself_002','mask','La máscara',102,'open','¿Qué versión de ti sientes más auténtica?'),
  ('ki002-b2-3','know_yourself_002','mask','La máscara',103,'open','¿Qué versión de ti se siente más cansada?'),
  ('ki002-b2-4','know_yourself_002','mask','La máscara',104,'open','¿En qué contexto sientes que tienes que actuar más?'),
  ('ki002-b2-5','know_yourself_002','mask','La máscara',105,'open','¿Qué crees que pasaría si fueras más tú mismo?');

-- Bloque 3 — Contradicciones (frases para completar)
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, meta) VALUES
  ('ki002-b3-1','know_yourself_002','contradictions','Contradicciones',201,'open','Completa: "Una parte de mí quiere ______ pero otra parte tiene miedo de ______."', jsonb_build_object('kind','fill_in_blank')),
  ('ki002-b3-2','know_yourself_002','contradictions','Contradicciones',202,'open','Completa: "Quiero que los demás me vean como ______"', jsonb_build_object('kind','fill_in_blank')),
  ('ki002-b3-3','know_yourself_002','contradictions','Contradicciones',203,'open','Completa: "Pero secretamente me preocupa ______"', jsonb_build_object('kind','fill_in_blank')),
  ('ki002-b3-4','know_yourself_002','contradictions','Contradicciones',204,'open','Completa: "Hay algo de mí que quisiera mostrar más: ______"', jsonb_build_object('kind','fill_in_blank'));

-- Bloque 4 — Integración
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text) VALUES
  ('ki002-b4-1','know_yourself_002','integration','Integración',301,'open','¿Qué parte de ti necesita más espacio en tu vida?'),
  ('ki002-b4-2','know_yourself_002','integration','Integración',302,'open','¿Qué versión de ti quieres fortalecer?'),
  ('ki002-b4-3','know_yourself_002','integration','Integración',303,'open','¿Qué máscara te gustaría dejar de usar?'),
  ('ki002-b4-4','know_yourself_002','integration','Integración',304,'open','¿Qué pequeño acto de autenticidad podrías hacer esta semana?');
