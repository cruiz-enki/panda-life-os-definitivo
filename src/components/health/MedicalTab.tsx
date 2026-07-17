/**
 * **Componente** — Pestaña Médica dentro de Salud: doctores, diagnósticos, tratamientos.
 */
import { useState, useMemo } from "react";
import { useMedical } from "@/hooks/use-medical";
import { useHealth } from "@/hooks/use-health";
import {
  DIAGNOSIS_STATUS_LABEL,
  DIAGNOSIS_STATUS_COLOR,
  TREATMENT_STATUS_LABEL,
  STUDY_STATUS_LABEL,
  type Doctor,
  type Diagnosis,
  type Consultation,
  type Treatment,
  type Study,
  type Appointment,
  type DiagnosisStatus,
  type TreatmentStatus,
  type StudyStatus,
} from "@/lib/medical-types";
import { todayCDMX } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Stethoscope, UserPlus, ClipboardList, FileText, Beaker, CalendarClock,
  Plus, Trash2, Phone, Mail, MapPin, AlertCircle, ExternalLink, Edit3, Pill,
} from "lucide-react";
import { toast } from "sonner";

type SubTab = "dashboard" | "doctors" | "consultations" | "diagnoses" | "treatments" | "studies" | "appointments";

export function MedicalTab() {
  const m = useMedical();
  const h = useHealth();
  const [sub, setSub] = useState<SubTab>("dashboard");

  const subs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Resumen", icon: <Stethoscope className="w-4 h-4" /> },
    { id: "appointments", label: "Citas", icon: <CalendarClock className="w-4 h-4" /> },
    { id: "consultations", label: "Consultas", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "diagnoses", label: "Diagnósticos", icon: <AlertCircle className="w-4 h-4" /> },
    { id: "treatments", label: "Tratamientos", icon: <FileText className="w-4 h-4" /> },
    { id: "studies", label: "Estudios", icon: <Beaker className="w-4 h-4" /> },
    { id: "doctors", label: "Doctores", icon: <UserPlus className="w-4 h-4" /> },
  ];

  if (m.loading) return <div className="text-muted-foreground text-sm">Cargando bitácora médica…</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {subs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              sub === s.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {sub === "dashboard" && <Dashboard m={m} setSub={setSub} />}
      {sub === "doctors" && <DoctorsView m={m} />}
      {sub === "consultations" && <ConsultationsView m={m} h={h} />}
      {sub === "diagnoses" && <DiagnosesView m={m} />}
      {sub === "treatments" && <TreatmentsView m={m} />}
      {sub === "studies" && <StudiesView m={m} />}
      {sub === "appointments" && <AppointmentsView m={m} />}
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ m, setSub }: { m: ReturnType<typeof useMedical>; setSub: (s: SubTab) => void }) {
  const today = todayCDMX();
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        icon={<CalendarClock className="w-4 h-4" />}
        label="Próximas citas"
        value={m.upcomingAppointments.length.toString()}
        sub={m.upcomingAppointments[0] ? `Próx: ${m.upcomingAppointments[0].date}` : "Sin citas"}
        color="oklch(0.72 0.15 240)"
        onClick={() => setSub("appointments")}
      />
      <SummaryCard
        icon={<AlertCircle className="w-4 h-4" />}
        label="Dx activos"
        value={m.activeDiagnoses.length.toString()}
        sub={`${m.diagnoses.filter((d) => d.status === "resolved").length} resueltos`}
        color="oklch(0.7 0.2 25)"
        onClick={() => setSub("diagnoses")}
      />
      <SummaryCard
        icon={<Beaker className="w-4 h-4" />}
        label="Estudios pendientes"
        value={m.pendingStudies.length.toString()}
        sub={`${m.studies.length} totales`}
        color="oklch(0.78 0.15 70)"
        onClick={() => setSub("studies")}
      />
      <SummaryCard
        icon={<UserPlus className="w-4 h-4" />}
        label="Doctores"
        value={m.doctors.length.toString()}
        sub={`${m.consultations.length} consultas`}
        color="oklch(0.78 0.18 150)"
        onClick={() => setSub("doctors")}
      />

      {/* Próximas citas detalle */}
      <div className="md:col-span-2 lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" /> Próximas citas
        </h3>
        {m.upcomingAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes citas programadas.</p>
        ) : (
          <ul className="space-y-2">
            {m.upcomingAppointments.slice(0, 5).map((a) => {
              const doc = m.doctors.find((d) => d.id === a.doctor_id);
              return (
                <li key={a.id} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/30">
                  <div className="text-2xl">📅</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.date} {a.time && `· ${a.time}`} {doc && `· ${doc.name}`}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Alertas */}
      <div className="md:col-span-2 lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" /> Alertas
        </h3>
        <ul className="space-y-2 text-sm">
          {m.pendingStudies.length > 0 && (
            <li className="flex items-center gap-2 text-amber-500">
              <Beaker className="w-4 h-4" /> {m.pendingStudies.length} estudio(s) pendiente(s)
            </li>
          )}
          {m.activeDiagnoses.length > 0 && (
            <li className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4" /> {m.activeDiagnoses.length} diagnóstico(s) activo(s)
            </li>
          )}
          {m.upcomingAppointments.filter((a) => a.date === today).length > 0 && (
            <li className="flex items-center gap-2 text-primary">
              <CalendarClock className="w-4 h-4" /> Tienes cita hoy
            </li>
          )}
          {m.pendingStudies.length === 0 && m.activeDiagnoses.length === 0 && (
            <li className="text-muted-foreground">Todo en orden ✨</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-glow transition-all">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1.5" style={{ color }}>{icon} {label}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </button>
  );
}

// ============================================================
// DOCTORS
// ============================================================
function DoctorsView({ m }: { m: ReturnType<typeof useMedical> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const empty: Omit<Doctor, "id"> = { name: "", specialty: "", clinic: "", phone: "", email: "", notes: "", emoji: "🩺" };
  const [form, setForm] = useState<Omit<Doctor, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Doctor) => { setEditing(d); const { id, ...rest } = d; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    const err = editing ? await m.doctorOps.update(editing.id, form) : await m.doctorOps.create(form);
    if (err) toast.error(err.message); else { toast.success(editing ? "Doctor actualizado" : "Doctor agregado"); setOpen(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Mis doctores ({m.doctors.length})</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {m.doctors.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="text-2xl">{d.emoji}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.specialty || "Sin especialidad"}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(d)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm(`Eliminar a ${d.name}?`)) m.doctorOps.remove(d.id); }} className="p-1 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {(d.clinic || d.phone || d.email) && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {d.clinic && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{d.clinic}</div>}
                {d.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{d.phone}</div>}
                {d.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{d.email}</div>}
              </div>
            )}
            {d.notes && <div className="mt-2 text-xs text-muted-foreground italic line-clamp-2">{d.notes}</div>}
          </div>
        ))}
        {m.doctors.length === 0 && <div className="text-sm text-muted-foreground col-span-full">Aún no agregas doctores.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar doctor" : "Nuevo doctor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={4} /></div>
              <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            </div>
            <div><Label>Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
            <div><Label>Clínica / hospital</Label><Input value={form.clinic} onChange={(e) => setForm({ ...form, clinic: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// CONSULTATIONS
// ============================================================
function ConsultationsView({ m, h }: { m: ReturnType<typeof useMedical>; h: ReturnType<typeof useHealth> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Consultation | null>(null);
  const empty: Omit<Consultation, "id"> = {
    date: todayCDMX(), doctor_id: null, reason: "", symptoms: "", diagnosis: "",
    indications: "", prescribed_meds: "", requested_studies: "", next_appointment: null, notes: "",
  };
  const [form, setForm] = useState<Omit<Consultation, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Consultation) => { setEditing(c); const { id, ...rest } = c; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!form.date) { toast.error("Fecha requerida"); return; }
    const err = editing ? await m.consultOps.update(editing.id, form) : await m.consultOps.create(form);
    if (err) toast.error(err.message); else { toast.success("Consulta guardada"); setOpen(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Consultas ({m.consultations.length})</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva</Button>
      </div>
      <div className="space-y-3">
        {m.consultations.map((c) => {
          const doc = m.doctors.find((d) => d.id === c.doctor_id);
          
          const convertToMedication = async () => {
            if (!c.prescribed_meds) return;
            
            // Intentar extraer información del texto (ej: "Mounjaro 5mg 1 inyección")
            const text = c.prescribed_meds;
            const doseMatch = text.match(/(\d+(\.\d+)?\s*(mg|g|ml|ug))/i);
            const qtyMatch = text.match(/(\d+)\s*(tableta|pastilla|inyección|scoop|unidad|ml|gota)/i);
            
            const extractedName = text.split(/(\d+)/)[0].trim();
            const extractedDose = doseMatch ? doseMatch[0] : "";
            const extractedQty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
            const extractedUnit = qtyMatch ? qtyMatch[2] : "toma";

            if (!confirm(`¿Convertir "${c.prescribed_meds}" en un medicamento activo?\n\nNombre: ${extractedName}\nDosis: ${extractedDose}\nCantidad: ${extractedQty} ${extractedUnit}`)) return;
            
            const err = await h.createMedication({
              name: extractedName || text,
              active: true,
              frequency: "daily",
              times_per_day: 1,
              dose: extractedDose,
              unit: extractedUnit,
              quantity: extractedQty,
              schedule_times: ["08:00"],
              emoji: text.toLowerCase().includes('inyecc') ? "💉" : "💊",
              reminder_enabled: true,
              notes: `Prescrito en consulta del ${c.date}${c.indications ? `. Indicaciones: ${c.indications}` : ""}`,
              color: "oklch(0.7 0.2 25)",
            } as any);
            
            if (err) toast.error("Error al crear medicamento");
            else toast.success("Medicamento añadido a tu perfil de salud");
          };

          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.date} {doc && `· ${doc.emoji} ${doc.name}`}</div>
                  <div className="font-medium mt-0.5">{c.reason || "Consulta"}</div>
                  {c.diagnosis && <div className="text-sm mt-1"><strong>Dx:</strong> {c.diagnosis}</div>}
                  {c.indications && <div className="text-sm mt-1 text-muted-foreground"><strong>Indicaciones:</strong> {c.indications}</div>}
                  {c.prescribed_meds && (
                    <div className="text-sm mt-1 flex items-center gap-2">
                      <div className="flex-1"><strong>Medicamentos:</strong> {c.prescribed_meds}</div>
                      <button 
                        onClick={convertToMedication}
                        title="Añadir a medicación activa"
                        className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                      >
                        <Pill className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {c.requested_studies && (
                    <div className="text-sm mt-1 flex items-center gap-2">
                      <div className="flex-1"><strong>Estudios:</strong> {c.requested_studies}</div>
                      <button 
                        onClick={async () => {
                          if (!confirm(`¿Crear "${c.requested_studies}" como estudio pendiente?`)) return;
                          const err = await m.studyOps.create({
                            name: c.requested_studies,
                            type: "solicitado",
                            date: c.date,
                            doctor_id: c.doctor_id,
                            result: "",
                            file_url: "",
                            status: "pending",
                            notes: `Solicitado en consulta del ${c.date}`,
                          });
                          if (err) toast.error("Error al crear estudio");
                          else toast.success("Estudio añadido a pendientes");
                        }}
                        title="Añadir a estudios pendientes"
                        className="p-1 rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors shrink-0"
                      >
                        <Beaker className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {c.next_appointment && <div className="text-xs mt-2 text-primary">📅 Próxima: {c.next_appointment}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Eliminar consulta?")) m.consultOps.remove(c.id); }} className="p-1 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {m.consultations.length === 0 && <div className="text-sm text-muted-foreground">No hay consultas registradas.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar consulta" : "Nueva consulta"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Fecha *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>Doctor</Label>
                <Select value={form.doctor_id ?? "none"} onValueChange={(v) => setForm({ ...form, doctor_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin doctor</SelectItem>
                    {m.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.emoji} {d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Motivo</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div><Label>Síntomas</Label><Textarea rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} /></div>
            <div><Label>Diagnóstico</Label><Textarea rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
            <div><Label>Indicaciones</Label><Textarea rows={2} value={form.indications} onChange={(e) => setForm({ ...form, indications: e.target.value })} /></div>
            <div><Label>Medicamentos recetados</Label><Textarea rows={2} placeholder="Nombre del medicamento" value={form.prescribed_meds} onChange={(e) => setForm({ ...form, prescribed_meds: e.target.value })} /></div>
            <div><Label>Estudios solicitados</Label><Textarea rows={2} placeholder="Nombre del estudio" value={form.requested_studies} onChange={(e) => setForm({ ...form, requested_studies: e.target.value })} /></div>
            <div><Label>Próxima cita</Label><Input type="date" value={form.next_appointment ?? ""} onChange={(e) => setForm({ ...form, next_appointment: e.target.value || null })} /></div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// DIAGNOSES
// ============================================================
function DiagnosesView({ m }: { m: ReturnType<typeof useMedical> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Diagnosis | null>(null);
  const empty: Omit<Diagnosis, "id"> = { name: "", doctor_id: null, date: todayCDMX(), status: "active", notes: "" };
  const [form, setForm] = useState<Omit<Diagnosis, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Diagnosis) => { setEditing(d); const { id, ...rest } = d; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    const err = editing ? await m.dxOps.update(editing.id, form) : await m.dxOps.create(form);
    if (err) toast.error(err.message); else { toast.success("Diagnóstico guardado"); setOpen(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Diagnósticos ({m.diagnoses.length})</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {m.diagnoses.map((d) => {
          const doc = m.doctors.find((doc) => doc.id === d.doctor_id);
          return (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.date} {doc && `· ${doc.name}`}</div>
                  <span
                    className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `color-mix(in oklab, ${DIAGNOSIS_STATUS_COLOR[d.status]} 20%, transparent)`, color: DIAGNOSIS_STATUS_COLOR[d.status] }}
                  >
                    {DIAGNOSIS_STATUS_LABEL[d.status]}
                  </span>
                  {d.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(d)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Eliminar diagnóstico?")) m.dxOps.remove(d.id); }} className="p-1 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {m.diagnoses.length === 0 && <div className="text-sm text-muted-foreground col-span-full">Sin diagnósticos.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} diagnóstico</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DiagnosisStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="in_treatment">En tratamiento</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Doctor</Label>
              <Select value={form.doctor_id ?? "none"} onValueChange={(v) => setForm({ ...form, doctor_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin doctor</SelectItem>
                  {m.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.emoji} {d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notas</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// TREATMENTS
// ============================================================
function TreatmentsView({ m }: { m: ReturnType<typeof useMedical> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const empty: Omit<Treatment, "id"> = {
    name: "", type: "", doctor_id: null, diagnosis_id: null, frequency: "", duration: "",
    start_date: null, end_date: null, indications: "", result: "", status: "active", notes: "",
  };
  const [form, setForm] = useState<Omit<Treatment, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (t: Treatment) => { setEditing(t); const { id, ...rest } = t; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    const err = editing ? await m.treatOps.update(editing.id, form) : await m.treatOps.create(form);
    if (err) toast.error(err.message); else { toast.success("Tratamiento guardado"); setOpen(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Tratamientos ({m.treatments.length})</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {m.treatments.map((t) => {
          const dx = m.diagnoses.find((d) => d.id === t.diagnosis_id);
          return (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.type} {t.frequency && `· ${t.frequency}`} {t.duration && `· ${t.duration}`}
                  </div>
                  {dx && <div className="text-xs mt-1 text-muted-foreground">Para: {dx.name}</div>}
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-secondary">
                    {TREATMENT_STATUS_LABEL[t.status]}
                  </span>
                  {t.result && <div className="text-xs mt-2"><strong>Resultado:</strong> {t.result}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Eliminar?")) m.treatOps.remove(t.id); }} className="p-1 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {m.treatments.length === 0 && <div className="text-sm text-muted-foreground col-span-full">Sin tratamientos.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} tratamiento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Tipo</Label><Input placeholder="Fisio, terapia..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TreatmentStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Frecuencia</Label><Input placeholder="2x semana" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} /></div>
              <div><Label>Duración</Label><Input placeholder="6 semanas" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Inicio</Label><Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value || null })} /></div>
              <div><Label>Fin</Label><Input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} /></div>
            </div>
            <div>
              <Label>Diagnóstico relacionado</Label>
              <Select value={form.diagnosis_id ?? "none"} onValueChange={(v) => setForm({ ...form, diagnosis_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {m.diagnoses.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Indicaciones</Label><Textarea rows={2} value={form.indications} onChange={(e) => setForm({ ...form, indications: e.target.value })} /></div>
            <div><Label>Resultado</Label><Textarea rows={2} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// STUDIES
// ============================================================
function StudiesView({ m }: { m: ReturnType<typeof useMedical> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Study | null>(null);
  const empty: Omit<Study, "id"> = {
    name: "", type: "", date: todayCDMX(), doctor_id: null, result: "", file_url: "", status: "pending", notes: "",
  };
  const [form, setForm] = useState<Omit<Study, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Study) => { setEditing(s); const { id, ...rest } = s; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    const err = editing ? await m.studyOps.update(editing.id, form) : await m.studyOps.create(form);
    if (err) toast.error(err.message); else { toast.success("Estudio guardado"); setOpen(false); }
  };

  const toggleStatus = async (s: Study) => {
    await m.studyOps.update(s.id, { status: s.status === "pending" ? "done" : "pending" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Estudios ({m.studies.length})</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo</Button>
      </div>
      <div className="space-y-3">
        {m.studies.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(s)}
                    className={`text-xs px-2 py-0.5 rounded-full ${s.status === "done" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {STUDY_STATUS_LABEL[s.status]}
                  </button>
                  <span className="font-medium">{s.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.date} {s.type && `· ${s.type}`}</div>
                {s.result && <div className="text-sm mt-1"><strong>Resultado:</strong> {s.result}</div>}
                {s.file_url && (
                  <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Ver archivo
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Eliminar?")) m.studyOps.remove(s.id); }} className="p-1 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {m.studies.length === 0 && <div className="text-sm text-muted-foreground">Sin estudios.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} estudio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input placeholder="Biometría hemática" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Tipo</Label><Input placeholder="Lab, RX..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StudyStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="done">Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Doctor</Label>
              <Select value={form.doctor_id ?? "none"} onValueChange={(v) => setForm({ ...form, doctor_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin doctor</SelectItem>
                  {m.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.emoji} {d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Resultado</Label><Textarea rows={3} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} /></div>
            <div><Label>Link al archivo (Drive, etc.)</Label><Input type="url" placeholder="https://..." value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// APPOINTMENTS
// ============================================================
function AppointmentsView({ m }: { m: ReturnType<typeof useMedical> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const empty: Omit<Appointment, "id"> = {
    title: "", doctor_id: null, date: todayCDMX(), time: "", location: "", reason: "", notes: "",
    reminder_enabled: true, reminder_days_before: 1, status: "scheduled",
  };
  const [form, setForm] = useState<Omit<Appointment, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); const { id, ...rest } = a; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!form.title.trim() || !form.date) { toast.error("Título y fecha requeridos"); return; }
    const err = editing ? await m.apptOps.update(editing.id, form) : await m.apptOps.create(form);
    if (err) toast.error(err.message); else { toast.success("Cita guardada"); setOpen(false); }
  };

  const today = todayCDMX();
  const upcoming = m.appointments.filter((a) => a.date >= today && a.status === "scheduled");
  const past = m.appointments.filter((a) => a.date < today || a.status !== "scheduled")
    .sort((a, b) => b.date.localeCompare(a.date));

  const convert = async (a: Appointment) => {
    if (!confirm("¿Convertir esta cita en una nueva consulta?")) return;
    const err = await m.consultOps.create({
      date: a.date,
      doctor_id: a.doctor_id,
      reason: a.reason || a.title,
      symptoms: "",
      diagnosis: "",
      indications: "",
      prescribed_meds: "",
      requested_studies: "",
      next_appointment: null,
      notes: a.notes,
    });
    if (err) {
      toast.error("Error al crear consulta");
    } else {
      await m.apptOps.update(a.id, { status: "completed" });
      toast.success("Cita convertida en consulta");
    }
  };

  const renderItem = (a: Appointment) => {
    const doc = m.doctors.find((d) => d.id === a.doctor_id);
    const isToday = a.date === today;
    const isPast = a.date < today;

    return (
      <div key={a.id} className={`rounded-xl border p-4 shadow-card ${isToday ? "border-primary/40 bg-primary/5" : "border-border bg-card"} ${a.status === "completed" ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium">{a.title}</div>
              {a.status === "completed" && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">Completada</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {a.date} {a.time && `· ${a.time}`} {doc && `· ${doc.name}`}
            </div>
            {a.location && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</div>}
            {a.reason && <div className="text-sm mt-1">{a.reason}</div>}
            {a.reminder_enabled && a.status === "scheduled" && <div className="text-xs text-primary mt-1">🔔 Recordatorio {a.reminder_days_before}d antes</div>}
          </div>
          <div className="flex gap-1 shrink-0">
            {a.status === "scheduled" && (
              <button 
                onClick={() => convert(a)} 
                title="Convertir a consulta"
                className="p-1 hover:text-primary transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => openEdit(a)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
            <button onClick={() => { if (confirm("Eliminar cita?")) m.apptOps.remove(a.id); }} className="p-1 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Citas ({m.appointments.length})</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva</Button>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Próximas</h4>
          <div className="space-y-2">{upcoming.map(renderItem)}</div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-4">Pasadas o Completadas</h4>
          <div className="space-y-2 opacity-70">{past.slice(0, 10).map(renderItem)}</div>
        </div>
      )}
      {m.appointments.length === 0 && <div className="text-sm text-muted-foreground">Sin citas.</div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} cita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Fecha *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Hora</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Doctor</Label>
                <Select value={form.doctor_id ?? "none"} onValueChange={(v) => setForm({ ...form, doctor_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin doctor</SelectItem>
                    {m.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.emoji} {d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Lugar</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Motivo</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setForm({ ...form, reminder_enabled: e.target.checked })} />
                Recordatorio
              </label>
              {form.reminder_enabled && (
                <div className="flex items-center gap-1 text-sm">
                  <Input type="number" min={0} max={30} className="w-16 h-8" value={form.reminder_days_before} onChange={(e) => setForm({ ...form, reminder_days_before: Number(e.target.value) })} />
                  <span className="text-muted-foreground">días antes</span>
                </div>
              )}
            </div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
