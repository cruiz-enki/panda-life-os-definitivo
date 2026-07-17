/**
 * **Ruta** — Vehículos: registro, servicios, verificación, tenencia, seguros
 * y kilometraje.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Car, Plus, Trash2, Wrench, ShieldCheck, FileText, Fuel, AlertTriangle, Calendar, Gauge } from "lucide-react";
import { useVehicles, type VehicleEventKind } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehículos · ENKI LIFE OS" },
      { name: "description", content: "Servicios, verificación, tenencia, seguros y kilometraje de tus vehículos." },
    ],
  }),
  component: VehiclesPage,
});

const KIND_META: Record<VehicleEventKind, { label: string; icon: any; color: string }> = {
  service: { label: "Servicio", icon: Wrench, color: "text-blue-400" },
  verification: { label: "Verificación", icon: ShieldCheck, color: "text-green-400" },
  tenencia: { label: "Tenencia", icon: FileText, color: "text-amber-400" },
  insurance: { label: "Seguro", icon: ShieldCheck, color: "text-purple-400" },
  fuel: { label: "Gasolina", icon: Fuel, color: "text-orange-400" },
  incident: { label: "Siniestro", icon: AlertTriangle, color: "text-red-400" },
  other: { label: "Otro", icon: FileText, color: "text-muted-foreground" },
};

function VehiclesPage() {
  const { vehicles, events, upcoming, createVehicle, deleteVehicle, createEvent, deleteEvent } = useVehicles();
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [newEventOpen, setNewEventOpen] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>(vehicles[0]?.id ?? "upcoming");

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Car className="w-4 h-4" /> Hogar
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Vehículos 🚗</h1>
          <p className="text-muted-foreground mt-1">Servicios, verificación, tenencia, seguros y kilometraje.</p>
        </div>
        <Dialog open={newVehicleOpen} onOpenChange={setNewVehicleOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nuevo vehículo</Button>
          </DialogTrigger>
          <VehicleForm
            onSubmit={async (v) => {
              const err = await createVehicle(v);
              if (err) toast.error(err.message);
              else {
                toast.success("Vehículo agregado");
                setNewVehicleOpen(false);
              }
            }}
          />
        </Dialog>
      </header>

      {/* Próximos vencimientos */}
      {upcoming.length > 0 && (
        <Card className="p-5 mb-6 border-amber-500/30 bg-amber-500/5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Próximos vencimientos
          </h2>
          <div className="space-y-2">
            {upcoming.slice(0, 8).map((e) => {
              const v = vehicles.find((x) => x.id === e.vehicle_id);
              const meta = KIND_META[e.kind];
              const urgent = e.daysUntil <= 15;
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-background/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <meta.icon className={`w-4 h-4 ${meta.color}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{v?.emoji} {v?.name} · {meta.label}</div>
                    </div>
                  </div>
                  <Badge variant={urgent ? "destructive" : "secondary"}>
                    {e.daysUntil < 0 ? `Vencido hace ${-e.daysUntil}d` : e.daysUntil === 0 ? "Hoy" : `${e.daysUntil}d`}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {vehicles.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aún no tienes vehículos registrados.</p>
        </Card>
      ) : (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="flex-wrap h-auto">
            {vehicles.map((v) => (
              <TabsTrigger key={v.id} value={v.id}>
                {v.emoji} {v.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {vehicles.map((v) => {
            const vEvents = events.filter((e) => e.vehicle_id === v.id);
            const totalCost = vEvents.reduce((s, e) => s + Number(e.cost ?? 0), 0);
            return (
              <TabsContent key={v.id} value={v.id} className="mt-6 space-y-6">
                <Card className="p-5">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-semibold">{v.emoji} {v.name}</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {[v.brand, v.model, v.year].filter(Boolean).join(" · ")}
                        {v.plate && ` · ${v.plate}`}
                      </p>
                      {v.vin && <p className="text-xs text-muted-foreground mt-1">VIN: {v.vin}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Gauge className="w-3 h-3" /> Kilometraje
                      </div>
                      <div className="text-2xl font-semibold">{v.current_km.toLocaleString()} km</div>
                      <div className="text-xs text-muted-foreground mt-1">Total gastado: {formatMXN(totalCost)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Dialog open={newEventOpen === v.id} onOpenChange={(o) => setNewEventOpen(o ? v.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo evento</Button>
                      </DialogTrigger>
                      <EventForm
                        vehicleId={v.id}
                        currentKm={v.current_km}
                        onSubmit={async (payload) => {
                          const err = await createEvent(payload);
                          if (err) toast.error(err.message);
                          else {
                            toast.success("Evento registrado");
                            setNewEventOpen(null);
                          }
                        }}
                      />
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm(`¿Eliminar ${v.name}?`)) return;
                        await deleteVehicle(v.id);
                        toast.success("Eliminado");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Historial</h3>
                  {vEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin eventos aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {vEvents.map((e) => {
                        const meta = KIND_META[e.kind];
                        return (
                          <div key={e.id} className="flex items-start justify-between gap-3 p-3 rounded-md border border-border/40">
                            <div className="flex items-start gap-3 min-w-0">
                              <meta.icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{e.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(e.date + "T00:00:00").toLocaleDateString("es-MX")} · {meta.label}
                                  {e.km ? ` · ${e.km.toLocaleString()} km` : ""}
                                  {e.provider ? ` · ${e.provider}` : ""}
                                </div>
                                {e.note && <div className="text-xs text-muted-foreground mt-1">{e.note}</div>}
                                {(e.next_due_date || e.next_due_km) && (
                                  <div className="text-xs mt-1 text-amber-400">
                                    Próximo: {e.next_due_date ? new Date(e.next_due_date + "T00:00:00").toLocaleDateString("es-MX") : ""}
                                    {e.next_due_km ? ` · ${e.next_due_km.toLocaleString()} km` : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-start gap-2">
                              {e.cost != null && <div className="text-sm font-medium">{formatMXN(Number(e.cost))}</div>}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={async () => {
                                  await deleteEvent(e.id);
                                  toast.success("Eliminado");
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function VehicleForm({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [form, setForm] = useState({
    name: "", brand: "", model: "", year: "", plate: "", color: "", vin: "",
    current_km: "0", fuel_type: "gasolina", emoji: "🚗", note: "", status: "active",
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nuevo vehículo</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Nombre (alias)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mi Mazda" /></div>
        <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></div>
        <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></div>
        <div><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
        <div><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
        <div><Label>Año</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
        <div><Label>Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
        <div className="col-span-2"><Label>VIN</Label><Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></div>
        <div><Label>Km actual</Label><Input type="number" value={form.current_km} onChange={(e) => setForm({ ...form, current_km: e.target.value })} /></div>
        <div>
          <Label>Combustible</Label>
          <Select value={form.fuel_type} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gasolina">Gasolina</SelectItem>
              <SelectItem value="diesel">Diésel</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
              <SelectItem value="electrico">Eléctrico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Nota</Label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
      </div>
      <Button
        onClick={() =>
          onSubmit({
            ...form,
            year: form.year ? Number(form.year) : null,
            current_km: Number(form.current_km) || 0,
          })
        }
        disabled={!form.name}
      >
        Guardar
      </Button>
    </DialogContent>
  );
}

function EventForm({ vehicleId, currentKm, onSubmit }: { vehicleId: string; currentKm: number; onSubmit: (v: any) => void }) {
  const [form, setForm] = useState({
    kind: "service" as VehicleEventKind,
    title: "",
    date: new Date().toISOString().slice(0, 10),
    km: String(currentKm),
    cost: "",
    provider: "",
    note: "",
    next_due_date: "",
    next_due_km: "",
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nuevo evento</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as VehicleEventKind })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(KIND_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="col-span-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Servicio 20,000 km" /></div>
        <div><Label>Kilometraje</Label><Input type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} /></div>
        <div><Label>Costo (MXN)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
        <div className="col-span-2"><Label>Proveedor / Taller</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
        <div><Label>Próxima fecha</Label><Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></div>
        <div><Label>Próximo km</Label><Input type="number" value={form.next_due_km} onChange={(e) => setForm({ ...form, next_due_km: e.target.value })} /></div>
        <div className="col-span-2"><Label>Notas</Label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
      </div>
      <Button
        onClick={() =>
          onSubmit({
            vehicle_id: vehicleId,
            kind: form.kind,
            title: form.title,
            date: form.date,
            km: form.km ? Number(form.km) : null,
            cost: form.cost ? Number(form.cost) : null,
            provider: form.provider || null,
            note: form.note || null,
            next_due_date: form.next_due_date || null,
            next_due_km: form.next_due_km ? Number(form.next_due_km) : null,
          })
        }
        disabled={!form.title}
      >
        Guardar
      </Button>
    </DialogContent>
  );
}
