-- Create lab_indicators table
CREATE TABLE public.lab_indicators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT,
    ref_min NUMERIC,
    ref_max NUMERIC,
    ref_type TEXT NOT NULL CHECK (ref_type IN ('rango', 'menor_que', 'mayor_que')),
    ref_display TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions for lab_indicators
GRANT SELECT ON public.lab_indicators TO authenticated;
GRANT ALL ON public.lab_indicators TO service_role;

-- Enable RLS
ALTER TABLE public.lab_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view indicators" ON public.lab_indicators FOR SELECT TO authenticated USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_lab_indicators_updated_at BEFORE UPDATE ON public.lab_indicators
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update lab_results table to link to indicators and store status
ALTER TABLE public.lab_results 
    ADD COLUMN indicator_id UUID REFERENCES public.lab_indicators(id),
    ADD COLUMN status TEXT CHECK (status IN ('bajo', 'dentro', 'alto', 'desconocido')),
    ALTER COLUMN study_id DROP NOT NULL;

-- Insert preloaded indicators
INSERT INTO public.lab_indicators (name, category, unit, ref_type, ref_min, ref_max, ref_display, sort_order) VALUES
('Glucosa', 'Química integral', 'mg/dL', 'rango', 55, 99, '55 - 99 mg/dL', 10),
('Urea', 'Función renal', 'mg/dL', 'rango', 16.6, 48.5, '16.6 - 48.5 mg/dL', 20),
('BUN', 'Función renal', 'mg/dL', 'rango', 6, 20, '6 - 20 mg/dL', 30),
('Creatinina', 'Función renal', 'mg/dL', 'rango', 0.70, 1.2, '0.70 - 1.2 mg/dL', 40),
('Relación BUN/Creat', 'Función renal', '', 'rango', 9, 17, '9 - 17', 50),
('Ácido úrico', 'Función renal', 'mg/dL', 'rango', 3.4, 7.0, '3.4 - 7.0 mg/dL', 60),
('Fósforo', 'Función renal', 'mg/dL', 'rango', 2.5, 4.5, '2.5 - 4.5 mg/dL', 70),
('Calcio', 'Función renal', 'mg/dL', 'rango', 8.6, 10, '8.6 - 10 mg/dL', 80),
('Magnesio', 'Función renal', 'mg/dL', 'rango', 1.6, 2.6, '1.6 - 2.6 mg/dL', 90),
('Sodio', 'Función renal', 'meq/L', 'rango', 136, 145, '136 - 145 meq/L', 100),
('Potasio', 'Función renal', 'meq/L', 'rango', 3.5, 5.1, '3.5 - 5.1 meq/L', 110),
('Cloro', 'Función renal', 'meq/L', 'rango', 98, 107, '98 - 107 meq/L', 120),
('TFGe', 'Función renal', 'mL/min/1.73m²', 'mayor_que', 60, NULL, '>60 mL/min/1.73m²', 130),
('Colesterol total', 'Riesgo cardiovascular', 'mg/dL', 'menor_que', NULL, 200, '<200 mg/dL', 140),
('Colesterol HDL', 'Riesgo cardiovascular', 'mg/dL', 'rango', 40, 60, '40 - 60 mg/dL', 150),
('Colesterol LDL directo', 'Riesgo cardiovascular', 'mg/dL', 'menor_que', NULL, 100, '<100 mg/dL', 160),
('Triglicéridos', 'Riesgo cardiovascular', 'mg/dL', 'menor_que', NULL, 150, '<150 mg/dL', 170),
('Colesterol no-HDL', 'Riesgo cardiovascular', 'mg/dL', 'menor_que', NULL, 130, '<130 mg/dL', 180),
('Índice aterogénico', 'Riesgo cardiovascular', '', 'menor_que', NULL, 4.5, '<4.5', 190),
('Relación LDL/HDL', 'Riesgo cardiovascular', '', 'menor_que', NULL, 3.0, '<3.0', 200),
('sd LDL', 'Riesgo cardiovascular', '', 'rango', 0, 1.35, '0 - 1.35', 210),
('VLDL colesterol', 'Riesgo cardiovascular', 'mg/dL', 'menor_que', NULL, 35, '<35 mg/dL', 220),
('Lípidos totales', 'Riesgo cardiovascular', 'mg/dL', 'rango', 380, 748, '380 - 748 mg/dL', 230),
('Fosfolípidos en suero', 'Riesgo cardiovascular', 'mg/dL', 'rango', 161, 265, '161 - 265 mg/dL', 240),
('Proteína C Reactiva ultrasensible', 'Riesgo cardiovascular', 'mg/dL', 'menor_que', NULL, 0.5, '<0.5 mg/dL', 250),
('Bilirrubina total', 'Función hepática', 'mg/dL', 'menor_que', NULL, 1.2, '<1.2 mg/dL', 260),
('Bilirrubina directa', 'Función hepática', 'mg/dL', 'rango', 0.09, 0.3, '0.09 - 0.3 mg/dL', 270),
('Bilirrubina indirecta', 'Función hepática', 'mg/dL', 'rango', 0.01, 0.9, '0.01 - 0.9 mg/dL', 280),
('AST (TGO)', 'Función hepática', 'U/L', 'menor_que', NULL, 40, '<40 U/L', 290),
('ALT (TGP)', 'Función hepática', 'U/L', 'menor_que', NULL, 41, '<41 U/L', 300),
('Relación AST/ALT', 'Función hepática', '', 'menor_que', NULL, 2.0, '<2.0', 310),
('GGT', 'Función hepática', 'U/L', 'rango', 9, 75, '9 - 75 U/L', 320),
('Proteínas totales', 'Función hepática', 'g/dL', 'rango', 6.3, 8.1, '6.3 - 8.1 g/dL', 330),
('Albúmina', 'Función hepática', 'g/dL', 'rango', 3.9, 5.1, '3.9 - 5.1 g/dL', 340),
('Globulinas', 'Función hepática', 'g/dL', 'rango', 2.9, 3.1, '2.9 - 3.1 g/dL', 350),
('Relación A/G', 'Función hepática', '', 'rango', 1.18, 2.33, '1.18 - 2.33', 360),
('Fosfatasa alcalina total', 'Función hepática', 'U/L', 'rango', 45, 128, '45 - 128 U/L', 370),
('LDH', 'Función hepática', 'U/L', 'rango', 125, 239, '125 - 239 U/L', 380),
('Hierro', 'Metabolismo de hierro', 'µg/dL', 'rango', 33, 193, '33 - 193 µg/dL', 390),
('UIBC', 'Metabolismo de hierro', 'µg/dL', 'rango', 125, 345, '125 - 345 µg/dL', 400),
('Captación de hierro', 'Metabolismo de hierro', 'µg/dL', 'rango', 250, 450, '250 - 450 µg/dL', 410),
('% Saturación de hierro', 'Metabolismo de hierro', '%', 'rango', 15, 50, '15 - 50 %', 420),
('Inmunoglobulina G', 'Respuesta inmunológica', 'mg/dL', 'rango', 700, 1600, '700 - 1600 mg/dL', 430),
('Inmunoglobulina A', 'Respuesta inmunológica', 'mg/dL', 'rango', 70, 400, '70 - 400 mg/dL', 440),
('Inmunoglobulina M', 'Respuesta inmunológica', 'mg/dL', 'rango', 40, 230, '40 - 230 mg/dL', 450);
