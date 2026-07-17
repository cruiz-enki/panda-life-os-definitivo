
INSERT INTO public.introspection_exercises (
  id, category, name, subtitle, description, intro_text,
  duration_min, duration_max, level, type,
  color_from, color_to, emoji, premium, sort_order, active
) VALUES (
  'know_yourself_006', 'know_yourself',
  'Mi Espejo Honesto',
  'La diferencia entre cómo te ves y cómo te experimenta el mundo.',
  'Aumenta tu autoconciencia sin juicio: cómo te ves, cómo crees que te ven y cómo te experimentan los demás.',
  E'Todos tenemos puntos ciegos.\n\nHay una versión de ti que tú conoces.\nOtra que muestras al mundo.\nY otra que las personas experimentan cuando están contigo.\n\nNo se trata de descubrir si eres ''bueno'' o ''malo''.\n\nSe trata de mirarte con honestidad.',
  12, 16, 'Intermedio–Profundo', 'Assessment + journaling profundo',
  '#94a3b8', '#475569', '🪞', true, 60, true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description, intro_text = EXCLUDED.intro_text,
  duration_min = EXCLUDED.duration_min, duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level, type = EXCLUDED.type,
  color_from = EXCLUDED.color_from, color_to = EXCLUDED.color_to,
  emoji = EXCLUDED.emoji, sort_order = EXCLUDED.sort_order;

DELETE FROM public.introspection_questions WHERE exercise_id = 'know_yourself_006';

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',1,'scale','Soy una persona auténtica.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',2,'scale','Sé escuchar a otros.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',3,'scale','Soy emocionalmente estable.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',4,'scale','Confío en mí.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',5,'scale','Sé poner límites.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',6,'scale','Soy amable conmigo mismo.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',7,'scale','Me comunico con claridad.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',8,'scale','Soy disciplinado.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',9,'scale','Las personas pueden confiar en mí.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b1_self_view','Cómo te ves',10,'scale','Me siento orgulloso de quien soy.', NULL, '{"scale_kind":"self_image","min_label":"Nada cierto","max_label":"Totalmente cierto"}'::jsonb),

(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',11,'scale','Seguro de sí mismo', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',12,'scale','Confiable', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',13,'scale','Compasivo', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',14,'scale','Disponible emocionalmente', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',15,'scale','Líder', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',16,'scale','Frío o distante', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","reversed":true,"context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',17,'scale','Ansioso', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","reversed":true,"context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',18,'scale','Controlador', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","reversed":true,"context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',19,'scale','Inspirador', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',20,'scale','Difícil de entender', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","reversed":true,"context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',21,'scale','Auténtico', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',22,'scale','Alegre', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',23,'scale','Exigente', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","reversed":true,"context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',24,'scale','Paciente', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b2_perceived','Cómo crees que te ven',25,'scale','Empático', NULL, '{"scale_kind":"perceived_authenticity","min_label":"Nada","max_label":"Mucho","context_label":"cómo te ven"}'::jsonb),

(gen_random_uuid(),'know_yourself_006','b3_persona','Tu personaje social',26,'open','¿Qué versión de ti muestras más frecuentemente?', NULL, '{"kind":"persona"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b3_persona','Tu personaje social',27,'open','¿Qué parte de ti escondes?', NULL, '{"kind":"hidden"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b3_persona','Tu personaje social',28,'open','¿Qué emoción ocultas más?', NULL, '{"kind":"hidden_emotion"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b3_persona','Tu personaje social',29,'open','¿Qué temes que otros descubran de ti?', NULL, '{"kind":"fear"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b3_persona','Tu personaje social',30,'open','¿Qué malinterpretan las personas sobre ti?', NULL, '{"kind":"misunderstood"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b3_persona','Tu personaje social',31,'open','¿Qué parte de ti quisieras que vieran más?', NULL, '{"kind":"wanted_visible"}'::jsonb),

(gen_random_uuid(),'know_yourself_006','b4_shadow','Tu sombra ligera',32,'multi','¿Qué partes de ti te cuesta aceptar?',
 '{"choices":["Mi inseguridad","Mi enojo","Mi necesidad de aprobación","Mi miedo","Mi ego","Mi tristeza","Mi sensibilidad","Mi impulsividad","Mi control","Mi perfeccionismo","Mi ansiedad","Mi vulnerabilidad"],"min":1,"max":12}'::jsonb,
 '{"kind":"shadow_parts"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b4_shadow','Tu sombra ligera',33,'open','¿Qué te gustaría reconciliar contigo?', NULL, '{"kind":"reconcile"}'::jsonb),

(gen_random_uuid(),'know_yourself_006','b5_compassion','Mirada compasiva',34,'open','¿Qué crees que has hecho mejor de lo que te reconoces?', NULL, '{"kind":"underrated_wins"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b5_compassion','Mirada compasiva',35,'open','¿Qué te gustaría perdonarte?', NULL, '{"kind":"forgive"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b5_compassion','Mirada compasiva',36,'open','¿Qué te diría alguien que realmente te ama?', NULL, '{"kind":"loving_voice"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b5_compassion','Mirada compasiva',37,'open','¿Qué necesitas escuchar hoy?', NULL, '{"kind":"need_to_hear"}'::jsonb),
(gen_random_uuid(),'know_yourself_006','b5_compassion','Mirada compasiva',38,'open','¿Qué parte de ti merece más amor?', NULL, '{"kind":"deserves_love"}'::jsonb);
