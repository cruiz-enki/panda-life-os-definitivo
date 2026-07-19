-- Seed de tareas del hogar por área para Carlos
-- user_id: 49aef7da-d1c7-4adc-b3d2-fb741b9b35df

DO $$
DECLARE
  uid uuid := '49aef7da-d1c7-4adc-b3d2-fb741b9b35df';
BEGIN

INSERT INTO public.home_tasks
  (user_id, area_id, title, description, emoji, task_type, frequency, day_of_week, xp_reward, is_key, active, sort_order)
SELECT uid, a.id, t.title, t.description, t.emoji, t.task_type, t.frequency, t.day_of_week, t.xp_reward, t.is_key, true, t.sort_order
FROM (VALUES
  -- Sala
  ('Sala', 'Robotina: aspirar sala',        'Poner la Rumba a aspirar la sala',        '🤖', 'routine', 'daily',    NULL::int, 5,  true,  10),
  ('Sala', 'Robotina: trapear sala',        'Poner la Rumba a trapear la sala',        '🤖', 'routine', 'daily',    NULL::int, 5,  false, 20),
  ('Sala', 'Ordenar sala',                  'Cojines, mantas y control en su lugar',   '🛋️','routine', 'daily',    NULL::int, 3,  false, 30),
  ('Sala', 'Sacudir muebles sala',          'Mesas, repisas y TV',                     '🧹', 'weekly',  'weekly',   6,         6,  false, 40),

  -- Comedor
  ('Comedor', 'Robotina: aspirar comedor',  'Rumba en el comedor',                     '🤖', 'routine', 'daily',    NULL::int, 5,  false, 10),
  ('Comedor', 'Robotina: trapear comedor',  'Rumba trapear comedor',                   '🤖', 'routine', 'daily',    NULL::int, 5,  false, 20),
  ('Comedor', 'Limpiar mesa comedor',       'Después de comidas',                      '🍽️','routine', 'daily',    NULL::int, 3,  false, 30),

  -- Cocina
  ('Cocina', 'Lavar trastes',               'Dejar tarja vacía antes de dormir',       '🧽', 'routine', 'daily',    NULL::int, 6,  true,  10),
  ('Cocina', 'Limpiar estufa y barra',      'Desengrasar superficies',                 '🔥', 'routine', 'daily',    NULL::int, 5,  false, 20),
  ('Cocina', 'Sacar basura',                'Orgánica + inorgánica',                   '🗑️','routine', 'daily',    NULL::int, 4,  false, 30),
  ('Cocina', 'Robotina: aspirar cocina',    'Rumba en cocina',                         '🤖', 'routine', 'daily',    NULL::int, 5,  false, 40),
  ('Cocina', 'Limpiar refri',               'Tirar caducados y desinfectar',           '🧊', 'weekly',  'weekly',   0,         12, false, 50),
  ('Cocina', 'Limpiar horno/microondas',    'Interior y exterior',                     '♨️', 'weekly',  'weekly',   0,         8,  false, 60),
  ('Cocina', 'Trapear cocina a fondo',      'A mano, esquinas',                        '🧼', 'weekly',  'weekly',   6,         10, false, 70),

  -- Baño arriba
  ('Baño arriba', 'Limpiar WC arriba',      'Cepillo y desinfectante',                 '🚽', 'routine', 'weekly',   1,         6,  false, 10),
  ('Baño arriba', 'Limpiar regadera arriba','Sarro y jabón',                           '🚿', 'weekly',  'weekly',   6,         10, false, 20),
  ('Baño arriba', 'Cambiar toallas arriba', 'Toallas limpias',                         '🧺', 'weekly',  'weekly',   0,         4,  false, 30),
  ('Baño arriba', 'Trapear baño arriba',    'Piso y zócalos',                          '🧽', 'weekly',  'weekly',   6,         6,  false, 40),

  -- Baño abajo (Gaby)
  ('Baño abajo', 'Limpiar baño abajo',      'Gaby se encarga',                         '🚽', 'routine', 'weekly',   6,         6,  false, 10),
  ('Baño abajo', 'Trapear baño abajo',      'Gaby se encarga',                         '🧽', 'weekly',  'weekly',   6,         6,  false, 20),

  -- Dormitorio (Gaby: su habitación)
  ('Dormitorio', 'Tender cama',             'Gaby se encarga',                         '🛏️','routine', 'daily',    NULL::int, 3,  true,  10),
  ('Dormitorio', 'Ordenar dormitorio',      'Gaby: ropa y buró',                       '🧺', 'routine', 'daily',    NULL::int, 4,  false, 20),
  ('Dormitorio', 'Cambiar sábanas',         'Gaby se encarga',                         '🛌', 'weekly',  'weekly',   0,         8,  false, 30),
  ('Dormitorio', 'Robotina: aspirar recámara','Rumba en dormitorio',                   '🤖', 'routine', 'weekly',   3,         5,  false, 40),
  ('Dormitorio', 'Sacudir dormitorio',      'Buró, cabecera, lámparas',                '🧹', 'weekly',  'weekly',   6,         6,  false, 50),

  -- Oficina
  ('Oficina', 'Ordenar escritorio',         'Cables, papeles, tazas',                  '🖥️','routine', 'daily',    NULL::int, 3,  false, 10),
  ('Oficina', 'Sacudir oficina',            'Monitores, repisas',                      '🧹', 'weekly',  'weekly',   6,         5,  false, 20),
  ('Oficina', 'Aspirar oficina',            'Robotina o manual',                       '🤖', 'weekly',  'weekly',   6,         5,  false, 30),

  -- Oficina Gaby
  ('Oficina Gaby', 'Ordenar oficina Gaby',  'Gaby se encarga',                         '💼', 'routine', 'weekly',   0,         3,  false, 10),
  ('Oficina Gaby', 'Aspirar oficina Gaby',  'Gaby se encarga',                         '🧹', 'weekly',  'weekly',   6,         5,  false, 20),

  -- Escaleras
  ('Escaleras', 'Aspirar escaleras',        'Escalón por escalón',                     '🧹', 'weekly',  'weekly',   6,         6,  false, 10),
  ('Escaleras', 'Trapear escaleras',        'A mano',                                  '🧽', 'weekly',  'weekly',   6,         6,  false, 20),

  -- Terraza
  ('Terraza', 'Barrer terraza',             'Hojas y polvo',                           '🍃', 'weekly',  'weekly',   6,         5,  false, 10),
  ('Terraza', 'Regar plantas terraza',      'Plantas de la terraza',                   '🪴', 'routine', 'custom',   NULL::int, 3,  false, 20),

  -- Balcón
  ('Balcón', 'Barrer balcón',               'Hojas y polvo',                           '🍃', 'weekly',  'weekly',   6,         4,  false, 10),
  ('Balcón', 'Regar plantas balcón',        'Plantas del balcón',                      '🪴', 'routine', 'custom',   NULL::int, 3,  false, 20),

  -- Patio de perros
  ('Patio de perros', 'Recoger popó',       'Todo el patio',                           '💩', 'routine', 'daily',    NULL::int, 5,  true,  10),
  ('Patio de perros', 'Lavar patio perros', 'Con manguera y jabón',                    '🚿', 'weekly',  'weekly',   6,         10, false, 20),
  ('Patio de perros', 'Rellenar agua perros','Bebederos limpios',                      '💧', 'routine', 'daily',    NULL::int, 3,  false, 30),

  -- Areneros
  ('Areneros', 'Limpiar areneros',          'Retirar heces y grumos',                  '🐾', 'routine', 'daily',    NULL::int, 5,  true,  10),
  ('Areneros', 'Cambiar arena completa',    'Vaciar, lavar y rellenar',                '🪣', 'weekly',  'weekly',   0,         10, false, 20),

  -- Cochera
  ('Cochera', 'Barrer cochera',             'Hojas, tierra',                           '🧹', 'weekly',  'weekly',   6,         5,  false, 10),
  ('Cochera', 'Ordenar cochera',            'Herramientas, cajas',                     '📦', 'weekly',  'weekly',   0,         6,  false, 20),

  -- Bodega
  ('Bodega', 'Ordenar bodega',              'Cajas etiquetadas',                       '📦', 'weekly',  'monthly',  NULL::int, 10, false, 10),
  ('Bodega', 'Sacudir bodega',              'Estantes y suelo',                        '🧹', 'weekly',  'monthly',  NULL::int, 6,  false, 20),

  -- Gimnasio
  ('Gimnasio', 'Trapear gimnasio',          'Piso y equipo',                           '🧽', 'weekly',  'weekly',   6,         6,  false, 10),
  ('Gimnasio', 'Desinfectar equipo',        'Mancuernas, bandas, colchoneta',          '🧴', 'weekly',  'weekly',   6,         5,  false, 20)
) AS t(area_name, title, description, emoji, task_type, frequency, day_of_week, xp_reward, is_key, sort_order)
JOIN public.home_areas a
  ON a.user_id = uid AND a.name = t.area_name;

END $$;
