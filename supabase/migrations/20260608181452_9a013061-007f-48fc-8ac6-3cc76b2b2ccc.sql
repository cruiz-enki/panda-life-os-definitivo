
INSERT INTO public.introspection_exercises (
  id, category, name, subtitle, description, intro_text,
  duration_min, duration_max, level, type, color_from, color_to, emoji, premium, sort_order, active
) VALUES (
  'emotional_mastery_001',
  'emotional_mastery',
  'Termómetro Emocional',
  'Descubre lo que realmente estás sintiendo hoy.',
  'Check-in emocional diario: identifica tu emoción, su intensidad, qué la detonó, cómo respondiste y qué necesitas.',
  E'No siempre necesitamos arreglar algo.\n\nA veces solo necesitamos detenernos un momento y preguntarnos:\n\n¿Cómo estoy realmente?\n\nNombrar una emoción puede cambiar por completo la forma en que la vivimos.\n\nHoy vamos a escucharte un poco.',
  3, 7, 'Inicial', 'Check-in emocional',
  '#60a5fa', '#a78bfa', '🌡️', false, 1, true
);

INSERT INTO public.introspection_questions (id, exercise_id, block_key, block_label, sort_order, type, text, options, meta) VALUES
('em001_q1','emotional_mastery_001','emotion','Emoción Principal',1,'multi','¿Qué emoción está más presente hoy?',
 '{"choices":["😊 Alegría","😌 Paz","😔 Tristeza","😡 Enojo","😰 Ansiedad","😞 Frustración","😵 Agotamiento","😨 Miedo","😕 Confusión","🥺 Vulnerabilidad","😤 Estrés","😶 Vacío emocional","💛 Gratitud","✨ Esperanza","💭 Nostalgia","😣 Culpa","😬 Inseguridad","🫶 Amor","🔥 Motivación","🌀 Abrumado"],"min":1,"max":3}'::jsonb,
 '{"kind":"emotions"}'::jsonb),

('em001_q2','emotional_mastery_001','intensity','Intensidad Emocional',2,'scale','¿Qué tan intensa se siente esta emoción?',
 '{"min":1,"max":5}'::jsonb,
 '{"scale_kind":"intensity","min_label":"Muy ligera","max_label":"Muy intensa"}'::jsonb),

('em001_q3','emotional_mastery_001','trigger','Detonante',3,'multi','¿Qué crees que detonó esta emoción?',
 '{"choices":["Trabajo","Dinero","Pareja","Familia","Salud","Amigos","Soledad","Cansancio","Presión","Incertidumbre","Redes sociales","Autoexigencia","Recuerdo o pensamiento","Algo bueno pasó","No estoy seguro"],"min":1,"max":5}'::jsonb,
 '{"kind":"triggers"}'::jsonb),

('em001_q4','emotional_mastery_001','reaction','Tu Respuesta Emocional',4,'multi','¿Cómo has reaccionado a esta emoción hoy?',
 '{"choices":["Me aislé","Lloré","Me distraje","Dormí más","Trabajé demasiado","Comí de más","Me desquité con alguien","Hablé con alguien","Medité","Ignoré lo que siento","Hice ejercicio","Escribí","Respiré","Lo enfrenté","Aún no sé qué hacer"],"min":1,"max":5}'::jsonb,
 '{"kind":"reactions"}'::jsonb),

('em001_q5','emotional_mastery_001','need','Necesidad Emocional',5,'multi','¿Qué sientes que necesitas hoy?',
 '{"choices":["Descansar","Hablar con alguien","Tiempo para mí","Claridad","Llorar","Soltar presión","Seguridad","Motivación","Acompañamiento","Calma","Validación","Silencio","Organización","Perdón","Diversión","Espacio","Amor","Confianza","Movimiento","Pausa mental"],"min":1,"max":3}'::jsonb,
 '{"kind":"needs"}'::jsonb),

('em001_q6','emotional_mastery_001','reflection','Mini Reflexión',6,'open','Si pudieras hablarte con total honestidad y cariño hoy… ¿qué necesitas escuchar?',
 null,
 '{"kind":"self_message"}'::jsonb);
