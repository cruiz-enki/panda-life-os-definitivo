/**
 * **Componente** — Pestaña de síntomas/malestares (pensada para Mounjaro).
 */
import { useMemo, useState } from "react";
import { useHealth } from "@/hooks/use-health";
import {
  COMMON_SYMPTOMS,
  DURATION_LABEL,
  INTENSITY_COLOR,
  TIME_OF_DAY_LABEL,
  type Symptom,
  type SymptomDuration,
  type SymptomTimeOfDay,
} from "@/lib/symptom-types";
import { todayCDMX } from "@/lib/date-utils";
import { Trash2, Plus, AlertCircle, TrendingUp, Sparkles, Pill, Utensils, Moon } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";

function autoTimeOfDay(): SymptomTimeOfDay {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "night";
}

export function SymptomsTab({ h }: { h: ReturnType<typeof useHealth> }) {
  const today = todayCDMX();
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState(2);
  const [timeOfDay, setTimeOfDay] = useState<SymptomTimeOfDay>(autoTimeOfDay());
  const [duration, setDuration] = useState<SymptomDuration>("brief");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const reset = () => {
    setDescription("");
    setIntensity(2);
    setTimeOfDay(autoTimeOfDay());
    setDuration("brief");
    setTags([]);
    setNotes("");
  };

  const handleAdd = async () => {
    if (description.trim().length === 0 && tags.length === 0) {
      toast.error("Agrega un atajo o describe el malestar");
      return;
    }
    const finalDescription =
      description.trim() ||
      tags.map((t) => COMMON_SYMPTOMS.find((s) => s.tag === t)?.label ?? t).join(", ");

    const err = await h.createSymptom({
      date,
      description: finalDescription,
      intensity,
      time_of_day: timeOfDay,
      duration,
      tags,
      notes,
    });
    if (err) toast.error("Error al guardar");
    else {
      toast.success("Malestar registrado");
      reset();
    }
  };

  // Atajos rápidos: registra un síntoma con un click (intensidad por defecto 2)
  const quickAdd = async (tag: string, label: string) => {
    const err = await h.createSymptom({
      date: today,
      description: label,
      intensity: 2,
      time_of_day: autoTimeOfDay(),
      duration: "brief",
      tags: [tag],
      notes: "",
    });
    if (err) toast.error("Error al guardar");
    else toast.success(`${label} registrado`);
  };

  const todaySymptoms = useMemo(
    () => h.symptoms.filter((s) => s.date === today).sort((a, b) => a.time_of_day.localeCompare(b.time_of_day)),
    [h.symptoms, today],
  );

  // Análisis semanal
  const weekStats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const cutoff = weekAgo.toISOString().slice(0, 10);
    const weekSyms = h.symptoms.filter((s) => s.date >= cutoff);

    const byTag: Record<string, { label: string; emoji: string; count: number; avgIntensity: number; totalIntensity: number }> = {};
    weekSyms.forEach((s) => {
      const list = s.tags.length > 0 ? s.tags : ["otro"];
      list.forEach((t) => {
        const meta = COMMON_SYMPTOMS.find((c) => c.tag === t);
        if (!byTag[t]) byTag[t] = { label: meta?.label ?? s.description.slice(0, 24), emoji: meta?.emoji ?? "📝", count: 0, avgIntensity: 0, totalIntensity: 0 };
        byTag[t].count += 1;
        byTag[t].totalIntensity += s.intensity;
      });
    });
    Object.values(byTag).forEach((v) => { v.avgIntensity = v.count > 0 ? v.totalIntensity / v.count : 0; });
    const ranked = Object.entries(byTag)
      .map(([tag, v]) => ({ tag, ...v }))
      .sort((a, b) => b.count - a.count);

    // serie diaria últimos 7 días
    const days: { label: string; date: string; count: number; avgIntensity: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const ds = h.symptoms.filter((s) => s.date === d);
      const avg = ds.length > 0 ? ds.reduce((a, s) => a + s.intensity, 0) / ds.length : 0;
      days.push({
        label: new Date(d + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short" }),
        date: d,
        count: ds.length,
        avgIntensity: Number(avg.toFixed(1)),
      });
    }

    return { ranked, days, total: weekSyms.length };
  }, [h.symptoms]);

  // Conexiones simples: relación con últimas comidas chatarra y dosis
  const insights = useMemo(() => {
    const out: string[] = [];
    const last7Cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const recentSyms = h.symptoms.filter((s) => s.date >= last7Cutoff);
    if (recentSyms.length === 0) return out;

    // 1. Síntomas vs comida chatarra
    const junkDays = new Set(h.meals.filter((m) => m.date >= last7Cutoff && m.classification === "chatarra").map((m) => m.date));
    const symsAfterJunk = recentSyms.filter((s) => junkDays.has(s.date)).length;
    if (junkDays.size > 0 && symsAfterJunk > 0) {
      const pct = Math.round((symsAfterJunk / recentSyms.length) * 100);
      out.push(`🍔 ${pct}% de tus malestares ocurrieron en días con comida chatarra (${symsAfterJunk}/${recentSyms.length}).`);
    }

    // 2. Días posteriores a dosis (medicación activa con frecuencia weekly = típico Mounjaro)
    const weeklyMeds = h.medications.filter((m) => m.active && m.frequency === "weekly");
    if (weeklyMeds.length > 0) {
      const doseDays = new Set(
        h.medLogs.filter((l) => l.date >= last7Cutoff && weeklyMeds.some((m) => m.id === l.medication_id) && l.taken).map((l) => l.date),
      );
      if (doseDays.size > 0) {
        let after = 0;
        recentSyms.forEach((s) => {
          for (const dose of doseDays) {
            const diffDays = Math.round((new Date(s.date).getTime() - new Date(dose).getTime()) / 86400000);
            if (diffDays >= 0 && diffDays <= 2) { after += 1; break; }
          }
        });
        if (after > 0) {
          const pct = Math.round((after / recentSyms.length) * 100);
          out.push(`💉 ${pct}% de tus malestares aparecen en los 0-2 días post-dosis (${after}/${recentSyms.length}). Patrón típico de Mounjaro.`);
        }
      }
    }

    // 3. Sueño bajo
    // (no tenemos sleep aquí pero podríamos cruzar con energy si quisieras)

    // 4. Top síntoma
    if (weekStats.ranked.length > 0) {
      const top = weekStats.ranked[0];
      out.push(`${top.emoji} Tu síntoma más frecuente esta semana: **${top.label}** (${top.count}× · intensidad promedio ${top.avgIntensity.toFixed(1)}/5).`);
    }

    return out;
  }, [h.symptoms, h.meals, h.medications, h.medLogs, weekStats]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ============ FORM RÁPIDO ============ */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold mb-1">Registrar malestar</h2>
        <p className="text-xs text-muted-foreground mb-5">Sin fricción. Usa atajos o describe libremente.</p>

        {/* Atajos quick-add */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Atajos rápidos</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((s) => {
              const active = tags.includes(s.tag);
              return (
                <button
                  key={s.tag}
                  onClick={() => toggleTag(s.tag)}
                  onDoubleClick={() => quickAdd(s.tag, s.label)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-glow"
                      : "bg-secondary text-foreground border-border hover:border-primary/50"
                  }`}
                  title="Click para seleccionar · Doble click para guardar al instante"
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Tip: doble click guarda al instante con intensidad 2.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: náusea ligera después de comer..."
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Intensidad: <span style={{ color: INTENSITY_COLOR(intensity) }} className="font-bold">{intensity}/5</span>
            </label>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setIntensity(n)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                    intensity === n ? "border-primary scale-105" : "border-border opacity-60"
                  }`}
                  style={{ background: intensity === n ? INTENSITY_COLOR(n) : "transparent", color: intensity === n ? "oklch(0.15 0.02 200)" : undefined }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Momento</label>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {(["morning", "afternoon", "night"] as SymptomTimeOfDay[]).map((t) => (
                  <button key={t} onClick={() => setTimeOfDay(t)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                      timeOfDay === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                    }`}>
                    {TIME_OF_DAY_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Duración</label>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {(["brief", "hours", "all_day"] as SymptomDuration[]).map((t) => (
                  <button key={t} onClick={() => setDuration(t)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                      duration === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                    }`}>
                    {DURATION_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fecha</label>
              <DatePicker date={date ? parseISO(date) : undefined} setDate={(d) => setDate(d ? d.toISOString().split('T')[0] : "")} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Notas (opcional)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿qué lo provocó?"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:border-primary outline-none" />
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="mt-2 w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Guardar malestar
          </button>
        </div>
      </section>

      {/* ============ LISTA DEL DÍA ============ */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" /> Hoy
          </h3>
          <span className="text-xs text-muted-foreground">{todaySymptoms.length} {todaySymptoms.length === 1 ? "registro" : "registros"}</span>
        </div>
        {todaySymptoms.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Sin malestares registrados hoy. ¡Bien! 💚
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {todaySymptoms.map((s) => (
              <SymptomRow key={s.id} s={s} onDelete={() => h.deleteSymptom(s.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ============ RESUMEN SEMANAL ============ */}
      <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Resumen semanal
          </h3>
          <span className="text-xs text-muted-foreground">{weekStats.total} malestares · últimos 7 días</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Frecuencia diaria & intensidad</h4>
            {weekStats.total === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Sin datos esta semana</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekStats.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" />
                    <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={11} />
                    <YAxis stroke="oklch(0.65 0.02 200)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.018 200)", border: "1px solid oklch(0.28 0.02 200)", borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" name="Cantidad" fill="oklch(0.72 0.15 240)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avgIntensity" name="Intensidad media" fill="oklch(0.7 0.22 25)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Top síntomas</h4>
            {weekStats.ranked.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay datos.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {weekStats.ranked.slice(0, 8).map((r) => (
                  <div key={r.tag} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/40 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span>{r.emoji}</span>
                      <span className="font-medium">{r.label}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.count}× · <span style={{ color: INTENSITY_COLOR(r.avgIntensity) }}>{r.avgIntensity.toFixed(1)}/5</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ INSIGHTS / CONEXIONES ============ */}
      <section className="lg:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold mb-4 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Conexiones e insights
        </h3>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Registra más malestares para detectar patrones con tu alimentación, sueño y dosis de tratamiento.</p>
        ) : (
          <div className="space-y-2">
            {insights.map((msg, i) => (
              <div key={i} className="px-4 py-3 rounded-xl bg-card border border-border text-sm" dangerouslySetInnerHTML={{ __html: msg.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
            ))}
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5" /> Comidas</div>
          <div className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" /> Dosis</div>
          <div className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Sueño</div>
        </div>
      </section>
    </div>
  );
}

function SymptomRow({ s, onDelete }: { s: Symptom; onDelete: () => void }) {
  const tagsLabels = s.tags.map((t) => COMMON_SYMPTOMS.find((c) => c.tag === t)).filter(Boolean);
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
      <div
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
        style={{ background: INTENSITY_COLOR(s.intensity), color: "oklch(0.15 0.02 200)" }}
      >
        {s.intensity}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{s.description || "(sin descripción)"}</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
          <span>{TIME_OF_DAY_LABEL[s.time_of_day]}</span>
          <span>· {DURATION_LABEL[s.duration]}</span>
          {tagsLabels.length > 0 && (
            <span>· {tagsLabels.map((t) => `${t!.emoji} ${t!.label}`).join(" ")}</span>
          )}
        </div>
        {s.notes && <div className="text-xs text-muted-foreground italic mt-0.5">"{s.notes}"</div>}
      </div>
      <button onClick={onDelete} className="shrink-0 text-destructive/70 hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
