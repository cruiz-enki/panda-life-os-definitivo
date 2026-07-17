-- Insert missing lab indicators
INSERT INTO public.lab_indicators (name, category, unit, ref_min, ref_max, ref_type, ref_display, sort_order)
VALUES 
('Hemoglobina Glicosilada (HbA1c)', 'Metabolismo/glucosa', '%', 4.0, 5.7, 'rango', '4.0 - 5.7 %', 200),
('TSH', 'Tiroides', 'µUI/mL', 0.19, 4.92, 'rango', '0.19 - 4.92 µUI/mL', 300),
('T4 Libre', 'Tiroides', 'ng/dL', 1.0, 1.7, 'rango', '1.0 - 1.7 ng/dL', 310),
('Vitamina D', 'Vitaminas', 'ng/mL', 30.0, 100.0, 'rango', '30.0 - 100.0 ng/mL', 400);

-- Ensure authenticated users can see these (redundant if already granted but good practice)
GRANT SELECT ON public.lab_indicators TO authenticated;
GRANT ALL ON public.lab_indicators TO service_role;
