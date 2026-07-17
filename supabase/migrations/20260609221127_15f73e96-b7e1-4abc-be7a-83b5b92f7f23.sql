INSERT INTO public.introspection_exercises (
  id, category, name, subtitle, description, intro_text,
  duration_min, duration_max, level, type,
  color_from, color_to, emoji, premium, sort_order, active
) VALUES (
  'inner_boundaries_001','inner_boundaries','Mi Relación con el "No"',
  'Descubre qué tan sanos son tus límites personales.',
  'Assessment + autoconocimiento + reflexión guiada sobre límites, culpa, complacencia y sobrecarga emocional.',
  E'Decir que sí cuando querías decir no… también cansa.\nAceptar cosas que no querías.\nCallarte para evitar conflicto.\nCargar emociones ajenas.\nExplicarte demasiado.\nSentirte culpable por elegirte.\n\nA veces el agotamiento no viene de trabajar mucho… viene de no poner límites.\n\nHoy vamos a observar cómo está tu relación con el "no".',
  10, 14, 'Inicial–Intermedio', 'Assessment + autoconocimiento + reflexión guiada',
  '#7c2d3a', '#e9b8a6', '🌿', false, 200, true
) ON CONFLICT (id) DO UPDATE SET
  category=EXCLUDED.category, name=EXCLUDED.name, subtitle=EXCLUDED.subtitle, description=EXCLUDED.description,
  intro_text=EXCLUDED.intro_text, duration_min=EXCLUDED.duration_min, duration_max=EXCLUDED.duration_max,
  level=EXCLUDED.level, type=EXCLUDED.type, color_from=EXCLUDED.color_from, color_to=EXCLUDED.color_to,
  emoji=EXCLUDED.emoji, premium=EXCLUDED.premium, sort_order=EXCLUDED.sort_order, active=EXCLUDED.active;

DELETE FROM public.introspection_questions WHERE exercise_id = 'inner_boundaries_001';

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
('ib1_b1_q1','inner_boundaries_001','relation','Tu relación con los límites',10,'scale','Me cuesta decir que no.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","reversed":true,"min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib1_b1_q2','inner_boundaries_001','relation','Tu relación con los límites',20,'scale','Acepto cosas por culpa.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","reversed":true,"min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib1_b1_q3','inner_boundaries_001','relation','Tu relación con los límites',30,'scale','Me preocupo demasiado por decepcionar a otros.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","reversed":true,"min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib1_b1_q4','inner_boundaries_001','relation','Tu relación con los límites',40,'scale','Suelo priorizar necesidades ajenas antes que las mías.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","reversed":true,"min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib1_b1_q5','inner_boundaries_001','relation','Tu relación con los límites',50,'scale','Me siento responsable de cómo se sienten otros.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","reversed":true,"min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib1_b1_q6','inner_boundaries_001','relation','Tu relación con los límites',60,'scale','Me cuesta pedir lo que necesito.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","reversed":true,"min_label":"Nada","max_label":"Mucho"}'::jsonb),
('ib1_b1_q7','inner_boundaries_001','relation','Tu relación con los límites',70,'scale','Pongo límites con claridad.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","min_label":"Nunca","max_label":"Siempre"}'::jsonb),
('ib1_b1_q8','inner_boundaries_001','relation','Tu relación con los límites',80,'scale','Puedo elegir mi bienestar sin culpa.','{"min":1,"max":5}'::jsonb,'{"scale_kind":"boundaries","min_label":"Nunca","max_label":"Siempre"}'::jsonb),
('ib1_b2_q1','inner_boundaries_001','areas','¿Dónde más te cuesta?',90,'multi','¿En qué área te cuesta más poner límites?','{"choices":["Pareja","Familia","Trabajo","Amigos","Clientes","Dinero","Tiempo personal","Redes sociales","Favoritismos","Disponibilidad constante","Emociones ajenas"]}'::jsonb,'{"kind":"boundary_areas","context_label":"máximo 3"}'::jsonb),
('ib1_b2_q2','inner_boundaries_001','areas','¿Dónde más te cuesta?',100,'open','¿Qué situación te desgasta más actualmente?',NULL,'{"kind":"draining_situation"}'::jsonb),
('ib1_b3_q1','inner_boundaries_001','pattern','Tu patrón de límites',110,'multi','Cuando algo te incomoda normalmente… ¿qué haces?','{"choices":["Me callo","Evito conflicto","Aguanto","Me adapto","Exploto después","Me alejo","Lo hablo","Me siento culpable","Me justifico demasiado","Me enojo conmigo"]}'::jsonb,'{"kind":"boundary_reactions"}'::jsonb),
('ib1_b3_q2','inner_boundaries_001','pattern','Tu patrón de límites',120,'multi','¿Qué miedo aparece al poner límites?','{"choices":["Rechazo","Conflicto","Lastimar a alguien","Parecer egoísta","Quedar mal","Perder relación","Decepcionar","No gustar","Estar solo","No sé"]}'::jsonb,'{"kind":"boundary_fears"}'::jsonb),
('ib1_b4_q1','inner_boundaries_001','cost','El costo de no poner límites',130,'open','¿Qué has tolerado demasiado tiempo?',NULL,'{"kind":"tolerated_too_long"}'::jsonb),
('ib1_b4_q2','inner_boundaries_001','cost','El costo de no poner límites',140,'open','¿Qué parte de ti se ha cansado?',NULL,'{"kind":"exhausted_part"}'::jsonb),
('ib1_b4_q3','inner_boundaries_001','cost','El costo de no poner límites',150,'open','¿Qué emoción aparece cuando no te priorizas?',NULL,'{"kind":"emotion_when_not_priority"}'::jsonb),
('ib1_b4_q4','inner_boundaries_001','cost','El costo de no poner límites',160,'open','¿Qué te ha costado no decir lo que realmente necesitabas?',NULL,'{"kind":"cost_of_silence"}'::jsonb),
('ib1_b4_q5','inner_boundaries_001','cost','El costo de no poner límites',170,'open','¿Qué situación necesitas empezar a cambiar?',NULL,'{"kind":"situation_to_change"}'::jsonb),
('ib1_b5_q1','inner_boundaries_001','voice','Tu voz interior',180,'open','Me gustaría aprender a decir no cuando…',NULL,'{"kind":"fill_in_blank","context_label":"Me gustaría aprender a decir no cuando…"}'::jsonb),
('ib1_b5_q2','inner_boundaries_001','voice','Tu voz interior',190,'open','Necesito dejar de…',NULL,'{"kind":"fill_in_blank","context_label":"Necesito dejar de…"}'::jsonb),
('ib1_b5_q3','inner_boundaries_001','voice','Tu voz interior',200,'open','Poner límites para mí significa…',NULL,'{"kind":"fill_in_blank","context_label":"Poner límites para mí significa…"}'::jsonb),
('ib1_b5_q4','inner_boundaries_001','voice','Tu voz interior',210,'open','Una verdad incómoda que necesito aceptar es…',NULL,'{"kind":"fill_in_blank","context_label":"Una verdad incómoda que necesito aceptar es…"}'::jsonb),
('ib1_b6_q1','inner_boundaries_001','first_limit','Tu primer límite',220,'multi','¿Qué límite pequeño podrías empezar esta semana?','{"choices":["Responder después","No justificarme tanto","Pedir espacio","Decir no a algo pequeño","Dejar de resolver todo","Respetar mi tiempo"]}'::jsonb,'{"kind":"small_limit"}'::jsonb),
('ib1_b6_q2','inner_boundaries_001','first_limit','Tu primer límite',230,'multi','¿Qué frase te ayudaría?','{"choices":["No tengo que explicarme demasiado.","También puedo elegirme.","Decir no no me hace malo.","Hoy no puedo comprometerme con eso.","Necesito pensarlo antes de responder.","No me siento cómodo con esto."]}'::jsonb,'{"kind":"helpful_phrase"}'::jsonb);
