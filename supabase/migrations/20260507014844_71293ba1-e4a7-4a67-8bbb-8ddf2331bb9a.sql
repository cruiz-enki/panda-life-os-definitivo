
DO $$
DECLARE
  v_routine_id uuid;
  v_ex1 uuid; v_ex2 uuid; v_ex3 uuid; v_ex4 uuid;
  v_ex5 uuid; v_ex6 uuid; v_ex7 uuid; v_ex8 uuid;
BEGIN
  -- Ejercicios (idempotente por nombre)
  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Sentadilla Goblet con mancuerna', 'piernas', 'beginner', 'mancuernas',
    'Sostén una mancuerna con ambas manos a la altura del pecho. Pies a la anchura de los hombros. Baja flexionando rodillas y caderas manteniendo la espalda recta hasta que los muslos queden paralelos al suelo. Sube empujando con los talones.',
    'Mantén las rodillas alineadas con los pies. Evita encorvar la espalda baja.',
    3, '12', 6, 8, '🏋️')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex1;
  IF v_ex1 IS NULL THEN SELECT id INTO v_ex1 FROM public.exercises WHERE name='Sentadilla Goblet con mancuerna'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Peso muerto rumano con mancuernas', 'piernas', 'beginner', 'mancuernas',
    'Una mancuerna en cada mano frente a los muslos. Con rodillas ligeramente flexionadas, baja inclinando la cadera hacia atrás manteniendo la espalda neutra. Las mancuernas bajan pegadas a las piernas. Sube contrayendo glúteos.',
    'No redondees la espalda. Si sientes molestia lumbar, baja menos rango.',
    3, '10', 6, 8, '🦵')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex2;
  IF v_ex2 IS NULL THEN SELECT id INTO v_ex2 FROM public.exercises WHERE name='Peso muerto rumano con mancuernas'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Press de pecho con mancuernas en piso', 'pecho', 'beginner', 'mancuernas',
    'Acostado en el piso o banco, mancuernas a los lados del pecho con codos a 45°. Empuja hacia arriba hasta extender brazos sin bloquear codos. Baja controlado.',
    'No dejes caer los codos al piso bruscamente. Mantén muñecas alineadas.',
    3, '10', 5, 8, '💪')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex3;
  IF v_ex3 IS NULL THEN SELECT id INTO v_ex3 FROM public.exercises WHERE name='Press de pecho con mancuernas en piso'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Remo a un brazo con mancuerna', 'espalda', 'beginner', 'mancuernas',
    'Apoya rodilla y mano del mismo lado en una banca o silla. Con la otra mano sostén la mancuerna colgando. Tira del codo hacia la cadera apretando la espalda. Baja controlado.',
    'No rotes el torso al subir. Espalda neutra durante todo el movimiento.',
    3, '10 c/lado', 6, 8, '🚣')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex4;
  IF v_ex4 IS NULL THEN SELECT id INTO v_ex4 FROM public.exercises WHERE name='Remo a un brazo con mancuerna'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Press de hombros sentado con mancuernas', 'hombros', 'beginner', 'mancuernas',
    'Sentado con espalda recta, mancuernas a la altura de los hombros con palmas al frente. Empuja hacia arriba hasta casi extender brazos. Baja controlado.',
    'Evita arquear la espalda baja. Si tienes molestia en hombros, reduce peso.',
    3, '10', 5, 8, '🙆')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex5;
  IF v_ex5 IS NULL THEN SELECT id INTO v_ex5 FROM public.exercises WHERE name='Press de hombros sentado con mancuernas'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Curl de bíceps con mancuernas', 'brazos', 'beginner', 'mancuernas',
    'De pie, mancuernas a los costados con palmas al frente. Flexiona codos llevando las mancuernas hacia los hombros sin mover los codos del torso. Baja controlado.',
    'No uses impulso de la espalda. Mantén muñecas firmes.',
    3, '12', 4, 6, '💪')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex6;
  IF v_ex6 IS NULL THEN SELECT id INTO v_ex6 FROM public.exercises WHERE name='Curl de bíceps con mancuernas'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Extensión de tríceps sobre cabeza con mancuerna', 'brazos', 'beginner', 'mancuernas',
    'Sostén una mancuerna con ambas manos por encima de la cabeza con brazos extendidos. Baja la mancuerna detrás de la cabeza flexionando codos. Sube extendiendo brazos.',
    'Codos cerca de la cabeza. Si te molestan los codos, reduce peso.',
    3, '12', 4, 6, '🏋️‍♀️')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex7;
  IF v_ex7 IS NULL THEN SELECT id INTO v_ex7 FROM public.exercises WHERE name='Extensión de tríceps sobre cabeza con mancuerna'; END IF;

  INSERT INTO public.exercises (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji)
  VALUES ('Plancha frontal', 'core', 'beginner', 'ninguno',
    'Apóyate en antebrazos y puntas de los pies. Cuerpo recto desde cabeza hasta talones. Aprieta abdomen y glúteos. Mantén la posición.',
    'No dejes caer la cadera ni la subas demasiado.',
    3, '30s', 3, 5, '🧱')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ex8;
  IF v_ex8 IS NULL THEN SELECT id INTO v_ex8 FROM public.exercises WHERE name='Plancha frontal'; END IF;

  -- Rutina (idempotente por nombre)
  INSERT INTO public.routines (name, objective, duration_minutes, level, suggested_days_per_week, xp_total, xp_bonus, emoji, color)
  VALUES ('Fuerza con Mancuernas — Principiante',
    'Rutina full body para construir base de fuerza con mancuernas. 3 sesiones por semana en días no consecutivos.',
    35, 'beginner', 3, 57, 30, '🏋️', 'oklch(0.7 0.18 30)')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_routine_id;
  IF v_routine_id IS NULL THEN SELECT id INTO v_routine_id FROM public.routines WHERE name='Fuerza con Mancuernas — Principiante'; END IF;

  -- Vincular ejercicios a rutina (limpia previo y vuelve a insertar para mantener orden)
  DELETE FROM public.routine_exercises WHERE routine_id = v_routine_id;
  INSERT INTO public.routine_exercises (routine_id, exercise_id, sort_order, sets, reps, rest_seconds, notes) VALUES
    (v_routine_id, v_ex1, 1, 3, '12', 60, 'Calienta con peso ligero antes.'),
    (v_routine_id, v_ex2, 2, 3, '10', 60, 'Enfócate en bisagra de cadera.'),
    (v_routine_id, v_ex3, 3, 3, '10', 60, ''),
    (v_routine_id, v_ex4, 4, 3, '10 c/lado', 60, 'Cada lado cuenta como una serie.'),
    (v_routine_id, v_ex5, 5, 3, '10', 60, ''),
    (v_routine_id, v_ex6, 6, 3, '12', 45, ''),
    (v_routine_id, v_ex7, 7, 3, '12', 45, ''),
    (v_routine_id, v_ex8, 8, 3, '30s', 45, 'Mantén el core activo.');
END $$;
