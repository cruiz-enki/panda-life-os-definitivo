/**
 * **Componente** — Importador de mediciones corporales (CSV/JSON desde báscula inteligente).
 */
import React, { useState } from "react";
import { Upload, FileText, Loader2, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useHealth } from "@/hooks/use-health";
import type { BodyEntry } from "@/lib/health-types";

interface BodyImporterProps {
  onImportComplete: () => void;
}

export function BodyImporter({ onImportComplete }: BodyImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const { upsertBodyEntry } = useHealth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    toast.info("Envíame la foto por el chat y yo generaré el JSON para que lo pegues aquí.");
    setIsAnalyzing(false);
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast.error("Pega el JSON de los resultados");
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(jsonInput);
      
      const entryDate = data.date || data.fecha || data.fecha_medicion;
      if (!entryDate) {
        throw new Error("El JSON debe incluir una fecha (formato YYYY-MM-DD)");
      }

      const payload: Partial<BodyEntry> & { date: string } = {
        date: entryDate,
        notes: data.notes || data.notas || "",
        weight: data.weight || data.peso,
        bmi: data.bmi || data.imc,
        body_fat: data.body_fat || data.porcentaje_grasa,
        muscle_mass: data.muscle_mass || data.masa_muscular,
        visceral_fat: data.visceral_fat || data.grasa_visceral,
        metabolic_age: data.metabolic_age || data.edad_metabolica,
        measured_at: data.measured_at || data.hora,
        device_source: data.device_source || data.dispositivo,
        measurement_id: data.measurement_id || data.id_medicion,
        age: data.age || data.edad,
        sex: data.sex || data.sexo,
        height: data.height || data.altura,
        total_body_water: data.total_body_water || data.agua_corporal,
        protein_mass: data.protein_mass || data.proteinas,
        mineral_mass: data.mineral_mass || data.minerales,
        bone_mass: data.bone_mass || data.masa_osea,
        fat_mass: data.fat_mass || data.masa_grasa,
        fat_free_mass: data.fat_free_mass || data.masa_libre_grasa,
        total_muscle_mass: data.total_muscle_mass || data.masa_muscular_total,
        skeletal_muscle_mass: data.skeletal_muscle_mass || data.masa_muscular_esqueletica,
        lean_body_weight: data.lean_body_weight || data.peso_sin_grasa,
        ...data
      };

      const allowedKeys = new Set([
        "date", "notes", "weight", "bmi", "body_fat", "muscle_mass", "visceral_fat", "metabolic_age",
        "measured_at", "device_source", "measurement_id", "age", "sex", "height",
        "total_body_water", "protein_mass", "mineral_mass", "bone_mass", "fat_mass",
        "fat_free_mass", "total_muscle_mass", "skeletal_muscle_mass", "lean_body_weight",
        "obesity_degree", "body_type", "inbody_score", "visceral_fat_level", "subcutaneous_fat",
        "whr", "seg_fat_arm_left", "seg_fat_arm_right", "seg_fat_trunk", "seg_fat_leg_left", "seg_fat_leg_right",
        "seg_muscle_arm_left", "seg_muscle_arm_right", "seg_muscle_trunk", "seg_muscle_leg_left", "seg_muscle_leg_right",
        "seg_muscle_pct_arm_left", "seg_muscle_pct_arm_right", "seg_muscle_pct_trunk", "seg_muscle_pct_leg_left", "seg_muscle_pct_leg_right",
        "bmr", "smi", "target_weight", "weight_control", "fat_control", "muscle_control", "optimal_fat_target", "optimal_muscle_target",
        "imp_20khz_arm_right", "imp_20khz_arm_left", "imp_20khz_trunk", "imp_20khz_leg_right", "imp_20khz_leg_left",
        "imp_100khz_arm_right", "imp_100khz_arm_left", "imp_100khz_trunk", "imp_100khz_leg_right", "imp_100khz_leg_left"
      ]);

      const cleanPayload: any = {};
      Object.keys(payload).forEach(key => {
        if (allowedKeys.has(key)) {
          cleanPayload[key] = payload[key as keyof typeof payload];
        }
      });

      const error = await upsertBodyEntry(cleanPayload);

      if (error) throw error;

      toast.success("Resultados importados correctamente");
      setJsonInput("");
      onImportComplete();
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err.message || "Error al procesar el JSON. Asegúrate de que sea un formato válido.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 mb-2">
        <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
          <Camera className="w-6 h-6 text-primary mb-2" />
          <span className="text-xs font-medium">Subir foto</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-secondary/50">
          <FileText className="w-6 h-6 text-muted-foreground mb-2" />
          <span className="text-xs font-medium text-muted-foreground">Pegar JSON</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Datos extraídos (JSON)
      </div>
      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder='{ "date": "2024-05-29", "weight": 75.5, ... }'
        className="w-full h-40 p-3 rounded-xl bg-secondary/50 border border-border font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
      />
      <button
        onClick={handleImport}
        disabled={isImporting || isAnalyzing}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isImporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Importar resultados
          </>
        )}
      </button>
      <p className="text-[10px] text-center text-muted-foreground">
        Acepta formatos de InBody, Renpho y otros procesados por la IA.
      </p>
    </div>
  );
}
