/**
 * **Correlaciones de laboratorio**: detecta relaciones entre indicadores
 * (p.ej. glucosa alta + HbA1c alta) y propone interpretaciones.
 */
import { LabStatus } from "./lab-types";

export interface LabCorrelation {
  id: string;
  title: string;
  observation: string;
  suggestions: string[];
  severity: "info" | "warning" | "critical";
}

/**
 * Detecta correlaciones relevantes entre indicadores cargados.
 */
export function evaluateCorrelations(indicators: any[]): LabCorrelation[] {
  const correlations: LabCorrelation[] = [];

  const getStatus = (name: string): LabStatus => {
    const it = indicators.find(i => i.name === name);
    return it?.points[it.points.length - 1]?.result?.status || "desconocido";
  };

  const hasHigh = (name: string) => getStatus(name) === "alto";
  const hasLow = (name: string) => getStatus(name) === "bajo";

  // REGLA 1: Síndrome Metabólico / Resistencia a la Insulina
  if (hasHigh("Triglicéridos") && hasLow("Colesterol HDL") && hasHigh("Glucosa")) {
    correlations.push({
      id: "metabolic-syndrome",
      title: "Resistencia a la Insulina / Síndrome Metabólico",
      observation: "Este patrón es compatible con resistencia a la insulina o síndrome metabólico.",
      suggestions: [
        "Reducir el consumo de azúcares y harinas refinadas",
        "Enfocarse en reducir la grasa abdominal",
        "Realizar ejercicio de fuerza y cardiovascular de forma regular"
      ],
      severity: "critical"
    });
  }

  // REGLA 2: Hígado Graso
  if (hasHigh("ALT (TGP)") && hasHigh("AST (TGO)") && hasHigh("Triglicéridos")) {
    correlations.push({
      id: "fatty-liver",
      title: "Salud Hepática",
      observation: "Este patrón podría sugerir hígado graso de origen metabólico.",
      suggestions: [
        "Limitar el consumo de alcohol y fructosa añadida",
        "Aumentar la ingesta de fibra y grasas saludables",
        "Mantener un peso saludable mediante actividad física"
      ],
      severity: "warning"
    });
  }

  // REGLA 3: Función Renal
  if (hasHigh("Creatinina") || hasLow("TFGe")) {
    correlations.push({
      id: "renal-function",
      title: "Función Renal",
      observation: "Se observan posibles señales de disminución de la función renal.",
      suggestions: [
        "Mantener una hidratación adecuada",
        "Controlar la ingesta de sodio y proteínas si es necesario",
        "Evitar el uso excesivo de analgésicos AINEs (como ibuprofeno)"
      ],
      severity: "warning"
    });
  }

  // REGLA 4: Riesgo Inflamatorio/Cardiovascular
  if (hasHigh("Proteína C Reactiva ultrasensible") && hasLow("Colesterol HDL") && hasHigh("Triglicéridos")) {
    correlations.push({
      id: "cv-inflammatory-risk",
      title: "Riesgo Inflamatorio y Cardiovascular",
      observation: "Este patrón está relacionado con un mayor riesgo inflamatorio y cardiovascular.",
      suggestions: [
        "Priorizar alimentos antiinflamatorios (omega-3, vegetales verdes)",
        "Gestionar el estrés crónico y mejorar la calidad del sueño",
        "Considerar suplementación supervisada si los niveles persisten"
      ],
      severity: "critical"
    });
  }

  return correlations;
}
