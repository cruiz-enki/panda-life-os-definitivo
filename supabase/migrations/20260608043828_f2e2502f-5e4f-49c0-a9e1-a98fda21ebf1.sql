
-- Catálogo de ejercicios
CREATE TABLE public.introspection_exercises (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  intro_text TEXT,
  duration_min INT,
  duration_max INT,
  level TEXT,
  type TEXT,
  color_from TEXT,
  color_to TEXT,
  emoji TEXT,
  premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.introspection_exercises TO authenticated;
GRANT ALL ON public.introspection_exercises TO service_role;
ALTER TABLE public.introspection_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises readable by authenticated" ON public.introspection_exercises FOR SELECT TO authenticated USING (true);

-- Preguntas
CREATE TABLE public.introspection_questions (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES public.introspection_exercises(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  block_label TEXT NOT NULL,
  sort_order INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scale','open')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.introspection_questions TO authenticated;
GRANT ALL ON public.introspection_questions TO service_role;
ALTER TABLE public.introspection_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable by authenticated" ON public.introspection_questions FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_introspection_questions_exercise ON public.introspection_questions(exercise_id, sort_order);

-- Sesiones
CREATE TABLE public.introspection_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES public.introspection_exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  score INT,
  score_max INT,
  level_label TEXT,
  ai_result JSONB,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.introspection_sessions TO authenticated;
GRANT ALL ON public.introspection_sessions TO service_role;
ALTER TABLE public.introspection_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage their sessions" ON public.introspection_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_introspection_sessions_user ON public.introspection_sessions(user_id, exercise_id, status);

-- Respuestas
CREATE TABLE public.introspection_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.introspection_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.introspection_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_number INT,
  value_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.introspection_answers TO authenticated;
GRANT ALL ON public.introspection_answers TO service_role;
ALTER TABLE public.introspection_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage their answers" ON public.introspection_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_introspection_answers_session ON public.introspection_answers(session_id);

-- Triggers updated_at
CREATE TRIGGER trg_introspection_exercises_updated BEFORE UPDATE ON public.introspection_exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_introspection_sessions_updated BEFORE UPDATE ON public.introspection_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_introspection_answers_updated BEFORE UPDATE ON public.introspection_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: ejercicio 001
INSERT INTO public.introspection_exercises (id, category, name, subtitle, description, intro_text, duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order)
VALUES (
  'know_yourself_001',
  'know_yourself',
  'Radiografía Personal 360°',
  'Una mirada honesta sobre quién eres hoy.',
  'Una autoevaluación integral de distintas áreas de identidad y bienestar para tener una visión general de ti mismo en este momento.',
  E'No eres la misma persona que eras hace un año.\n\nAntes de crecer, sanar o cambiar algo, vale la pena detenernos un momento y preguntarnos:\n\n¿Quién soy realmente hoy?\n\nEste ejercicio te ayudará a observarte con honestidad, reconocer fortalezas y descubrir áreas que quizá necesitan atención.',
  8, 12, 'inicial', 'mixto', '#f59e0b', '#ea580c', '🪞', true, 1
);

-- Preguntas
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text) VALUES
('ky001_q1','know_yourself_001','identity','Identidad',1,'scale','Tengo claridad sobre quién soy.'),
('ky001_q2','know_yourself_001','identity','Identidad',2,'scale','Sé qué valores son importantes para mí.'),
('ky001_q3','know_yourself_001','identity','Identidad',3,'scale','Me siento auténtico siendo yo mismo.'),
('ky001_q4','know_yourself_001','identity','Identidad',4,'scale','Siento que mi vida representa quién quiero ser.'),
('ky001_q5','know_yourself_001','identity','Identidad',5,'scale','Tengo una visión clara de hacia dónde voy.'),
('ky001_q6','know_yourself_001','emotional','Bienestar emocional',6,'scale','Sé identificar lo que siento.'),
('ky001_q7','know_yourself_001','emotional','Bienestar emocional',7,'scale','Manejo mis emociones de forma saludable.'),
('ky001_q8','know_yourself_001','emotional','Bienestar emocional',8,'scale','Me siento emocionalmente estable.'),
('ky001_q9','know_yourself_001','emotional','Bienestar emocional',9,'scale','Me trato con amabilidad cuando me equivoco.'),
('ky001_q10','know_yourself_001','emotional','Bienestar emocional',10,'scale','Estoy en paz conmigo mismo.'),
('ky001_q11','know_yourself_001','relationships','Relaciones',11,'scale','Tengo personas con quienes puedo ser yo mismo.'),
('ky001_q12','know_yourself_001','relationships','Relaciones',12,'scale','Me siento escuchado por las personas cercanas.'),
('ky001_q13','know_yourself_001','relationships','Relaciones',13,'scale','Expreso mis necesidades con claridad.'),
('ky001_q14','know_yourself_001','relationships','Relaciones',14,'scale','Tengo relaciones sanas.'),
('ky001_q15','know_yourself_001','relationships','Relaciones',15,'scale','Me siento acompañado en mi vida.'),
('ky001_q16','know_yourself_001','purpose','Propósito y dirección',16,'scale','Mi trabajo o actividades tienen sentido para mí.'),
('ky001_q17','know_yourself_001','purpose','Propósito y dirección',17,'scale','Siento entusiasmo por mi futuro.'),
('ky001_q18','know_yourself_001','purpose','Propósito y dirección',18,'scale','Estoy creciendo como persona.'),
('ky001_q19','know_yourself_001','purpose','Propósito y dirección',19,'scale','Mis decisiones están alineadas con mis valores.'),
('ky001_q20','know_yourself_001','purpose','Propósito y dirección',20,'scale','Siento que avanzo hacia una mejor versión de mí.'),
('ky001_q21','know_yourself_001','reflection','Reflexión profunda',21,'open','¿Qué parte de tu vida hoy necesita más atención?'),
('ky001_q22','know_yourself_001','reflection','Reflexión profunda',22,'open','¿Qué versión de ti estás dejando atrás?'),
('ky001_q23','know_yourself_001','reflection','Reflexión profunda',23,'open','¿Qué te gustaría agradecerte de este momento de tu vida?'),
('ky001_q24','know_yourself_001','reflection','Reflexión profunda',24,'open','Si pudieras darte un consejo sincero hoy, ¿cuál sería?'),
('ky001_q25','know_yourself_001','reflection','Reflexión profunda',25,'open','¿Qué pequeño cambio podría hacer una gran diferencia esta semana?');
