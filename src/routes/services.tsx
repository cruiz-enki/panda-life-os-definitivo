/**
 * **Ruta** — Servicios recurrentes del hogar (luz, internet, streaming…).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Trash2, Pencil, LayoutGrid, Building2, Calendar, Wallet } from "lucide-react";
import { useServices, HomeService } from "@/hooks/use-services";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN } from "@/lib/finance-types";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { toast } from "sonner";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Servicios · ENKI LIFE OS" },
      { name: "description", content: "Gestiona los servicios de tu hogar: internet, luz, agua y más." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { services, loading, createService, updateService, deleteService } = useServices();
  const { expenses } = useFinance();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingService, setEditingService] = useState<HomeService | null>(null);

  const householdExpenses = expenses.filter(
    (e: any) => e.category === "Casa" || e.category === "Hogar" || e.note?.toLowerCase().includes("servicio")
  );

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Hogar
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Servicios de Casa 🔌</h1>
          <p className="mt-2 text-muted-foreground">Lleva el control de tus pagos y suscripciones del hogar.</p>
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Servicios Activos
          </h2>
          
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
              No has registrado ningún servicio aún.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  onEdit={() => setEditingService(service)}
                  onDelete={() => {
                    if (confirm(`¿Eliminar ${service.name}?`)) deleteService(service.id);
                  }}
                />
              ))}
            </div>
          )}

          <div className="pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> Historial de Pagos
              </h2>
              <ExpenseForm 
                trigger={
                  <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Registrar pago
                  </button>
                }
              />
            </div>
            <div className="space-y-3">
              {householdExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  No hay historial de pagos registrados como 'Casa' o 'Hogar'.
                </div>
              ) : (
                householdExpenses.slice(0, 10).map((e: any) => (
                  <div key={e.id} className="p-4 rounded-xl border border-border bg-card/50 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{e.note || e.category}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(e.date + "T12:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatMXN(e.amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Próximos Vencimientos
          </h2>
          <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-4">
            {services.filter(s => s.status === 'active' && s.due_day).sort((a, b) => (a.due_day || 0) - (b.due_day || 0)).map(s => {
              const today = new Date().getDate();
              const isPast = (s.due_day || 0) < today;
              return (
                <div key={s.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <p className="text-sm font-medium leading-none">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Día {s.due_day}</p>
                    </div>
                  </div>
                  {isPast ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold uppercase">Atrasado</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">Pendiente</span>
                  )}
                </div>
              );
            })}
            {services.filter(s => s.status === 'active' && s.due_day).length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Configura días de pago en tus servicios.</p>
            )}
          </div>
        </div>
      </div>

      {(openDialog || editingService) && (
        <ServiceDialog 
          initial={editingService || undefined} 
          onClose={() => { setOpenDialog(false); setEditingService(null); }} 
          onSave={async (data) => {
            if (editingService) {
              await updateService(editingService.id, data);
            } else {
              await createService(data);
            }
            setOpenDialog(false);
            setEditingService(null);
            toast.success(editingService ? "Servicio actualizado" : "Servicio creado");
          }}
        />
      )}
    </div>
  );
}

function ServiceCard({ service, onEdit, onDelete }: { service: HomeService; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
            {service.emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{service.name}</h3>
            <p className="text-xs text-muted-foreground">{service.provider || "Proveedor no definido"}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Costo mensual</p>
          <p className="font-display font-bold text-primary">{formatMXN(service.monthly_cost)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Día de pago</p>
          <p className="font-display font-bold">Día {service.due_day || "--"}</p>
        </div>
      </div>
    </div>
  );
}

function ServiceDialog({ initial, onClose, onSave }: { initial?: HomeService; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [provider, setProvider] = useState(initial?.provider || "");
  const [cost, setCost] = useState(initial?.monthly_cost || 0);
  const [dueDay, setDueDay] = useState(initial?.due_day || 1);
  const [emoji, setEmoji] = useState(initial?.emoji || "🔌");
  const [category, setCategory] = useState(initial?.category || "Servicios");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">{initial ? "Editar Servicio" : "Nuevo Servicio"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave({ name, provider, monthly_cost: cost, due_day: dueDay, emoji, category, status: initial?.status || 'active' }); }}>
          <div className="grid grid-cols-[70px_1fr] gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Emoji</label>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-full text-center text-2xl py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internet, Agua, Netflix..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Proveedor</label>
            <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Telmex, CFE, Spotify..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Costo Mensual</label>
              <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Día de pago (1-31)</label>
              <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-[1.02] transition-transform">
              {initial ? "Guardar cambios" : "Crear servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
