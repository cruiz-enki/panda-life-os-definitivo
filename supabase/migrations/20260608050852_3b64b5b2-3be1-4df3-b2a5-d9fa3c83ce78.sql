
INSERT INTO public.introspection_exercises (id, category, name, subtitle, description, intro_text, duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active)
VALUES (
  'know_yourself_004',
  'know_yourself',
  'Mi Yo del Futuro',
  'Conecta con la versión de ti que estás construyendo.',
  'Visualiza tu yo futuro, mide la distancia con tu presente y descubre el primer paso para acercarte.',
  E'Imagina por un momento que han pasado algunos años…\n\ny la vida empezó a acomodarse.\n\nNo porque todo fuera perfecto.\n\nSino porque empezaste a tomar decisiones más alineadas contigo.\n\nTu versión futura ya existe en potencia.\n\nLa pregunta es:\n\n¿La estás construyendo o alejándote de ella?',
  12, 18, 'Intermedio', 'Visualización + journaling + assessment',
  '#a78bfa', '#7c3aed', '🌅', true, 4, true
) ON CONFLICT (id) DO UPDATE SET
  subtitle = EXCLUDED.subtitle, description = EXCLUDED.description, intro_text = EXCLUDED.intro_text,
  emoji = EXCLUDED.emoji, color_from = EXCLUDED.color_from, color_to = EXCLUDED.color_to,
  duration_min = EXCLUDED.duration_min, duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order;

DELETE FROM public.introspection_questions WHERE exercise_id = 'know_yourself_004';

-- Block 1: viaje guiado (una pregunta-mensaje contemplativa antes de visualizar)
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, meta) VALUES
(gen_random_uuid(),'know_yourself_004','journey','Viaje al Futuro',1,'open',
 E'Cierra los ojos por unos segundos.\n\nImagina que han pasado 5 años. Despiertas un día normal, pero algo se siente diferente: más en paz, más fuerte, más tú.\n\n¿Qué es lo primero que notas al imaginarte así?',
 jsonb_build_object('kind','guided'));

-- Block 2: Visualiza tu futuro (10 abiertas)
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, meta) VALUES
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',10,'open','¿Cómo eres en esa versión futura?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',11,'open','¿Cómo te sientes emocionalmente?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',12,'open','¿Qué hábitos tiene esa versión de ti?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',13,'open','¿Cómo son tus relaciones?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',14,'open','¿En qué trabajas o qué haces?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',15,'open','¿Qué cosas ya dejaste atrás?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',16,'open','¿Qué aprendiste a soltar?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',17,'open','¿Qué te hace sentir orgulloso?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',18,'open','¿Qué ya no toleras?', jsonb_build_object('kind','vision')),
(gen_random_uuid(),'know_yourself_004','vision','Visualiza tu Futuro',19,'open','¿Qué frase describiría a tu yo futuro?', jsonb_build_object('kind','vision_phrase'));

-- Block 3: Distancia (7 escalas, 6 y 7 invertidas)
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',20,'scale','Siento que voy en dirección a esa versión.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',21,'scale','Mis hábitos actuales me acercan a esa vida.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',22,'scale','Estoy tomando decisiones alineadas.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',23,'scale','Mi entorno impulsa mi crecimiento.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',24,'scale','Estoy siendo la persona que quiero llegar a ser.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',25,'scale','Estoy posponiendo cambios importantes.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','reversed', true,'min_label','Para nada','max_label','Constantemente')),
(gen_random_uuid(),'know_yourself_004','distance','Distancia Presente-Futuro',26,'scale','El miedo influye demasiado en mis decisiones.', jsonb_build_object('min',1,'max',5), jsonb_build_object('scale_kind','future_alignment','reversed', true,'min_label','Para nada','max_label','Constantemente'));

-- Block 4: Carta del futuro
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, meta) VALUES
(gen_random_uuid(),'know_yourself_004','letter','Carta del Futuro',30,'open',
 E'Escribe una carta desde tu yo futuro hacia tu yo actual.\n\nIncluye: qué aprendiste, qué valió la pena, qué errores dejaron enseñanza, qué dejaste de temer y qué necesitas recordar hoy.\n\nNo te limites: deja que fluya.',
 jsonb_build_object('kind','future_letter'));

-- Block 5: El primer paso (5 abiertas)
INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, meta) VALUES
(gen_random_uuid(),'know_yourself_004','first_step','El Primer Paso',40,'open','¿Qué parte de tu vida necesita cambiar primero?', jsonb_build_object('kind','first_step')),
(gen_random_uuid(),'know_yourself_004','first_step','El Primer Paso',41,'open','¿Qué hábito pequeño podría acercarte a esa versión?', jsonb_build_object('kind','first_step')),
(gen_random_uuid(),'know_yourself_004','first_step','El Primer Paso',42,'open','¿Qué miedo necesitas dejar de alimentar?', jsonb_build_object('kind','first_step')),
(gen_random_uuid(),'know_yourself_004','first_step','El Primer Paso',43,'open','¿Qué decisión has estado evitando?', jsonb_build_object('kind','first_step')),
(gen_random_uuid(),'know_yourself_004','first_step','El Primer Paso',44,'open','¿Qué puedes empezar en las próximas 24 horas?', jsonb_build_object('kind','first_step'));
