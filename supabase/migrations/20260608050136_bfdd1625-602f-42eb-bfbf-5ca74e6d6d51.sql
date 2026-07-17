
INSERT INTO public.introspection_exercises (id, category, name, subtitle, description, intro_text, duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active)
VALUES (
  'know_yourself_003',
  'know_yourself',
  'Mi Brújula Interior',
  'Descubre qué tan alineada está tu vida con quien realmente quieres ser.',
  'Identifica tus valores centrales, evalúa la congruencia con tus decisiones y detecta áreas de desconexión personal.',
  E'Hay momentos en la vida donde no estamos perdidos…\n\nsolo desconectados de nosotros mismos.\n\nCuando nuestras decisiones no reflejan lo que realmente valoramos, aparece una sensación extraña: vacío, confusión o cansancio.\n\nHoy vamos a revisar algo importante:\n\n¿Tu vida está apuntando hacia el lugar correcto?',
  10, 14, 'Intermedio', 'Assessment + reflexión profunda',
  '#06b6d4', '#0ea5e9', '🧭', true, 3, true
) ON CONFLICT (id) DO UPDATE SET
  subtitle = EXCLUDED.subtitle, description = EXCLUDED.description, intro_text = EXCLUDED.intro_text,
  emoji = EXCLUDED.emoji, color_from = EXCLUDED.color_from, color_to = EXCLUDED.color_to,
  duration_min = EXCLUDED.duration_min, duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order;

DELETE FROM public.introspection_questions WHERE exercise_id = 'know_yourself_003';

DO $$
DECLARE
  values_list jsonb := '["Libertad","Amor","Familia","Salud","Paz","Crecimiento","Dinero","Éxito","Espiritualidad","Aventura","Seguridad","Creatividad","Honestidad","Integridad","Aprendizaje","Liderazgo","Contribución","Independencia","Reconocimiento","Diversión","Disciplina","Amistad","Justicia","Estabilidad","Impacto","Belleza","Pasión","Innovación","Sabiduría","Servicio","Balance"]'::jsonb;
  i int; ord text; b int;
BEGIN
  INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
  (gen_random_uuid(),'know_yourself_003','values','Valores Centrales',1,'multi','Selecciona los 10 valores más importantes para ti.',
    jsonb_build_object('choices', values_list, 'min', 10, 'max', 10), jsonb_build_object('kind','values_top10')),
  (gen_random_uuid(),'know_yourself_003','values','Valores Centrales',2,'multi','Ahora elige tus 5 esenciales.',
    jsonb_build_object('choices', values_list, 'min', 5, 'max', 5), jsonb_build_object('kind','values_top5')),
  (gen_random_uuid(),'know_yourself_003','values','Valores Centrales',3,'multi','Ahora selecciona los 3 que realmente guían tu vida.',
    jsonb_build_object('choices', values_list, 'min', 3, 'max', 3), jsonb_build_object('kind','values_top3'));

  FOR i IN 1..3 LOOP
    ord := CASE i WHEN 1 THEN 'PRIMER' WHEN 2 THEN 'SEGUNDO' ELSE 'TERCER' END;
    b := 10 + (i-1)*10;
    INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
    (gen_random_uuid(),'know_yourself_003','alignment','Alineación Personal', b+1, 'scale',
      'Para tu ' || ord || ' valor central: ¿Qué tan presente está hoy en tu vida?',
      jsonb_build_object('min',1,'max',5),
      jsonb_build_object('scale_kind','alignment','value_slot', i,'min_label','Nada presente','max_label','Muy presente')),
    (gen_random_uuid(),'know_yourself_003','alignment','Alineación Personal', b+2, 'scale',
      'Para tu ' || ord || ' valor: ¿Qué tan alineadas están tus decisiones con este valor?',
      jsonb_build_object('min',1,'max',5),
      jsonb_build_object('scale_kind','alignment','value_slot', i,'min_label','Nada alineadas','max_label','Totalmente alineadas')),
    (gen_random_uuid(),'know_yourself_003','alignment','Alineación Personal', b+3, 'scale',
      'Para tu ' || ord || ' valor: ¿Qué tanto estás sacrificando este valor actualmente?',
      jsonb_build_object('min',1,'max',5),
      jsonb_build_object('scale_kind','disconnection','value_slot', i,'min_label','No lo sacrifico','max_label','Lo sacrifico mucho')),
    (gen_random_uuid(),'know_yourself_003','alignment','Alineación Personal', b+4, 'open',
      'Para tu ' || ord || ' valor: ¿Qué situación reciente refleja este valor?',
      NULL, jsonb_build_object('value_slot', i,'kind','value_evidence'));
  END LOOP;
END $$;

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
(gen_random_uuid(),'know_yourself_003','signals','Señales de Desalineación',50,'scale','Últimamente siento que estoy viviendo en automático.',jsonb_build_object('min',1,'max',5),jsonb_build_object('scale_kind','disconnection','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_003','signals','Señales de Desalineación',51,'scale','Tomo decisiones que realmente no me representan.',jsonb_build_object('min',1,'max',5),jsonb_build_object('scale_kind','disconnection','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_003','signals','Señales de Desalineación',52,'scale','Estoy haciendo cosas solo por presión externa.',jsonb_build_object('min',1,'max',5),jsonb_build_object('scale_kind','disconnection','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_003','signals','Señales de Desalineación',53,'scale','Me siento desconectado de quien quiero ser.',jsonb_build_object('min',1,'max',5),jsonb_build_object('scale_kind','disconnection','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_003','signals','Señales de Desalineación',54,'scale','Siento que estoy construyendo la vida que quiero.',jsonb_build_object('min',1,'max',5),jsonb_build_object('scale_kind','alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_003','signals','Señales de Desalineación',55,'scale','Mis decisiones recientes me hacen sentir orgulloso.',jsonb_build_object('min',1,'max',5),jsonb_build_object('scale_kind','alignment','min_label','Para nada','max_label','Totalmente')),
(gen_random_uuid(),'know_yourself_003','truth','Momento de Verdad',60,'open','¿Qué parte de tu vida se siente más alineada contigo?',NULL,NULL),
(gen_random_uuid(),'know_yourself_003','truth','Momento de Verdad',61,'open','¿Qué parte se siente más desconectada?',NULL,NULL),
(gen_random_uuid(),'know_yourself_003','truth','Momento de Verdad',62,'open','¿Qué decisión has evitado tomar por miedo?',NULL,NULL),
(gen_random_uuid(),'know_yourself_003','truth','Momento de Verdad',63,'open','¿Qué sabes que necesitas cambiar, aunque incomode?',NULL,NULL),
(gen_random_uuid(),'know_yourself_003','truth','Momento de Verdad',64,'open','Si vivieras más fiel a tus valores, ¿qué sería diferente?',NULL,NULL),
(gen_random_uuid(),'know_yourself_003','north','Tu Norte',70,'open','Completa: "Quiero empezar a ser alguien que…"',NULL,jsonb_build_object('kind','fill_in_blank')),
(gen_random_uuid(),'know_yourself_003','north','Tu Norte',71,'open','Completa: "Necesito dejar de…"',NULL,jsonb_build_object('kind','fill_in_blank')),
(gen_random_uuid(),'know_yourself_003','north','Tu Norte',72,'open','Completa: "Quiero recordar que…"',NULL,jsonb_build_object('kind','fill_in_blank')),
(gen_random_uuid(),'know_yourself_003','north','Tu Norte',73,'open','Completa: "Mi siguiente paso importante es…"',NULL,jsonb_build_object('kind','fill_in_blank'));
