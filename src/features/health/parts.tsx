/**
 * **Feature** — Componentes (parts) del módulo **Salud**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useHealth } from "@/hooks/use-health";
import {
  MEAL_CLASS_META,
  MEAL_TYPE_LABEL,
  FREQUENCY_LABEL,
  type MedicationFrequency,
} from "@/lib/health-types";
import { useAppState, avgEnergy } from "@/lib/storage";
import { todayCDMX } from "@/lib/date-utils";
import { DateQuickPicker } from "@/components/DateQuickPicker";
import { MedicalTab } from "@/components/health/MedicalTab";
import { SymptomsTab } from "@/components/health/SymptomsTab";
import { BodyImporter } from "@/components/health/BodyImporter";
import { HealthHeader } from "@/components/health/HealthHeader";
import {
  Heart,
  Scale,
  Utensils,
  Pill,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  Ruler,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { toast } from "sonner";

type Tab = "overview" | "body" | "meds" | "symptoms" | "medical" | "insights";

const VALID_TABS: Tab[] = ["overview", "body", "meds", "symptoms", "medical", "insights"];

export function HealthPage() {
  const h = useHealth();
  const { state } = useAppState();
  const location = useLocation();
  const today = todayCDMX();

  const tab = useMemo(() => {
    const hash = location.hash.replace(/^#/, "");
    return (VALID_TABS as string[]).includes(hash) ? (hash as Tab) : "overview";
  }, [location.hash]);

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Salud</p>
        <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Tu bienestar en un lugar 💚</h1>
        <p className="mt-2 text-muted-foreground">Composición corporal, alimentación, medicación e insights.</p>
      </header>

      <HealthHeader />

      {tab === "overview" && <OverviewTab h={h} />}
      {tab === "body" && <BodyTab h={h} today={today} />}
      {tab === "meds" && <MedsTab h={h} today={today} />}
      {tab === "symptoms" && <SymptomsTab h={h} />}
      {tab === "medical" && <MedicalTab />}
      {tab === "insights" && <InsightsTab h={h} energy={state.energy} />}
    </div>
  );
}

function OverviewTab({ h }: { h: ReturnType<typeof useHealth> }) {
  const s = h.snapshot;
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Scale className="w-4 h-4" />}
        label="Peso actual"
        value={s.weightLatest != null ? `${s.weightLatest} kg` : "—"}
        sub={s.weightDelta30d != null ? `${s.weightDelta30d > 0 ? "+" : ""}${s.weightDelta30d.toFixed(1)} kg / 30d` : "Sin histórico"}
        trend={s.weightDelta30d == null ? null : s.weightDelta30d <= 0 ? "down" : "up"}
        color="oklch(0.78 0.18 150)"
      />
      <StatCard
        icon={<Sparkles className="w-4 h-4" />}
        label="Proteína hoy"
        value={`${Math.round(s.proteinToday)}g`}
        sub="Meta sugerida: 100-120g"
        color="oklch(0.7 0.22 295)"
      />
      <StatCard
        icon={<Heart className="w-4 h-4" />}
        label="Agua hoy"
        value={`${(s.waterToday / 1000).toFixed(1)}L`}
        sub={`${Math.round(s.waterToday / 250)} / 10 vasos`}
        color="oklch(0.72 0.15 240)"
      />
      <StatCard
        icon={<Pill className="w-4 h-4" />}
        label="Adherencia"
        value={`${Math.round(s.medAdherenceWeekPct * 100)}%`}
        sub={`${s.medsTakenThisWeekCount} tomas / semana`}
        color="oklch(0.78 0.15 70)"
      />

      <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" /> Hidratación rápida
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Mantenerte hidratado es clave. Has bebido <strong className="text-foreground">{(s.waterToday / 1000).toFixed(1)}L</strong> hoy.
            </p>
            <div className="flex flex-wrap gap-2">
              {[250, 500, 750].map((ml) => (
                <button
                  key={ml}
                  onClick={() => h.logWater(new Date().toISOString().slice(0, 10), s.waterToday + ml)}
                  className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 text-xs font-medium transition-colors border border-border"
                >
                  +{ml}ml
                </button>
              ))}
              <button
                onClick={() => h.logWater(new Date().toISOString().slice(0, 10), 0)}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-destructive/20 text-xs font-medium transition-colors border border-border"
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-64 h-3 rounded-full bg-secondary overflow-hidden border border-border">
            <div 
              className="h-full bg-primary shadow-glow transition-all duration-500" 
              style={{ width: `${Math.min(100, (s.waterToday / 2500) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, trend, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; trend?: "up" | "down" | null; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1.5" style={{ color }}>{icon} {label}</span>
        {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-destructive" />}
        {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-primary" />}
      </div>
      <div className="font-display text-3xl font-bold mt-2" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

type BodyFieldSpec = {
  key: keyof import("@/lib/health-types").BodyEntry;
  label: string;
  step?: string;
  type?: "number" | "text" | "time";
};

type BodySection = {
  id: string;
  title: string;
  fields: BodyFieldSpec[];
};

const BODY_SECTIONS: BodySection[] = [
  {
    id: "general",
    title: "Datos generales",
    fields: [
      { key: "measured_at", label: "Hora de medición", type: "time" },
      { key: "device_source", label: "Dispositivo / fuente", type: "text" },
      { key: "measurement_id", label: "ID de medición", type: "text" },
      { key: "age", label: "Edad", step: "1" },
      { key: "sex", label: "Sexo (M/F)", type: "text" },
      { key: "height", label: "Altura (cm)", step: "0.1" },
    ],
  },
  {
    id: "basicos",
    title: "Básicos",
    fields: [
      { key: "weight", label: "Peso (kg)", step: "0.1" },
      { key: "bmi", label: "IMC", step: "0.1" },
      { key: "body_fat", label: "% Grasa corporal", step: "0.1" },
      { key: "muscle_mass", label: "Músculo (kg)", step: "0.1" },
      { key: "visceral_fat", label: "Grasa visceral", step: "0.1" },
      { key: "metabolic_age", label: "Edad metabólica", step: "1" },
    ],
  },
  {
    id: "composicion",
    title: "Composición corporal",
    fields: [
      { key: "total_body_water", label: "Agua corporal total (L)", step: "0.1" },
      { key: "protein_mass", label: "Proteínas (kg)", step: "0.1" },
      { key: "mineral_mass", label: "Minerales (kg)", step: "0.01" },
      { key: "bone_mass", label: "Masa ósea (kg)", step: "0.01" },
      { key: "fat_mass", label: "Masa grasa (kg)", step: "0.1" },
      { key: "fat_free_mass", label: "Masa libre de grasa (kg)", step: "0.1" },
      { key: "total_muscle_mass", label: "Masa muscular total (kg)", step: "0.1" },
      { key: "skeletal_muscle_mass", label: "Masa muscular esquelética (kg)", step: "0.1" },
      { key: "lean_body_weight", label: "Peso sin grasa (kg)", step: "0.1" },
    ],
  },
  {
    id: "obesidad",
    title: "Indicadores de obesidad",
    fields: [
      { key: "obesity_degree", label: "Grado de obesidad (%)", step: "0.1" },
      { key: "body_type", label: "Tipo de cuerpo", type: "text" },
      { key: "inbody_score", label: "Puntuación InBody", step: "1" },
    ],
  },
  {
    id: "visceral",
    title: "Grasa visceral y distribución",
    fields: [
      { key: "visceral_fat_level", label: "Nivel de grasa visceral", step: "0.1" },
      { key: "subcutaneous_fat", label: "Grasa subcutánea (kg)", step: "0.1" },
      { key: "whr", label: "WHR (cintura/cadera)", step: "0.01" },
      { key: "seg_fat_arm_left", label: "Grasa brazo izq (kg)", step: "0.01" },
      { key: "seg_fat_arm_right", label: "Grasa brazo der (kg)", step: "0.01" },
      { key: "seg_fat_trunk", label: "Grasa torso (kg)", step: "0.1" },
      { key: "seg_fat_leg_left", label: "Grasa pierna izq (kg)", step: "0.1" },
      { key: "seg_fat_leg_right", label: "Grasa pierna der (kg)", step: "0.1" },
    ],
  },
  {
    id: "musculo_seg",
    title: "Músculo segmental",
    fields: [
      { key: "seg_muscle_arm_left", label: "Músc. brazo izq (kg)", step: "0.01" },
      { key: "seg_muscle_arm_right", label: "Músc. brazo der (kg)", step: "0.01" },
      { key: "seg_muscle_trunk", label: "Músc. torso (kg)", step: "0.1" },
      { key: "seg_muscle_leg_left", label: "Músc. pierna izq (kg)", step: "0.1" },
      { key: "seg_muscle_leg_right", label: "Músc. pierna der (kg)", step: "0.1" },
      { key: "seg_muscle_pct_arm_left", label: "% estándar brazo izq", step: "0.1" },
      { key: "seg_muscle_pct_arm_right", label: "% estándar brazo der", step: "0.1" },
      { key: "seg_muscle_pct_trunk", label: "% estándar torso", step: "0.1" },
      { key: "seg_muscle_pct_leg_left", label: "% estándar pierna izq", step: "0.1" },
      { key: "seg_muscle_pct_leg_right", label: "% estándar pierna der", step: "0.1" },
    ],
  },
  {
    id: "metabolismo",
    title: "Metabolismo",
    fields: [
      { key: "bmr", label: "Tasa metabólica basal (kcal)", step: "1" },
      { key: "smi", label: "SMI (kg/m²)", step: "0.01" },
    ],
  },
  {
    id: "objetivos",
    title: "Control de peso / objetivos",
    fields: [
      { key: "target_weight", label: "Peso objetivo (kg)", step: "0.1" },
      { key: "weight_control", label: "Control de peso (kg)", step: "0.1" },
      { key: "fat_control", label: "Control de grasa (kg)", step: "0.1" },
      { key: "muscle_control", label: "Control muscular (kg)", step: "0.1" },
      { key: "optimal_fat_target", label: "Masa grasa óptima (kg)", step: "0.1" },
      { key: "optimal_muscle_target", label: "Masa muscular óptima (kg)", step: "0.1" },
    ],
  },
  {
    id: "medidas",
    title: "Medidas corporales (cm)",
    fields: [
      { key: "cintura", label: "Cintura", step: "0.1" },
      { key: "cuello", label: "Cuello", step: "0.1" },
      { key: "pecho", label: "Pecho", step: "0.1" },
      { key: "cadera", label: "Cadera", step: "0.1" },
      { key: "brazo_izq", label: "Brazo Izq", step: "0.1" },
      { key: "brazo_der", label: "Brazo Der", step: "0.1" },
      { key: "antebrazo_izq", label: "Antebrazo Izq", step: "0.1" },
      { key: "antebrazo_der", label: "Antebrazo Der", step: "0.1" },
      { key: "muneca", label: "Muñeca", step: "0.1" },
      { key: "muslo_izq", label: "Muslo Izq", step: "0.1" },
      { key: "muslo_der", label: "Muslo Der", step: "0.1" },
      { key: "pantorrilla_izq", label: "Pantorrilla Izq", step: "0.1" },
      { key: "pantorrilla_der", label: "Pantorrilla Der", step: "0.1" },
    ],
  },
  {
    id: "impedancia",
    title: "Impedancia bioeléctrica (Ω)",
    fields: [
      { key: "imp_20khz_arm_right", label: "20 kHz · Brazo der", step: "0.1" },
      { key: "imp_20khz_arm_left", label: "20 kHz · Brazo izq", step: "0.1" },
      { key: "imp_20khz_trunk", label: "20 kHz · Torso", step: "0.1" },
      { key: "imp_20khz_leg_right", label: "20 kHz · Pierna der", step: "0.1" },
      { key: "imp_20khz_leg_left", label: "20 kHz · Pierna izq", step: "0.1" },
      { key: "imp_100khz_arm_right", label: "100 kHz · Brazo der", step: "0.1" },
      { key: "imp_100khz_arm_left", label: "100 kHz · Brazo izq", step: "0.1" },
      { key: "imp_100khz_trunk", label: "100 kHz · Torso", step: "0.1" },
      { key: "imp_100khz_leg_right", label: "100 kHz · Pierna der", step: "0.1" },
      { key: "imp_100khz_leg_left", label: "100 kHz · Pierna izq", step: "0.1" },
    ],
  },
];

const TEXT_KEYS = new Set(["device_source", "measurement_id", "sex", "body_type", "measured_at"]);

function BodyTab({ h, today }: { h: ReturnType<typeof useHealth>; today: string }) {
  const [date, setDate] = useState(today);
  const [showImporter, setShowImporter] = useState(false);
  const existing = h.body.find((e) => e.date === date);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ basicos: true });

  useMemo(() => {
    const e = h.body.find((x) => x.date === date) as any;
    const next: Record<string, string> = {};
    BODY_SECTIONS.forEach((s) => s.fields.forEach((f) => {
      const v = e?.[f.key];
      next[f.key as string] = v == null ? "" : String(v);
    }));
    setValues(next);
    setNotes(e?.notes ?? "");
  }, [date, h.body]);

  const setVal = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const payload: Record<string, any> = { date, notes };
    BODY_SECTIONS.forEach((s) => s.fields.forEach((f) => {
      const raw = values[f.key as string] ?? "";
      if (TEXT_KEYS.has(f.key as string)) {
        payload[f.key as string] = raw.trim() === "" ? null : raw;
      } else {
        if (raw.trim() === "") { payload[f.key as string] = null; return; }
        const n = Number(raw);
        if (Number.isNaN(n)) { payload[f.key as string] = null; return; }
        payload[f.key as string] = f.step === "1" ? Math.round(n) : n;
      }
    }));
    const err = await h.upsertBodyEntry(payload as any);
    if (err) toast.error("Error al guardar");
    else toast.success(existing ? "Registro actualizado" : "Registro guardado");
  };

  const toggle = (id: string) => setOpenSections((p) => ({ ...p, [id]: !p[id] }));

  const last30 = useMemo(() => {
    return [...h.body]
      .filter((e) => e.weight != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((e) => ({
        label: new Date(e.date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        peso: e.weight,
        grasa: e.body_fat,
        musculo: e.muscle_mass,
      }));
  }, [h.body]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Composición corporal</h2>
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {showImporter ? "Cerrar importador" : "Importar JSON"}
            </button>
          </div>

          {showImporter && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in zoom-in-95 duration-200">
              <BodyImporter onImportComplete={() => {
                setShowImporter(false);
                h.refresh();
              }} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha del estudio:</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          {BODY_SECTIONS.map((section) => {
            const open = !!openSections[section.id];
            return (
              <div key={section.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/40 hover:bg-secondary/70 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {section.id === "medidas" && <Ruler className="w-3.5 h-3.5" />}
                    {section.title}
                  </span>
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {open && (
                  <div className="p-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    {section.fields.map((f) => (
                      <BodyField
                        key={f.key as string}
                        label={f.label}
                        value={values[f.key as string] ?? ""}
                        onChange={(v) => setVal(f.key as string, v)}
                        type={f.type ?? "number"}
                        step={f.step}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="¿Cómo te sientes hoy?"
            className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none text-sm"
          />
        </div>
        <button
          onClick={handleSave}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform"
        >
          {existing ? "Actualizar" : "Guardar registro"}
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold mb-4">Evolución (últimos 30)</h3>
        {last30.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            Aún no hay registros
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" />
                <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={11} />
                <YAxis stroke="oklch(0.65 0.02 200)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.018 200)", border: "1px solid oklch(0.28 0.02 200)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="peso" stroke="oklch(0.78 0.18 150)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="grasa" stroke="oklch(0.7 0.2 25)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="musculo" stroke="oklch(0.72 0.15 240)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Histórico</h4>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {h.body.length === 0 && <p className="text-sm text-muted-foreground">Sin registros aún.</p>}
            {h.body.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/40 text-sm">
                <span className="font-medium">{new Date(e.date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="text-muted-foreground text-xs">
                  {e.weight != null && `${e.weight}kg`}
                  {e.body_fat != null && ` · ${e.body_fat}%`}
                  {e.muscle_mass != null && ` · ${e.muscle_mass}kg músc`}
                </span>
                <button onClick={() => h.deleteBodyEntry(e.id)} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function BodyField({ label, value, onChange, type = "number", step }: { label: string; value: string; onChange: (v: string) => void; type?: "number" | "text" | "time"; step?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        step={type === "number" ? (step ?? "any") : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
        placeholder="—"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, step }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step ?? "any"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
        placeholder="—"
      />
    </div>
  );
}

function MedsTab({ h, today }: { h: ReturnType<typeof useHealth>; today: string }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<MedicationFrequency>("daily");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([""]);
  const [emoji, setEmoji] = useState("💊");
  const [medNotes, setMedNotes] = useState("");

  const reset = () => {
    setName(""); setDose(""); setUnit(""); setQuantity(1); setFrequency("daily"); setTimesPerDay(1);
    setScheduleTimes([""]); setEmoji("💊"); setMedNotes(""); setShowForm(false);
  };

  const handleCreateMed = async () => {
    if (name.trim().length === 0) { toast.error("Pon un nombre"); return; }
    const err = await h.createMedication({
      name, dose, unit, quantity, frequency, times_per_day: timesPerDay,
      schedule_times: scheduleTimes.filter((t) => t.trim() !== ""),
      emoji, color: "oklch(0.7 0.15 200)", notes: medNotes, active: true,
      streak: 0, last_completed_date: null,
    });
    if (err) toast.error("Error al crear"); else { toast.success("Medicamento agregado"); reset(); }
  };

  const dayLogs = h.medLogs.filter((l) => l.date === selectedDate);
  const isTaken = (medId: string, time: string) =>
    dayLogs.some((l) => l.medication_id === medId && l.scheduled_time === time && l.taken);

  const takeDose = async (medId: string, time: string) => {
    if (isTaken(medId, time)) {
      const log = dayLogs.find((l) => l.medication_id === medId && l.scheduled_time === time);
      if (log) await h.deleteMedicationLog(log.id);
    } else {
      await h.logMedication({
        medication_id: medId, date: selectedDate, scheduled_time: time, taken: true,
        taken_at: new Date().toISOString(), notes: "",
      });
      toast.success("✓ Toma registrada");
    }
  };

  const isPast = selectedDate !== today;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold">Tomas {isPast ? "del día seleccionado" : "de hoy"}</h2>
            <p className="text-xs text-muted-foreground">Marca cada toma cuando lo hagas.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => h.refresh()}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium inline-flex items-center gap-2">
              Actualizar
            </button>
            <button onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl border border-border bg-secondary/30">
          <DateQuickPicker value={selectedDate} onChange={setSelectedDate} label="Marcar para" />
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl border border-primary/30 bg-secondary/30 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Cantidad</label>
                <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Medida</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="tableta, scoop..."
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Concentración</label>
                <input value={dose} onChange={(e) => setDose(e.target.value)} maxLength={50} placeholder="500mg"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Frecuencia</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value as MedicationFrequency)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none">
                  {(Object.keys(FREQUENCY_LABEL) as MedicationFrequency[]).map((f) => (
                    <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Tomas/día</label>
                <input type="number" min={1} max={6} value={timesPerDay}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(6, Number(e.target.value)));
                    setTimesPerDay(n);
                    setScheduleTimes((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ""));
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Horarios</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {scheduleTimes.map((t, i) => (
                  <input key={i} type="time" value={t}
                    onChange={(e) => setScheduleTimes((prev) => prev.map((x, idx) => idx === i ? e.target.value : x))}
                    className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Emoji</label>
                <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none text-center" />
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Notas</label>
                <input value={medNotes} onChange={(e) => setMedNotes(e.target.value)} maxLength={120}
                  placeholder="Tomar con alimentos…"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateMed}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Crear
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-lg bg-secondary text-sm">Cancelar</button>
            </div>
          </div>
        )}

        {h.medications.filter((m) => m.active).length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No tienes medicamentos. Crea uno para empezar.</p>
        )}

        <div className="space-y-3">
          {h.medications.filter((m) => m.active).map((med) => {
            const times = med.schedule_times.length > 0 ? med.schedule_times : ["—"];
            return (
              <div key={med.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{med.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{med.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {med.quantity || 1} {med.unit || 'unidad'}
                      </span>
                      {med.dose && <span className="text-xs text-muted-foreground">{med.dose}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="text-xs text-muted-foreground">{FREQUENCY_LABEL[med.frequency]}</div>
                      {med.streak > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-tight">
                          <Flame className="w-3 h-3" /> {med.streak} días
                        </div>
                      )}
                    </div>
                    {med.notes && <div className="text-xs text-muted-foreground mt-1 italic">{med.notes}</div>}
                  </div>
                  <button onClick={() => h.updateMedication(med.id, { active: false })}
                    className="text-xs text-muted-foreground hover:text-destructive">
                    Pausar
                  </button>
                  <button onClick={() => h.deleteMedication(med.id)} className="text-destructive/70 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {times.map((t) => {
                    const taken = isTaken(med.id, t);
                    return (
                      <button key={t} onClick={() => takeDose(med.id, t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1.5 ${
                          taken ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary"
                        }`}>
                        {taken && <Check className="w-3 h-3" />}
                        {t || "Toma"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {h.medications.filter((m) => !m.active).length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pausados</h4>
            <div className="space-y-1">
              {h.medications.filter((m) => !m.active).map((med) => (
                <div key={med.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/20 text-sm">
                  <span className="text-muted-foreground">{med.emoji} {med.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => h.updateMedication(med.id, { active: true })}
                      className="text-xs text-primary">Reactivar</button>
                    <button onClick={() => h.deleteMedication(med.id)} className="text-destructive/70 hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InsightsTab({ h, energy }: { h: ReturnType<typeof useHealth>; energy: ReturnType<typeof useAppState>["state"]["energy"] }) {
  const insights = useMemo(() => {
    const out: { type: "good" | "warn" | "info"; title: string; desc: string }[] = [];
    const s = h.snapshot;

    const last7Energy = energy.slice(-7);
    if (last7Energy.length >= 5) {
      const avgSleep = last7Energy.filter((e) => e.sleep != null).reduce((a, e) => a + (e.sleep ?? 0), 0) / last7Energy.filter((e) => e.sleep != null).length;
      const avgEn = last7Energy.reduce((a, e) => a + (avgEnergy(e) ?? 0), 0) / last7Energy.length;
      if (avgSleep >= 7 && avgEn >= 7) {
        out.push({ type: "good", title: "Sueño ↔ Energía", desc: `Cuando duermes bien (~${avgSleep.toFixed(1)}/10) tu energía promedio es alta (${avgEn.toFixed(1)}/10).` });
      } else if (avgSleep < 6) {
        out.push({ type: "warn", title: "Estás durmiendo poco", desc: `Promedio ${avgSleep.toFixed(1)}/10 de calidad de sueño en la última semana. Esto suele bajar la energía.` });
      }
    }

    if (s.junkMealsThisWeek >= 5) {
      out.push({ type: "warn", title: "Mucha comida chatarra", desc: `${s.junkMealsThisWeek} comidas chatarra esta semana. Considera reducir.` });
    }
    if (s.healthyMealsThisWeek >= 10 && s.junkMealsThisWeek <= 2) {
      out.push({ type: "good", title: "Excelente alimentación", desc: `${s.healthyMealsThisWeek} comidas saludables esta semana. ¡Sigue así!` });
    }

    if (s.activeMedsCount > 0) {
      if (s.medAdherenceWeekPct >= 0.9) {
        out.push({ type: "good", title: "Excelente adherencia", desc: `${Math.round(s.medAdherenceWeekPct * 100)}% de cumplimiento esta semana.` });
      } else if (s.medAdherenceWeekPct < 0.5) {
        out.push({ type: "warn", title: "Adherencia baja", desc: `Solo ${Math.round(s.medAdherenceWeekPct * 100)}% de tomas registradas. Configura recordatorios o revisa horarios.` });
      }
    }

    if (s.weightDelta30d != null) {
      if (Math.abs(s.weightDelta30d) > 3) {
        out.push({
          type: s.weightDelta30d > 0 ? "warn" : "info",
          title: `Cambio de peso ${s.weightDelta30d > 0 ? "+" : ""}${s.weightDelta30d.toFixed(1)} kg`,
          desc: `En los últimos 30 días. Revisa si es intencional.`,
        });
      }
    }

    if (out.length === 0) {
      out.push({ type: "info", title: "Sigue registrando", desc: "Necesitamos más datos para generar insights personalizados." });
    }
    return out;
  }, [h.snapshot, energy]);

  return (
    <div className="space-y-3">
      {insights.map((i, idx) => (
        <div key={idx} className={`rounded-2xl border p-5 shadow-card ${
          i.type === "good" ? "border-primary/40 bg-primary/5" :
          i.type === "warn" ? "border-destructive/40 bg-destructive/5" :
          "border-border bg-card"
        }`}>
          <div className="flex items-start gap-3">
            {i.type === "good" && <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
            {i.type === "warn" && <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
            {i.type === "info" && <Activity className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
            <div>
              <div className="font-display font-semibold">{i.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{i.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "oklch(0.21 0.018 200)",
  border: "1px solid oklch(0.28 0.02 200)",
  borderRadius: 12,
  fontSize: 12,
};
