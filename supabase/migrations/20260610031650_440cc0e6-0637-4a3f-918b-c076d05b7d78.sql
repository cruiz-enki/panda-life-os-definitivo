
INSERT INTO public.introspection_exercises (
  id, category, name, subtitle, description, intro_text,
  duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active
) VALUES (
  'inner_boundaries_004', 'inner_boundaries', 'Mi Culpa al Elegirme',
  '¿Por qué a veces se siente tan difícil priorizarte?',
  'Identifica la culpa asociada al autocuidado, patrones de complacencia y creencias que dificultan priorizar tu bienestar.',
  E'Decir no.\nPedir espacio.\nDescansar.\nPriorizarte.\nNo responder de inmediato.\nNo resolver problemas ajenos.\n\nA veces no es que no podamos hacerlo… es que aparece culpa.\nComo si cuidarnos estuviera mal.\n\nHoy vamos a mirar algo importante: ¿qué pasa dentro de ti cuando te eliges?',
  10, 16, 'Intermedio–Profundo', 'Assessment + introspección emocional + reframe personal',
  '#6b1f3a', '#e8c7c7', '🍇', false, 19, true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
  intro_text = EXCLUDED.intro_text, duration_min = EXCLUDED.duration_min, duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level, type = EXCLUDED.type, color_from = EXCLUDED.color_from,
  color_to = EXCLUDED.color_to, emoji = EXCLUDED.emoji, sort_order = EXCLUDED.sort_order, active = true;

DELETE FROM public.introspection_questions WHERE exercise_id = 'inner_boundaries_004';

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
('ib4_b1_q1', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 10, 'scale', 'Me siento culpable cuando digo no.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib4_b1_q2', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 20, 'scale', 'Me cuesta descansar sin sentir presión.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib4_b1_q3', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 30, 'scale', 'Siento responsabilidad por las emociones ajenas.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib4_b1_q4', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 40, 'scale', 'Me cuesta priorizarme.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib4_b1_q5', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 50, 'scale', 'Siento que debo estar disponible.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib4_b1_q6', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 60, 'scale', 'Pedir lo que necesito me incomoda.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib4_b1_q7', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 70, 'scale', 'Puedo priorizarme sin culpa.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho","reversed":true}'::jsonb),
('ib4_b1_q8', 'inner_boundaries_004', 'guilt_relation', 'Tu relación con la culpa', 80, 'scale', 'Mi bienestar también importa.', NULL, '{"scale_kind":"self_choice_guilt","min_label":"Nada","max_label":"Mucho","reversed":true}'::jsonb),
('ib4_b2_q1', 'inner_boundaries_004', 'guilt_moments', 'Momentos de culpa', 110, 'multi', '¿En qué situaciones aparece más culpa?',
 '{"choices":["Decir no","Descansar","Gastar dinero en mí","Poner límites","No responder rápido","Pedir ayuda","Cancelar planes","Elegir mi tiempo","Priorizar mi salud","Tomar distancia","No resolver problemas ajenos","Hablar de mis necesidades","Quedar mal","No estar disponible","Pensar en mí"],"max":5}'::jsonb,
 '{"kind":"guilt_moments","context_label":"Selecciona hasta 5"}'::jsonb),
('ib4_b2_q2', 'inner_boundaries_004', 'guilt_moments', 'Momentos de culpa', 120, 'open', '¿Cuándo fue la última vez que te sentiste culpable por elegirte?', NULL, '{"kind":"last_guilt_moment"}'::jsonb),
('ib4_b3_q1', 'inner_boundaries_004', 'origin', 'El origen', 210, 'open', '¿Qué aprendiste sobre pensar en ti?', NULL, '{"kind":"learned_thinking_self"}'::jsonb),
('ib4_b3_q2', 'inner_boundaries_004', 'origin', 'El origen', 220, 'open', '¿Qué te enseñaron sobre poner límites?', NULL, '{"kind":"learned_boundaries"}'::jsonb),
('ib4_b3_q3', 'inner_boundaries_004', 'origin', 'El origen', 230, 'open', '¿Qué frase escuchabas sobre ser "buena persona"?', NULL, '{"kind":"good_person_phrase"}'::jsonb),
('ib4_b3_q4', 'inner_boundaries_004', 'origin', 'El origen', 240, 'open', '¿Qué miedo aparece cuando te eliges?', NULL, '{"kind":"choosing_self_fear"}'::jsonb),
('ib4_b3_q5', 'inner_boundaries_004', 'origin', 'El origen', 250, 'open', '¿Qué crees que podría pasar si priorizas más tu bienestar?', NULL, '{"kind":"prioritizing_consequence"}'::jsonb),
('ib4_b4_q1', 'inner_boundaries_004', 'pleasing_pattern', 'Tu patrón de complacencia', 310, 'multi', 'Cuando alguien necesita algo de ti normalmente…',
 '{"choices":["Digo sí aunque no quiera","Me siento obligado","Ayudo aunque me afecte","Sobreexplico","Me justifico","Me siento mala persona","Me enojo conmigo","Lo hago por evitar conflicto","Me cuesta decir no","Lo hago automáticamente"]}'::jsonb,
 '{"kind":"pleasing_reactions","context_label":"Selecciona todas las que apliquen"}'::jsonb),
('ib4_b4_q2', 'inner_boundaries_004', 'pleasing_pattern', 'Tu patrón de complacencia', 320, 'multi', '¿Qué emoción aparece cuando piensas en decepcionar a alguien?',
 '{"choices":["Culpa","Miedo","Ansiedad","Tristeza","Vergüenza","Incomodidad"]}'::jsonb,
 '{"kind":"disappointment_emotions"}'::jsonb),
('ib4_b5_q1', 'inner_boundaries_004', 'reframe', 'Reencuadrando', 410, 'open', 'Elegirme no significa…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib4_b5_q2', 'inner_boundaries_004', 'reframe', 'Reencuadrando', 420, 'open', 'También merezco…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib4_b5_q3', 'inner_boundaries_004', 'reframe', 'Reencuadrando', 430, 'open', 'Puedo cuidar de otros sin…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib4_b5_q4', 'inner_boundaries_004', 'reframe', 'Reencuadrando', 440, 'open', 'No tengo que…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib4_b5_q5', 'inner_boundaries_004', 'reframe', 'Reencuadrando', 450, 'open', 'Mi bienestar importa incluso cuando…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib4_b6_q1', 'inner_boundaries_004', 'self_choice', 'Tu acto de elección', 510, 'open', '¿Qué acto pequeño de autocuidado has estado postergando?', NULL, '{"kind":"postponed_selfcare"}'::jsonb),
('ib4_b6_q2', 'inner_boundaries_004', 'self_choice', 'Tu acto de elección', 520, 'open', '¿Qué te gustaría permitirte esta semana?', NULL, '{"kind":"weekly_permission"}'::jsonb),
('ib4_b6_q3', 'inner_boundaries_004', 'self_choice', 'Tu acto de elección', 530, 'open', '¿Qué frase necesitas recordar?', NULL, '{"kind":"phrase_to_remember","context_label":"Ej: No soy egoísta por poner límites."}'::jsonb);
