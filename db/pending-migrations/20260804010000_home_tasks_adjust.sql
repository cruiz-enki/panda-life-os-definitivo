-- Ajustes al seed de tareas del hogar
-- user_id: 49aef7da-d1c7-4adc-b3d2-fb741b9b35df

DO $$
DECLARE
  uid uuid := '49aef7da-d1c7-4adc-b3d2-fb741b9b35df';
BEGIN

-- 1) Patio de perros: fines de semana (sábado)
UPDATE public.home_tasks SET frequency = 'weekly', day_of_week = 6
WHERE user_id = uid
  AND area_id IN (SELECT id FROM public.home_areas WHERE user_id = uid AND name = 'Patio de perros')
  AND title IN ('Recoger popó', 'Rellenar agua perros');

-- 2) Areneros: un día sí y un día no → custom (frecuencia alterna)
UPDATE public.home_tasks
SET frequency = 'custom', day_of_week = NULL,
    description = 'Retirar heces y grumos (un día sí, un día no)'
WHERE user_id = uid
  AND area_id IN (SELECT id FROM public.home_areas WHERE user_id = uid AND name = 'Areneros')
  AND title = 'Limpiar areneros';

-- 3) Robotina solo planta alta: quitar tareas de Rumba en planta baja
DELETE FROM public.home_tasks
WHERE user_id = uid
  AND title LIKE 'Robotina:%'
  AND area_id IN (
    SELECT id FROM public.home_areas
    WHERE user_id = uid AND name IN ('Sala', 'Comedor', 'Cocina')
  );

-- Agregar Robotina en áreas de planta alta que faltaban
INSERT INTO public.home_tasks
  (user_id, area_id, title, description, emoji, task_type, frequency, day_of_week, xp_reward, is_key, active, sort_order)
SELECT uid, a.id, t.title, t.description, t.emoji, t.task_type, t.frequency, t.day_of_week, t.xp_reward, false, true, t.sort_order
FROM (VALUES
  ('Oficina',      'Robotina: aspirar oficina',   'Rumba en oficina',             '🤖', 'routine', 'daily', NULL::int, 5,  15),
  ('Baño arriba',  'Robotina: aspirar baño arriba','Rumba en baño de arriba',     '🤖', 'routine', 'weekly', 6,        4,  15),
  ('Escaleras',    'Robotina: repaso escaleras',  'Rumba en pasillo superior',    '🤖', 'routine', 'weekly', 6,        4,  15)
) AS t(area_name, title, description, emoji, task_type, frequency, day_of_week, xp_reward, sort_order)
JOIN public.home_areas a ON a.user_id = uid AND a.name = t.area_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.home_tasks h
  WHERE h.user_id = uid AND h.area_id = a.id AND h.title = t.title
);

-- 4) Lavar y doblar ropa (sin área específica, o vinculado a bodega/dormitorio)
INSERT INTO public.home_tasks
  (user_id, area_id, title, description, emoji, task_type, frequency, day_of_week, xp_reward, is_key, active, sort_order)
VALUES
  (uid, NULL, 'Lavar ropa',           'Cargar lavadora y secar',              '🧺', 'weekly',  'weekly', 6, 8,  false, 100),
  (uid, NULL, 'Doblar y guardar ropa','Doblar, acomodar en clósets',          '👕', 'weekly',  'weekly', 0, 6,  false, 110),
  (uid, NULL, 'Lavar ropa entre semana','Carga rápida si es necesario',       '🧺', 'weekly',  'weekly', 3, 6,  false, 120);

END $$;
