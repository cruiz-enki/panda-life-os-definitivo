-- Add educational fields to lab_indicators table
ALTER TABLE public.lab_indicators 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS high_causes TEXT,
ADD COLUMN IF NOT EXISTS low_causes TEXT,
ADD COLUMN IF NOT EXISTS control_tips TEXT,
ADD COLUMN IF NOT EXISTS doctor_advice TEXT;

-- Update indicators with educational content
UPDATE public.lab_indicators SET 
  description = 'Mide el nivel de azúcar en sangre. Ayuda a detectar problemas como diabetes o resistencia a la insulina.',
  high_causes = 'Puede relacionarse con exceso de azúcar, obesidad, estrés o diabetes.',
  low_causes = 'Puede causar mareos, debilidad o ayunos prolongados.',
  control_tips = 'Reducir azúcar y ultraprocesados, hacer ejercicio y mantener peso saludable.',
  doctor_advice = 'Consultar si se mantiene elevada o hay síntomas frecuentes.'
WHERE name = 'Glucosa';

UPDATE public.lab_indicators SET 
  description = 'Evalúa cómo están funcionando los riñones.',
  high_causes = 'Puede indicar disminución de función renal o deshidratación.',
  low_causes = 'Generalmente relacionado con poca masa muscular.',
  control_tips = 'Mantener hidratación, controlar presión y evitar exceso de medicamentos dañinos para riñón.',
  doctor_advice = 'Consultar si aumenta progresivamente.'
WHERE name = 'Creatinina';

UPDATE public.lab_indicators SET 
  description = 'Estima qué tan bien filtran los riñones la sangre.',
  high_causes = 'Normalmente no representa problema.',
  low_causes = 'Puede indicar enfermedad renal.',
  control_tips = 'Controlar presión, azúcar, hidratación y evitar exceso de sal.',
  doctor_advice = 'Consultar si baja de 60.'
WHERE name = 'TFGe';

UPDATE public.lab_indicators SET 
  description = 'Es el colesterol ''bueno'' que ayuda a proteger el corazón.',
  high_causes = 'Generalmente protector.',
  low_causes = 'Aumenta riesgo cardiovascular.',
  control_tips = 'Ejercicio, grasas saludables, omega 3 y dejar tabaco.',
  doctor_advice = 'Consultar si permanece bajo.'
WHERE name = 'Colesterol HDL';

UPDATE public.lab_indicators SET 
  description = 'Es el colesterol que puede acumularse en arterias.',
  high_causes = 'Aumenta riesgo cardiovascular.',
  low_causes = 'Generalmente positivo.',
  control_tips = 'Reducir grasas trans, comida procesada y mejorar alimentación.',
  doctor_advice = 'Consultar si permanece elevado.'
WHERE name = 'Colesterol LDL directo';

UPDATE public.lab_indicators SET 
  description = 'Son grasas en sangre relacionadas con alimentación y metabolismo.',
  high_causes = 'Puede aumentar riesgo cardiovascular e hígado graso.',
  low_causes = 'Usualmente no representa problema.',
  control_tips = 'Reducir azúcar, alcohol, harinas refinadas y bajar peso.',
  doctor_advice = 'Consultar si son muy altos.'
WHERE name = 'Triglicéridos';

UPDATE public.lab_indicators SET 
  description = 'Mide inflamación relacionada con riesgo cardiovascular.',
  high_causes = 'Puede indicar inflamación o mayor riesgo cardiovascular.',
  low_causes = 'Normal.',
  control_tips = 'Ejercicio, bajar peso, dormir bien y reducir inflamación.',
  doctor_advice = 'Consultar si permanece elevada.'
WHERE name = 'Proteína C Reactiva ultrasensible';

UPDATE public.lab_indicators SET 
  description = 'Enzima relacionada con salud del hígado.',
  high_causes = 'Puede indicar inflamación hepática, alcohol, medicamentos o hígado graso.',
  low_causes = 'Generalmente sin relevancia clínica.',
  control_tips = 'Reducir alcohol, ultraprocesados y cuidar peso.',
  doctor_advice = 'Consultar si sigue elevada.'
WHERE name = 'AST (TGO)';

UPDATE public.lab_indicators SET 
  description = 'Enzima del hígado útil para detectar daño hepático.',
  high_causes = 'Frecuente en hígado graso o inflamación hepática.',
  low_causes = 'Normalmente sin problema.',
  control_tips = 'Bajar peso, reducir azúcar y alcohol.',
  doctor_advice = 'Consultar si permanece elevada.'
WHERE name = 'ALT (TGP)';

UPDATE public.lab_indicators SET 
  description = 'Indicador relacionado con hígado y vías biliares.',
  high_causes = 'Puede relacionarse con alcohol, medicamentos o hígado graso.',
  low_causes = 'Sin importancia clínica.',
  control_tips = 'Reducir alcohol y mejorar alimentación.',
  doctor_advice = 'Consultar si aumenta constantemente.'
WHERE name = 'GGT';

UPDATE public.lab_indicators SET 
  description = 'Relacionado con metabolismo y riesgo de gota.',
  high_causes = 'Puede causar dolor articular o cálculos.',
  low_causes = 'Generalmente no importante.',
  control_tips = 'Reducir alcohol, refrescos y carnes procesadas.',
  doctor_advice = 'Consultar si hay dolor articular.'
WHERE name = 'Ácido úrico';

UPDATE public.lab_indicators SET 
  description = 'Importante para transportar oxígeno en la sangre.',
  high_causes = 'Puede relacionarse con exceso de hierro.',
  low_causes = 'Puede causar anemia y fatiga.',
  control_tips = 'Mejorar alimentación y revisar absorción.',
  doctor_advice = 'Consultar si hay cansancio persistente.'
WHERE name = 'Hierro';

UPDATE public.lab_indicators SET 
  description = 'Mineral importante para músculos y corazón.',
  high_causes = 'Puede afectar ritmo cardíaco.',
  low_causes = 'Puede causar debilidad o calambres.',
  control_tips = 'Mantener hidratación y alimentación balanceada.',
  doctor_advice = 'Consultar si hay síntomas cardíacos.'
WHERE name = 'Potasio';

UPDATE public.lab_indicators SET 
  description = 'Mineral relacionado con hidratación y presión arterial.',
  high_causes = 'Puede relacionarse con deshidratación o exceso de sal.',
  low_causes = 'Puede causar mareos o debilidad.',
  control_tips = 'Mantener buena hidratación y moderar sal.',
  doctor_advice = 'Consultar si hay síntomas neurológicos.'
WHERE name = 'Sodio';

UPDATE public.lab_indicators SET 
  description = 'Mineral importante para músculos, nervios y energía.',
  high_causes = 'Puede relacionarse con suplementos excesivos.',
  low_causes = 'Puede causar fatiga o calambres.',
  control_tips = 'Consumir nueces, semillas y vegetales.',
  doctor_advice = 'Consultar si hay síntomas persistentes.'
WHERE name = 'Magnesio';
