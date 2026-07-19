-- Semillas: nuevos ejercicios (cardio, bandas, Williams)
INSERT INTO public.exercises
  (name, muscle_group, level, equipment, instructions, precautions, default_sets, default_reps, duration_minutes, xp_reward, emoji, created_by)
VALUES
  ('Caminadora', 'cardio', 'beginner', 'none',
   'Camina o trota en la caminadora a ritmo constante. Ajusta velocidad e inclinación según objetivo. Calienta 3 min a paso ligero y termina bajando el ritmo.',
   'Sujétate solo al inicio o al bajar. No mires hacia abajo. Detente si sientes mareo o dolor.',
   1, '20-30 min', 25, 8, '🏃', '49aef7da-d1c7-4adc-b3d2-fb741b9b35df'),

  ('Bicicleta estacionaria', 'cardio', 'beginner', 'none',
   'Pedalea a cadencia cómoda ajustando resistencia. Espalda neutra, rodillas alineadas con los pies. Alterna ritmos si buscas intervalos.',
   'Ajusta la altura del sillín para que la rodilla quede ligeramente flexionada al extender. Evita bloquear la rodilla.',
   1, '20-30 min', 25, 8, '🚴', '49aef7da-d1c7-4adc-b3d2-fb741b9b35df'),

  ('Ejercicio con ligas de resistencia', 'full_body', 'beginner', 'band',
   'Rutina general con banda elástica: remo, press de pecho, sentadilla con banda, curl y extensión de tríceps, abducciones de cadera. 2-3 series por ejercicio.',
   'Revisa la banda antes de usarla (grietas). Fija bien el anclaje. Controla la fase excéntrica: no dejes que la banda te jale.',
   3, '12-15', 20, 7, '🎗️', '49aef7da-d1c7-4adc-b3d2-fb741b9b35df'),

  ('Ejercicios de Williams', 'core', 'beginner', 'mat',
   'Serie clásica para lumbalgia: (1) báscula pélvica, (2) rodilla al pecho unilateral, (3) rodillas al pecho bilateral, (4) semiabdominal, (5) estiramiento de isquiotibiales, (6) estiramiento de flexor de cadera, (7) sentadilla parcial. 10 repeticiones o 20 seg de sostén por ejercicio.',
   'Movimientos suaves y sin dolor. Evita si hay hernia discal aguda o indicación médica en contra. Respira: no aguantes el aire.',
   1, '10 reps c/u', 15, 6, '🧘', '49aef7da-d1c7-4adc-b3d2-fb741b9b35df');
