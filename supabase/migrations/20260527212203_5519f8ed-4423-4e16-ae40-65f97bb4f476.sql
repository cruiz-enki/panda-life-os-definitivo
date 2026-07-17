-- Update category names to match requirements
UPDATE public.lab_indicators SET category = 'Cardiovascular' WHERE category = 'Riesgo cardiovascular';
UPDATE public.lab_indicators SET category = 'Metabolismo/glucosa' WHERE category = 'Química integral' OR name = 'Glucosa';
UPDATE public.lab_indicators SET category = 'Sistema inmune' WHERE category = 'Respuesta inmunológica';
UPDATE public.lab_indicators SET category = 'Metabolismo de hierro' WHERE category = 'Metabolismo de hierro'; -- Just in case

-- Move specific indicators to more accurate categories
UPDATE public.lab_indicators SET category = 'Inflamación' 
WHERE name = 'Proteína C Reactiva ultrasensible';

UPDATE public.lab_indicators SET category = 'Minerales/electrolitos' 
WHERE name IN ('Sodio', 'Potasio', 'Cloro', 'Calcio', 'Magnesio', 'Fósforo');

-- Ensure results follow the new categories (though they are usually linked by indicator_id, they have a cached category field)
UPDATE public.lab_results r
SET category = li.category
FROM public.lab_indicators li
WHERE r.indicator_id = li.id;
