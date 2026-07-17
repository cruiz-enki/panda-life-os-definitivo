
INSERT INTO public.introspection_exercises (
  id, category, name, subtitle, description, intro_text,
  duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active
) VALUES (
  'inner_boundaries_002', 'inner_boundaries', 'Lo Que He Estado Tolerando',
  'A veces no estás cansado… estás agotado de aguantar demasiado.',
  'Identifica situaciones y dinámicas que has normalizado pero están drenando tu bienestar.',
  E'Hay cosas que no duelen de golpe.\nSe acumulan.\nPequeñas incomodidades.\nComentarios.\nSilencios.\nExigencias.\nFalta de reciprocidad.\n\nCosas que dijiste: "No importa." "No es para tanto." "Luego lo resuelvo."\n\nHasta que un día pesa demasiado.\n\nHoy vamos a mirar algo importante: ¿qué has estado tolerando demasiado tiempo?',
  12, 16, 'Intermedio', 'Assessment + journaling profundo + conciencia relacional',
  '#7c2d3a', '#c89b8c', '🍷', false, 17, true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
  intro_text = EXCLUDED.intro_text, duration_min = EXCLUDED.duration_min, duration_max = EXCLUDED.duration_max,
  level = EXCLUDED.level, type = EXCLUDED.type, color_from = EXCLUDED.color_from,
  color_to = EXCLUDED.color_to, emoji = EXCLUDED.emoji, sort_order = EXCLUDED.sort_order, active = true;

DELETE FROM public.introspection_questions WHERE exercise_id = 'inner_boundaries_002';

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
('ib2_b1_q1', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 10, 'scale', 'Últimamente me siento emocionalmente drenado.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q2', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 20, 'scale', 'Hay cosas que me molestan pero no digo.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q3', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 30, 'scale', 'He normalizado situaciones que no me hacen bien.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q4', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 40, 'scale', 'Siento resentimiento acumulado.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q5', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 50, 'scale', 'Me cuesta expresar lo que necesito.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q6', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 60, 'scale', 'Evito conflictos aunque me afecte.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q7', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 70, 'scale', 'Siento que doy más de lo que recibo.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib2_b1_q8', 'inner_boundaries_002', 'tolerance', 'El termómetro de tolerancia', 80, 'scale', 'Me siento escuchado y respetado.', NULL, '{"scale_kind":"tolerance_drain","min_label":"Nada","max_label":"Mucho","reversed":true}'::jsonb),
('ib2_b2_q1', 'inner_boundaries_002', 'normalized', '¿Qué has normalizado?', 110, 'multi', 'He estado tolerando…',
 '{"choices":["Comentarios que me lastiman","Falta de reciprocidad","Personas emocionalmente ausentes","Que no respeten mi tiempo","Trabajo excesivo","Sentirme disponible siempre","Que invaliden mis emociones","Falta de claridad","Promesas incumplidas","Falta de apoyo","Que me hagan sentir culpa","Tener que resolver todo","Falta de reconocimiento","Relaciones confusas","Sentirme usado","Autoabandono","Exceso de responsabilidades","Silencio emocional","No sentirme prioridad"]}'::jsonb,
 '{"kind":"normalized_things","context_label":"Selecciona todas las que apliquen"}'::jsonb),
('ib2_b2_q2', 'inner_boundaries_002', 'normalized', '¿Qué has normalizado?', 120, 'open', '¿Qué te pesa más actualmente?', NULL, '{"kind":"main_weight","context_label":"Una situación, dinámica o vínculo"}'::jsonb),
('ib2_b3_q1', 'inner_boundaries_002', 'cost2', 'El costo invisible', 210, 'open', '¿Qué te ha costado seguir tolerando esto?', NULL, '{"kind":"tolerance_cost"}'::jsonb),
('ib2_b3_q2', 'inner_boundaries_002', 'cost2', 'El costo invisible', 220, 'open', '¿Qué emoción aparece cuando piensas en ello?', NULL, '{"kind":"tolerance_emotion"}'::jsonb),
('ib2_b3_q3', 'inner_boundaries_002', 'cost2', 'El costo invisible', 230, 'open', '¿Qué parte de ti se ha ido cansando?', NULL, '{"kind":"tolerance_tired_part"}'::jsonb),
('ib2_b3_q4', 'inner_boundaries_002', 'cost2', 'El costo invisible', 240, 'open', '¿Qué has dejado de pedir o esperar?', NULL, '{"kind":"tolerance_stopped_asking"}'::jsonb),
('ib2_b3_q5', 'inner_boundaries_002', 'cost2', 'El costo invisible', 250, 'open', '¿Qué te da miedo perder si cambias esto?', NULL, '{"kind":"tolerance_change_fear"}'::jsonb),
('ib2_b4_q1', 'inner_boundaries_002', 'rel_pattern', 'Tu patrón relacional', 310, 'multi', 'Cuando algo te duele, normalmente…',
 '{"choices":["Me callo","Aguanto","Me adapto","Sobreexplico","Me alejo","Exploto después","Minimizo","Me culpo","Espero que cambie solo","Hablo de ello","Me resigno"]}'::jsonb,
 '{"kind":"tolerance_reactions","context_label":"Selecciona todas las que apliquen"}'::jsonb),
('ib2_b4_q2', 'inner_boundaries_002', 'rel_pattern', 'Tu patrón relacional', 320, 'multi', '¿Qué miedo hay detrás?',
 '{"choices":["Conflicto","Rechazo","Soledad","Decepcionar","Quedar mal","Ser egoísta","Perder la relación","No ser querido","Incomodar","No sé"]}'::jsonb,
 '{"kind":"tolerance_fears"}'::jsonb),
('ib2_b5_q1', 'inner_boundaries_002', 'invisible_limit', 'Tu límite invisible', 410, 'open', '¿Qué ya no quieres seguir tolerando?', NULL, '{"kind":"stop_tolerating"}'::jsonb),
('ib2_b5_q2', 'inner_boundaries_002', 'invisible_limit', 'Tu límite invisible', 420, 'open', '¿Qué conversación has estado evitando?', NULL, '{"kind":"avoided_conversation"}'::jsonb),
('ib2_b5_q3', 'inner_boundaries_002', 'invisible_limit', 'Tu límite invisible', 430, 'open', '¿Qué parte de ti necesita defenderse más?', NULL, '{"kind":"part_to_defend"}'::jsonb),
('ib2_b5_q4', 'inner_boundaries_002', 'invisible_limit', 'Tu límite invisible', 440, 'open', '¿Qué cambiaría si empezaras a priorizarte?', NULL, '{"kind":"prioritize_change"}'::jsonb),
('ib2_b5_q5', 'inner_boundaries_002', 'invisible_limit', 'Tu límite invisible', 450, 'open', '¿Qué verdad incómoda necesitas aceptar?', NULL, '{"kind":"uncomfortable_truth"}'::jsonb),
('ib2_b6_q1', 'inner_boundaries_002', 'self_respect', 'Tu acto de autorrespeto', 510, 'open', 'Merezco dejar de…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib2_b6_q2', 'inner_boundaries_002', 'self_respect', 'Tu acto de autorrespeto', 520, 'open', 'Necesito empezar a…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib2_b6_q3', 'inner_boundaries_002', 'self_respect', 'Tu acto de autorrespeto', 530, 'open', 'Mi bienestar también importa cuando…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib2_b6_q4', 'inner_boundaries_002', 'self_respect', 'Tu acto de autorrespeto', 540, 'open', 'Mi próximo pequeño límite será…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb),
('ib2_b6_q5', 'inner_boundaries_002', 'self_respect', 'Tu acto de autorrespeto', 550, 'open', 'Hoy quiero recordarme…', NULL, '{"kind":"fill_in_blank","context_label":"Completa la frase"}'::jsonb);
