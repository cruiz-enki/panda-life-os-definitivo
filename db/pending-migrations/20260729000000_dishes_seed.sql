-- Seed de platillos base para Carlos
-- user_id: 49aef7da-d1c7-4adc-b3d2-fb741b9b35df

INSERT INTO public.meal_dishes
  (user_id, name, emoji, dish_type, classification, ingredients, preparation, prep_minutes, servings, xp_reward, allowed_meal_types)
VALUES
-- 1. Huevos estrellados
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Huevos estrellados', '🍳', 'quick', 'saludable',
 '[{"name":"Huevo","qty":"2","unit":"pza","category":"proteinas"},{"name":"Aceite de oliva","qty":"1","unit":"cda","category":"despensa"},{"name":"Sal","qty":"1","unit":"pizca","category":"despensa"},{"name":"Pimienta","qty":"1","unit":"pizca","category":"despensa"}]'::jsonb,
 'Calienta el aceite en un sartén. Rompe los huevos, cocina 2-3 min y salpimenta.', 5, 1, 5, ARRAY['desayuno']),

-- 2. Huevos con espinaca
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Huevos con espinaca', '🥬', 'quick', 'saludable',
 '[{"name":"Huevo","qty":"2","unit":"pza","category":"proteinas"},{"name":"Espinaca","qty":"1","unit":"taza","category":"frutas_verduras"},{"name":"Aceite de oliva","qty":"1","unit":"cda","category":"despensa"},{"name":"Sal","qty":"1","unit":"pizca","category":"despensa"}]'::jsonb,
 'Saltea la espinaca 1 min, agrega los huevos batidos y revuelve hasta cuajar.', 8, 1, 6, ARRAY['desayuno']),

-- 3. Huevos con pechuga de pavo
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Huevos con pechuga de pavo', '🦃', 'quick', 'saludable',
 '[{"name":"Huevo","qty":"2","unit":"pza","category":"proteinas"},{"name":"Pechuga de pavo","qty":"80","unit":"g","category":"proteinas"},{"name":"Aceite de oliva","qty":"1","unit":"cda","category":"despensa"},{"name":"Sal","qty":"1","unit":"pizca","category":"despensa"}]'::jsonb,
 'Dora la pechuga de pavo en trozos, agrega los huevos y revuelve hasta cocer.', 8, 1, 6, ARRAY['desayuno']),

-- 4. Batido de proteína
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Batido de proteína', '🥤', 'quick', 'saludable',
 '[{"name":"Proteína en polvo","qty":"1","unit":"scoop","category":"despensa"},{"name":"Leche o agua","qty":"300","unit":"ml","category":"bebidas"},{"name":"Hielo","qty":"1","unit":"taza","category":"otros"}]'::jsonb,
 'Licúa proteína, líquido y hielo hasta integrar. Sirve frío.', 3, 1, 4, ARRAY['snack','cena','desayuno']),

-- 5. Creatina
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Creatina', '💪', 'quick', 'saludable',
 '[{"name":"Creatina monohidratada","qty":"5","unit":"g","category":"despensa"},{"name":"Agua","qty":"250","unit":"ml","category":"bebidas"}]'::jsonb,
 'Disuelve la creatina en agua y bebe.', 1, 1, 3, ARRAY['snack']),

-- 6. Electrolitos
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Electrolitos', '⚡', 'quick', 'saludable',
 '[{"name":"Sobre de electrolitos","qty":"1","unit":"sobre","category":"despensa"},{"name":"Agua","qty":"500","unit":"ml","category":"bebidas"}]'::jsonb,
 'Disuelve el sobre en agua fría y bebe.', 1, 1, 3, ARRAY['snack']),

-- 7. Picadillo
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Picadillo', '🥘', 'meal_prep', 'saludable',
 '[{"name":"Carne molida de res","qty":"500","unit":"g","category":"proteinas"},{"name":"Papa","qty":"2","unit":"pza","category":"frutas_verduras"},{"name":"Zanahoria","qty":"2","unit":"pza","category":"frutas_verduras"},{"name":"Jitomate","qty":"3","unit":"pza","category":"frutas_verduras"},{"name":"Cebolla","qty":"1","unit":"pza","category":"frutas_verduras"},{"name":"Ajo","qty":"2","unit":"diente","category":"frutas_verduras"},{"name":"Aceite","qty":"2","unit":"cda","category":"despensa"},{"name":"Sal","qty":"1","unit":"cdta","category":"despensa"}]'::jsonb,
 'Sofríe cebolla y ajo, agrega carne y dora. Añade jitomate licuado, papa y zanahoria en cubos. Cocina 25 min.', 35, 4, 10, ARRAY['comida']),

-- 8. Tacos de res
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Tacos de res', '🌮', 'quick', 'regular',
 '[{"name":"Bistec de res","qty":"300","unit":"g","category":"proteinas"},{"name":"Tortilla de maíz","qty":"6","unit":"pza","category":"granos"},{"name":"Cebolla","qty":"0.5","unit":"pza","category":"frutas_verduras"},{"name":"Cilantro","qty":"1","unit":"manojo","category":"frutas_verduras"},{"name":"Limón","qty":"2","unit":"pza","category":"frutas_verduras"},{"name":"Salsa","qty":"1","unit":"taza","category":"despensa"},{"name":"Sal","qty":"1","unit":"pizca","category":"despensa"}]'::jsonb,
 'Asa el bistec en trozos con sal. Calienta tortillas. Sirve con cebolla, cilantro, limón y salsa.', 20, 2, 8, ARRAY['comida','cena']),

-- 9. Pasta bolognesa
('49aef7da-d1c7-4adc-b3d2-fb741b9b35df', 'Pasta bolognesa', '🍝', 'meal_prep', 'regular',
 '[{"name":"Pasta","qty":"400","unit":"g","category":"granos"},{"name":"Carne molida de res","qty":"500","unit":"g","category":"proteinas"},{"name":"Salsa de tomate","qty":"400","unit":"g","category":"despensa"},{"name":"Cebolla","qty":"1","unit":"pza","category":"frutas_verduras"},{"name":"Ajo","qty":"3","unit":"diente","category":"frutas_verduras"},{"name":"Zanahoria","qty":"1","unit":"pza","category":"frutas_verduras"},{"name":"Aceite de oliva","qty":"2","unit":"cda","category":"despensa"},{"name":"Sal","qty":"1","unit":"cdta","category":"despensa"},{"name":"Orégano","qty":"1","unit":"cdta","category":"despensa"}]'::jsonb,
 'Sofríe cebolla, ajo y zanahoria picada. Agrega carne y dora. Añade salsa y hierbas, cocina 20 min. Sirve sobre pasta al dente.', 30, 4, 10, ARRAY['comida','cena']);
