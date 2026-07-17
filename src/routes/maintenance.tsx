/**
 * **Ruta** — Mantenimiento del hogar: preventivo y correctivo.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Trash2, Pencil, Wrench, Calendar as CalendarIcon, Wallet, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useMaintenance, HouseMaintenance, MaintenanceType, MaintenanceStatus } from "@/hooks/use-maintenance";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN } from "@/lib/finance-types";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Mantenimiento · ENKI LIFE OS" },
      { name: "description", content: "Registra mantenimientos preventivos y correctivos de tu hogar." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { maintenance, loading, createMaintenance, updateMaintenance, deleteMaintenance } = useMaintenance();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<HouseMaintenance | null>(null);

  const stats = {
    pending: maintenance.filter(m => m.status === 'pending').length,
    scheduled: maintenance.filter(m => m.status === 'scheduled').length,
    completed: maintenance.filter(m => m.status === 'completed').length,
    totalCost: maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0)
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Hogar
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Mantenimiento 🛠️</h1>
          <p className="mt-2 text-muted-foreground">Registra y programa mantenimientos preventivos y correctivos.</p>
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuevo Registro
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Clock className="w-4 h-4 text-amber-500" />} label="Pendientes" value={stats.pending.toString()} />
        <StatCard icon={<CalendarIcon className="w-4 h-4 text-blue-500" />} label="Programados" value={stats.scheduled.toString()} />
        <StatCard icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} label="Completados" value={stats.completed.toString()} />
        <StatCard icon={<Wallet className="w-4 h-4 text-primary" />} label="Inversión Total" value={formatMXN(stats.totalCost)} />
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : maintenance.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
            No hay registros de mantenimiento aún.
          </div>
        ) : (
          <div className="space-y-4">
            {maintenance.map((item) => (
              <MaintenanceCard 
                key={item.id} 
                item={item} 
                onEdit={() => setEditingItem(item)}
                onDelete={() => {
                  if (confirm(`¿Eliminar ${item.title}?`)) deleteMaintenance(item.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {(openDialog || editingItem) && (
        <MaintenanceDialog 
          initial={editingItem || undefined} 
          onClose={() => { setOpenDialog(false); setEditingItem(null); }} 
          onSave={async (data) => {
            if (editingItem) {
              await updateMaintenance(editingItem.id, data);
            } else {
              await createMaintenance(data);
            }
            setOpenDialog(false);
            setEditingItem(null);
            toast.success(editingItem ? "Registro actualizado" : "Registro creado");
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function MaintenanceCard({ item, onEdit, onDelete }: { item: HouseMaintenance; onEdit: () => void; onDelete: () => void }) {
  const typeColors = {
    preventative: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    corrective: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  };

  const statusIcons = {
    pending: <AlertCircle className="w-4 h-4 text-amber-500" />,
    scheduled: <Clock className="w-4 h-4 text-blue-500" />,
    completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  };

  return (
    <div className="group p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-secondary`}>
           {item.type === 'preventative' ? '🛡️' : '🔧'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-lg leading-tight truncate">{item.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${typeColors[item.type]}`}>
              {item.type === 'preventative' ? 'Preventivo' : 'Correctivo'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
               {statusIcons[item.status]}
               {item.status === 'pending' ? 'Pendiente' : item.status === 'scheduled' ? 'Programado' : 'Completado'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {new Date(item.date + "T12:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {item.cost > 0 && (
              <>
                <span>•</span>
                <span className="font-medium text-foreground">{formatMXN(item.cost)}</span>
              </>
            )}
          </div>
          {item.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{item.description}</p>}
        </div>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MaintenanceDialog({ initial, onClose, onSave }: { initial?: HouseMaintenance; onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState<MaintenanceType>(initial?.type || "preventative");
  const [status, setStatus] = useState<MaintenanceStatus>(initial?.status || "pending");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState(initial?.cost || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">{initial ? "Editar Registro" : "Nuevo Registro"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave({ title, description, type, status, date, cost }); }}>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Pintura de fachada, Cambio de filtros..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as MaintenanceType)} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="preventative">🛡️ Preventivo</option>
                <option value="corrective">🔧 Correctivo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as MaintenanceStatus)} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="pending">⚠️ Pendiente</option>
                <option value="scheduled">📅 Programado</option>
                <option value="completed">✅ Completado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fecha</label>
              <DatePicker 
                date={date ? parseISO(date) : undefined} 
                setDate={(d) => setDate(d ? d.toISOString().split('T')[0] : "")} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Costo</label>
              <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-[1.02] transition-transform">
              {initial ? "Guardar cambios" : "Crear registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
