/**
 * **Generador de PDFs**. `jspdf` y `jspdf-autotable` pesan ~200KB combinados
 * y se cargan dinámicamente solo cuando el usuario exporta.
 */
import { evaluateCorrelations } from "./lab-correlations";
import { evaluateAlerts } from "./lab-alerts";

export async function generateHealthPDF(data: {
  indicators: any[];
  results: any[];
  studies: any[];
  healthScores: any[];
  userName?: string;
}) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Helper: Title
  const drawTitle = (text: string, y: number, size = 16) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text(text, margin, y);
    return y + size / 2;
  };

  // Helper: Subtitle
  const drawSubTitle = (text: string, y: number) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(66, 66, 66);
    doc.text(text, margin, y);
    return y + 8;
  };

  // 1. HEADER
  doc.setFillColor(31, 41, 55); // Slate 800
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE MÉDICO DE SALUD", margin, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, pageWidth - margin - 40, 25);

  let currentY = 55;

  // 2. RESUMEN DE SALUD (Scores)
  currentY = drawTitle("RESUMEN DE SALUD POR CATEGORÍA", currentY);
  
  const scoreData = data.healthScores.map(s => [
    s.category,
    s.score > 0 ? `${s.score}/100` : "S/D",
    s.label
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Categoría", "Puntaje", "Estado"]],
    body: scoreData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 3. PRIORIDADES Y ALERTAS
  const alerts = evaluateAlerts(data.indicators);
  if (alerts.length > 0) {
    currentY = drawTitle("PRIORIDADES Y ALERTAS", currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    alerts.slice(0, 5).forEach(alert => {
      const splitMsg = doc.splitTextToSize(`• ${alert.title}: ${alert.message}`, pageWidth - 2 * margin);
      doc.text(splitMsg, margin, currentY + 5);
      currentY += (splitMsg.length * 5) + 5;
    });
    currentY += 10;
  }

  // 4. CORRELACIONES CLÍNICAS
  const correlations = evaluateCorrelations(data.indicators);
  if (correlations.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 30; }
    currentY = drawTitle("CORRELACIONES CLÍNICAS (ORIENTATIVO)", currentY);
    
    correlations.forEach(c => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(c.title, margin, currentY + 5);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const obs = doc.splitTextToSize(c.observation, pageWidth - 2 * margin);
      doc.text(obs, margin, currentY);
      currentY += (obs.length * 5) + 5;
      
      doc.setFont("helvetica", "italic");
      doc.text("Sugerencias:", margin, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");
      c.suggestions.forEach(s => {
        doc.text(`- ${s}`, margin + 5, currentY);
        currentY += 5;
      });
      currentY += 5;
    });
  }

  // 5. RESULTADOS DETALLADOS
  doc.addPage();
  currentY = 30;
  currentY = drawTitle("RESULTADOS MÁS RECIENTES", currentY);

  const resultsData = data.indicators.map(it => {
    const last = it.points[it.points.length - 1];
    return [
      it.name,
      `${last.value} ${it.unit || ""}`,
      last.result.status.toUpperCase(),
      it.ref_display || `${it.ref_min ?? ""} - ${it.ref_max ?? ""}`
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Indicador", "Valor", "Estado", "Referencia"]],
    body: resultsData,
    theme: "striped",
    headStyles: { fillColor: [52, 73, 94] },
    margin: { left: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 6. TIMELINE / EVOLUCIÓN
  if (currentY > 200) { doc.addPage(); currentY = 30; }
  currentY = drawTitle("TIMELINE DE SALUD", currentY);
  
  const sortedStudies = [...data.studies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  sortedStudies.slice(0, 8).forEach(s => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${new Date(s.date).toLocaleDateString("es-MX", { month: "short", year: "numeric" }).toUpperCase()} - ${s.lab_name || "Lab General"}`, margin, currentY + 5);
    
    const studyResults = data.results.filter(r => r.study_id === s.id);
    const outOfRange = studyResults.filter(r => r.status === "alto" || r.status === "bajo");
    
    currentY += 10;
    doc.setFont("helvetica", "normal");
    if (outOfRange.length > 0) {
      doc.text(`Fuera de rango: ${outOfRange.map(r => r.indicator_name).join(", ")}`, margin + 5, currentY);
    } else {
      doc.text("Todos los indicadores registrados en rango normal.", margin + 5, currentY);
    }
    currentY += 8;
  });

  // Footer Disclaimer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  const disclaimer = "Nota: Este reporte es informativo y generado automáticamente. No sustituye la interpretación de un profesional médico.";
  doc.text(disclaimer, pageWidth / 2, footerY, { align: "center" });

  // Save
  doc.save(`Reporte_Salud_${new Date().toISOString().split("T")[0]}.pdf`);
}
