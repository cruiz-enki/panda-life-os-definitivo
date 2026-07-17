
INSERT INTO public.introspection_exercises
(id, category, name, subtitle, description, intro_text, duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active)
VALUES (
  'know_yourself_005',
  'know_yourself',
  'Las Historias Que Me Cuento',
  'Descubre las narrativas internas que están guiando tu vida… sin darte cuenta.',
  'Identifica las historias internas, creencias limitantes y patrones de autosabotaje que afectan tus decisiones.',
  E'Todos tenemos historias dentro de nuestra mente.\n\nAlgunas nos impulsan.\nOtras nos frenan.\n\nA veces ni siquiera nos damos cuenta de cuánto poder tienen sobre nuestras decisiones.\n\nHistorias como:\n"No soy suficiente."\n"Siempre me abandonan."\n"Tengo que poder solo."\n"Ya es demasiado tarde."\n\nHoy no vamos a juzgarlas.\nSolo vamos a observarlas.',
  12, 18,
  'Intermedio–Profundo',
  'Reflexión guiada + assessment + journaling',
  '#7c3aed', '#db2777',
  '📖',
  true, 5, true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  intro_text = EXCLUDED.intro_text,
  duration_min = EXCLUDED.duration_min,
  duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level,
  type = EXCLUDED.type,
  color_from = EXCLUDED.color_from,
  color_to = EXCLUDED.color_to,
  emoji = EXCLUDED.emoji,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.introspection_questions WHERE exercise_id = 'know_yourself_005';

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',1,'open','¿Qué frase te dices cuando algo sale mal?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',2,'open','¿Qué pensamiento aparece cuando dudas de ti?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',3,'open','¿Qué historia repites sobre tu vida?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',4,'open','¿Qué crees que otros piensan de ti?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',5,'open','¿Qué frase escuchabas mucho mientras crecías?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',6,'open','¿Qué miedo aparece con más frecuencia?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b1_dialogo','Tu Diálogo Interno',7,'open','¿Qué parte de ti sientes que necesita demostrar algo?',NULL,NULL),

(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',8,'scale','Siento que debo demostrar mi valor.',NULL,'{"scale_kind":"self_criticism","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',9,'scale','Me cuesta sentirme suficiente.',NULL,'{"scale_kind":"self_criticism","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',10,'scale','Tengo miedo de decepcionar a otros.',NULL,'{"scale_kind":"self_criticism","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',11,'scale','Me exijo demasiado.',NULL,'{"scale_kind":"self_criticism","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',12,'scale','Siento que si fracaso significa algo malo sobre mí.',NULL,'{"scale_kind":"self_criticism","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',13,'scale','Confío en mi capacidad de salir adelante.',NULL,'{"scale_kind":"self_acceptance","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',14,'scale','Creo que merezco cosas buenas.',NULL,'{"scale_kind":"self_acceptance","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b2_creencias','Creencias Invisibles',15,'scale','Puedo equivocarme sin perder valor.',NULL,'{"scale_kind":"self_acceptance","min_label":"Para nada","max_label":"Totalmente"}'::jsonb),

(gen_random_uuid(),'know_yourself_005','b3_narrativa','Detectando Tu Narrativa',16,'multi','¿Cuáles de estas historias resuenan contigo?',
'{"choices":["Tengo que poder solo","Nunca es suficiente","Debo complacer a todos","No soy suficientemente bueno","Siempre algo sale mal","No merezco descansar","Si fallo decepcionaré","Tengo que ser fuerte","No puedo confiar en otros","No soy importante","Siempre termino igual","Tengo que demostrar mi valor","Nadie me entiende","Ya es demasiado tarde","No soy capaz","No puedo cambiar","Soy responsable de todos"],"min":1}'::jsonb,
'{"kind":"limiting_narratives"}'::jsonb),

(gen_random_uuid(),'know_yourself_005','b4_rompiendo','Rompiendo la Historia',17,'open','¿Cuál es la historia que más te limita hoy?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b4_rompiendo','Rompiendo la Historia',18,'open','¿De dónde crees que viene?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b4_rompiendo','Rompiendo la Historia',19,'open','¿Qué evidencia contradice esa historia?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b4_rompiendo','Rompiendo la Historia',20,'open','¿Qué versión más sana podría reemplazarla?',NULL,NULL),
(gen_random_uuid(),'know_yourself_005','b4_rompiendo','Rompiendo la Historia',21,'open','¿Qué cambiaría en tu vida si dejaras de creerla?',NULL,NULL),

(gen_random_uuid(),'know_yourself_005','b5_reescribiendo','Reescribiendo Tu Narrativa',22,'open','Estoy aprendiendo que…',NULL,'{"kind":"fill_in_blank"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b5_reescribiendo','Reescribiendo Tu Narrativa',23,'open','No necesito…',NULL,'{"kind":"fill_in_blank"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b5_reescribiendo','Reescribiendo Tu Narrativa',24,'open','Quiero empezar a creer que…',NULL,'{"kind":"fill_in_blank"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b5_reescribiendo','Reescribiendo Tu Narrativa',25,'open','Mi nueva historia puede ser…',NULL,'{"kind":"fill_in_blank"}'::jsonb),
(gen_random_uuid(),'know_yourself_005','b5_reescribiendo','Reescribiendo Tu Narrativa',26,'open','Hoy decido recordarme…',NULL,'{"kind":"fill_in_blank"}'::jsonb);
