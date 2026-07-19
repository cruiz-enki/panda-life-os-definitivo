-- =========================================================
-- Seed de medicamentos de Carlos
-- user_id: 49aef7da-d1c7-4adc-b3d2-fb741b9b35df
-- Correlo en el SQL Editor de tu Supabase.
-- =========================================================

INSERT INTO public.health_medications
  (user_id, name, dose, unit, quantity, frequency, times_per_day, schedule_times, emoji, color, notes, active)
VALUES
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Telmisartán',    '80',  'mg', 1, 'daily',           1, ARRAY['08:00'::text],           '💊', 'oklch(0.7 0.15 250)', 'Antihipertensivo — mañana',                                 true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Escitalopram',   '10',  'mg', 1, 'daily',           1, ARRAY['22:00'::text],           '🧠', 'oklch(0.7 0.15 300)', 'ISRS — noche',                                              true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Hidroclorotiazida','25','mg', 1, 'daily',           1, ARRAY['08:00'::text],           '💧', 'oklch(0.75 0.15 220)','Diurético — mañana',                                       true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Pregabalina',    '150', 'mg', 1, 'daily',           1, ARRAY['22:00'::text],           '🌙', 'oklch(0.7 0.15 280)', 'Dolor neuropático — noche',                                 true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Melatonina',     '5',   'mg', 1, 'daily',           1, ARRAY['22:30'::text],           '😴', 'oklch(0.7 0.15 260)', 'Sueño — noche',                                             true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Atorvastatina',  '20',  'mg', 1, 'every_48_hours',  1, ARRAY['08:00'::text],           '❤️', 'oklch(0.7 0.2 25)',   'Estatina — un día sí, un día no (alterna con ciprofibrato)',true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Amlodipino',     '10',  'mg', 2, 'daily',           1, ARRAY['22:00'::text],           '💊', 'oklch(0.7 0.15 200)', '2 tabletas de 5 mg — noche',                                true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Colágeno',       '350', 'mg', 1, 'daily',           1, ARRAY['08:00'::text],           '🦴', 'oklch(0.78 0.15 70)', 'Suplemento — mañana',                                       true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Ciprofibrato',   '100', 'mg', 1, 'every_48_hours',  1, ARRAY['22:00'::text],           '💊', 'oklch(0.7 0.2 15)',   'Fibrato — noche, el día que NO tomo atorvastatina',         true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Dapagliflozina', '10',  'mg', 1, 'daily',           1, ARRAY['08:00'::text],           '🩸', 'oklch(0.7 0.15 180)', 'SGLT2 — mañana',                                            true),
  ('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Diasporal',      '400', 'mg', 1, 'daily',           1, ARRAY['22:00'::text],           '✨', 'oklch(0.78 0.18 150)','Magnesio — noche',                                          true);
