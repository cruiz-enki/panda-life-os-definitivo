/**
 * **Alertas de laboratorio**: evalúa indicadores y devuelve avisos
 * relevantes (valores fuera de rango, combinaciones peligrosas, etc.).
 */
import { LabResult, LabStatus } from "./lab-types";

export interface LabAlert {
  id: string;
  type: "preventive" | "persistence" | "worsening" | "improvement";
  title: string;
  message: string;
  severity: "info" | "success" | "warning";
  indicator_name?: string;
}

/**
 * Evalúa la lista de indicadores y devuelve alertas activas.
 */
export function evaluateAlerts(indicators: any[]): LabAlert[] {
  const alerts: LabAlert[] = [];
  const now = new Date();

  // 1. Alertas Preventivas (Tiempo desde el último estudio)
  const allPoints = indicators.flatMap(it => it.points);
  if (allPoints.length > 0) {
    const sortedPoints = [...allPoints].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastStudyDate = new Date(sortedPoints[0].date);
    const monthsSince = (now.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsSince >= 6) {
      alerts.push({
        id: "preventive-6-months",
        type: "preventive",
        title: "Recordatorio de Seguimiento",
        message: "Han pasado 6 meses desde tu último estudio. Podría ser buen momento para repetir laboratorio.",
        severity: "info"
      });
    }
  }

  indicators.forEach(it => {
    const points = it.points;
    if (points.length < 2) return;

    const current = points[points.length - 1];
    const previous = points[points.length - 2];
    const valCur = current.value || 0;
    const valPrev = previous.value || 0;
    const statusCur = current.result?.status as LabStatus;

    // 2. Alertas de Mejora
    // Better lower indicators
    const betterLower = ["Glucosa", "Colesterol LDL directo", "Triglicéridos", "ALT (TGP)", "AST (TGO)", "Proteína C Reactiva ultrasensible", "Hemoglobina Glicosilada (HbA1c)"].includes(it.name);
    // Better higher indicators
    const betterHigher = ["Colesterol HDL", "Albúmina", "TFGe", "Vitamina D", "Hierro Sérico"].includes(it.name);

    if (betterLower && valCur < valPrev * 0.95 && statusCur === "dentro") {
       alerts.push({
        id: `improvement-${it.id}`,
        type: "improvement",
        title: "¡Buen progreso!",
        message: `Excelente trabajo. Tu nivel de ${it.name} ha mejorado respecto al estudio pasado.`,
        severity: "success",
        indicator_name: it.name
      });
    } else if (betterHigher && valCur > valPrev * 1.05 && statusCur === "dentro") {
      alerts.push({
        id: `improvement-${it.id}`,
        type: "improvement",
        title: "¡Buen progreso!",
        message: `Excelente trabajo. Tu nivel de ${it.name} ha mejorado respecto al estudio pasado.`,
        severity: "success",
        indicator_name: it.name
      });
    }

    // 3. Alertas de Empeoramiento
    const diffPct = valPrev !== 0 ? ((valCur - valPrev) / valPrev) * 100 : 0;
    if (betterLower && diffPct >= 20) {
      alerts.push({
        id: `worsening-${it.id}`,
        type: "worsening",
        title: "Cambio Significativo",
        message: `Tus ${it.name} aumentaron un ${Math.abs(diffPct).toFixed(0)}% respecto al estudio anterior.`,
        severity: "warning",
        indicator_name: it.name
      });
    }

    // 4. Alertas de Persistencia (3 consecutivos fuera de rango)
    if (points.length >= 3) {
      const last3 = points.slice(-3);
      const allHigh = last3.every((p: any) => p.result?.status === "alto");
      const allLow = last3.every((p: any) => p.result?.status === "bajo");

      if (allHigh || allLow) {
        alerts.push({
          id: `persistence-${it.id}`,
          type: "persistence",
          title: "Tendencia Persistente",
          message: `${it.name} se mantiene ${allHigh ? 'elevado' : 'bajo'} en varios estudios consecutivos. Considera seguimiento médico.`,
          severity: "warning",
          indicator_name: it.name
        });
      }
    }
  });

  return alerts;
}
