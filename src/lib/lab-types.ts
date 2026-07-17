/**
 * Tipos del módulo de **Análisis de Laboratorio**: indicadores, estudios,
 * resultados y health score por categoría.
 */
export interface LabIndicator {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  ref_min: number | null;
  ref_max: number | null;
  ref_type: "rango" | "menor_que" | "mayor_que";
  ref_display: string | null;
  sort_order: number;
  is_active: boolean;
  description?: string;
  high_causes?: string;
  low_causes?: string;
  control_tips?: string;
  doctor_advice?: string;
}

export interface LabStudy {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  lab_name: string | null;
  notes: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export type LabStatus = "bajo" | "dentro" | "alto" | "desconocido";

export interface LabResult {
  id: string;
  study_id: string | null;
  user_id: string;
  indicator_id: string | null;
  indicator_key: string;
  indicator_name: string;
  category: string | null;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  ref_min: number | null;
  ref_max: number | null;
  status: LabStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Clasifica un valor en `bajo` / `dentro` / `alto` según rango de referencia.
 */
export function calculateLabStatus(
  value: number | null,
  type: "rango" | "menor_que" | "mayor_que",
  min: number | null,
  max: number | null
): LabStatus {
  if (value == null) return "desconocido";

  if (type === "rango") {
    if (min != null && value < min) return "bajo";
    if (max != null && value > max) return "alto";
    return "dentro";
  }

  if (type === "menor_que") {
    if (max != null && value >= max) return "alto";
    return "dentro";
  }

  if (type === "mayor_que") {
    if (min != null && value <= min) return "bajo";
    return "dentro";
  }

  return "desconocido";
}

export interface HealthScore {
  score: number;
  label: string;
  color: string;
  category: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Calcula health score (0-100) y desglose para una categoría a partir
 * de sus indicadores.
 */
export function calculateHealthScore(category: string, indicators: any[]): HealthScore {
  let score = 100;
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Weights: critical indicators have more impact
  const weights: Record<string, number> = {
    "Glucosa": 25,
    "Creatinina": 20,
    "Colesterol LDL directo": 15,
    "Triglicéridos": 15,
    "Potasio": 20,
    "Sodio": 20,
    "ALT (TGP)": 15,
    "AST (TGO)": 15,
    "Proteína C Reactiva ultrasensible": 20,
  };

  if (indicators.length === 0) {
    return { score: 0, label: "Sin datos", color: "text-muted-foreground", category, strengths: [], improvements: [] };
  }

  indicators.forEach(it => {
    const last = it.points[it.points.length - 1]?.result;
    if (!last) return;

    const weight = weights[it.name] || 10;
    
    // Status impact
    if (last.status === "alto" || last.status === "bajo") {
      score -= weight;
      improvements.push(`${last.status === "alto" ? "⚠" : "⬇"} ${it.name} fuera de rango`);
    } else if (last.status === "dentro") {
      strengths.push(`✓ ${it.name} adecuado`);
    }

    // Trend impact (compare with previous if exists)
    if (it.points.length >= 2) {
      const current = it.points[it.points.length - 1].value;
      const previous = it.points[it.points.length - 2].value;
      
      if (current != null && previous != null) {
        // For indicators where lower is better (LDL, Glucose, etc)
        const isBetterLower = ["Glucosa", "Colesterol LDL directo", "Triglicéridos", "ALT (TGP)", "Proteína C Reactiva ultrasensible"].includes(it.name);
        
        if (isBetterLower) {
          if (current < previous * 0.95) score += 5; // Improved by 5%
          if (current > previous * 1.05) score -= 5; // Worsened by 5%
        } else {
          // For indicators where higher is better (HDL, Albumin, etc)
          const isBetterHigher = ["Colesterol HDL", "Albúmina", "TFGe"].includes(it.name);
          if (isBetterHigher) {
            if (current > previous * 1.05) score += 5;
            if (current < previous * 0.95) score -= 5;
          }
        }
      }
    }
  });

  score = Math.max(10, Math.min(100, score));

  let label = "Excelente";
  let color = "text-green-600";
  if (score < 40) { label = "Riesgo alto"; color = "text-red-600"; }
  else if (score < 70) { label = "Necesita atención"; color = "text-amber-600"; }
  else if (score < 90) { label = "Bien"; color = "text-blue-600"; }

  return { 
    score, 
    label, 
    color, 
    category, 
    strengths: strengths.slice(0, 4), 
    improvements: improvements.slice(0, 4) 
  };
}
