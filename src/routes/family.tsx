/**
 * **Ruta** — Familia: mascotas y miembros.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Trash2, Pencil, Heart, Calendar, Wallet, ShoppingCart, Syringe, ShowerHead, Stethoscope, Activity } from "lucide-react";
import { usePets, Pet, PetLog, PetType, PetLogType } from "@/hooks/use-pets";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Familia · ENKI LIFE OS" },
      { name: "description", content: "Control de mascotas: vacunas, baños, comida y gastos." },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  const { pets, logs, loading, createPet, updatePet, deletePet, createLog, deleteLog } = usePets();
  const [openPetDialog, setOpenPetDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | "all">("all");

  const filteredLogs = selectedPetId === "all" ? logs : logs.filter(l => l.pet_id === selectedPetId);
  const totalExpenses = logs.reduce((sum, l) => sum + Number(l.cost || 0), 0);

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Heart className="w-4 h-4" /> Familia
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Nuestras Mascotas 🐾</h1>
          <p className="mt-2 text-muted-foreground">Control de salud, higiene y suministros.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenLogDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-primary/50 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar Evento
          </button>
          <button
            onClick={() => setOpenPetDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nueva Mascota
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Mascotas</h2>
            <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
              Gastos totales: <span className="font-bold text-foreground">{formatMXN(totalExpenses)}</span>
            </div>
          </div>
          
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : pets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
              No has registrado ninguna mascota aún.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {pets.map((pet) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  onEdit={() => setEditingPet(pet)}
                  onDelete={() => {
                    if (confirm(`¿Eliminar a ${pet.name}?`)) deletePet(pet.id);
                  }}
                  logs={logs.filter(l => l.pet_id === pet.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="font-display text-xl font-bold">Historial</h2>
             <select 
               value={selectedPetId} 
               onChange={(e) => setSelectedPetId(e.target.value)}
               className="text-xs bg-transparent border-none focus:ring-0 text-primary font-medium cursor-pointer"
             >
               <option value="all">Todos</option>
               {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
          </div>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">Sin eventos registrados.</p>
            ) : (
              filteredLogs.slice(0, 15).map((log) => (
                <LogItem key={log.id} log={log} petName={pets.find(p => p.id === log.pet_id)?.name || "Mascota"} onDelete={() => deleteLog(log.id)} />
              ))
            )}
          </div>
        </div>
      </div>

      {(openPetDialog || editingPet) && (
        <PetDialog 
          initial={editingPet || undefined} 
          onClose={() => { setOpenPetDialog(false); setEditingPet(null); }} 
          onSave={async (data) => {
            if (editingPet) await updatePet(editingPet.id, data);
            else await createPet(data);
            setOpenPetDialog(false); setEditingPet(null);
            toast.success(editingPet ? "Mascota actualizada" : "Mascota registrada");
          }}
        />
      )}

      {openLogDialog && (
        <LogDialog 
          pets={pets}
          onClose={() => setOpenLogDialog(false)} 
          onSave={async (data) => {
            await createLog(data);
            setOpenLogDialog(false);
            toast.success("Evento registrado");
          }}
        />
      )}
    </div>
  );
}

function PetCard({ pet, onEdit, onDelete, logs }: { pet: Pet; onEdit: () => void; onDelete: () => void; logs: PetLog[] }) {
  const lastVaccine = logs.filter(l => l.type === 'vaccine').sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastBath = logs.filter(l => l.type === 'bath').sort((a, b) => b.date.localeCompare(a.date))[0];
  
  return (
    <div className="group p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl">
            {pet.emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{pet.name}</h3>
            <p className="text-xs text-muted-foreground">{pet.breed || (pet.type === 'dog' ? 'Perro' : 'Gato')}</p>
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

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1.5"><Syringe className="w-3 h-3" /> Última Vacuna</span>
          <span className="font-medium">{lastVaccine ? new Date(lastVaccine.date + "T12:00").toLocaleDateString("es-MX") : "No reg."}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1.5"><ShowerHead className="w-3 h-3" /> Último Baño</span>
          <span className="font-medium">{lastBath ? new Date(lastBath.date + "T12:00").toLocaleDateString("es-MX") : "No reg."}</span>
        </div>
        {pet.weight && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="w-3 h-3" /> Peso</span>
            <span className="font-medium">{pet.weight} kg</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LogItem({ log, petName, onDelete }: { log: PetLog; petName: string; onDelete: () => void }) {
  const icons = {
    vaccine: <Syringe className="w-3.5 h-3.5 text-blue-500" />,
    bath: <ShowerHead className="w-3.5 h-3.5 text-cyan-500" />,
    food_buy: <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />,
    vet: <Stethoscope className="w-3.5 h-3.5 text-rose-500" />,
    weight: <Activity className="w-3.5 h-3.5 text-amber-500" />,
    grooming: <ShowerHead className="w-3.5 h-3.5 text-indigo-500" />,
    other: <Plus className="w-3.5 h-3.5 text-muted-foreground" />,
  };

  const labels = {
    vaccine: "Vacuna", bath: "Baño", food_buy: "Comida", vet: "Veterinario", weight: "Peso", grooming: "Estética", other: "Otro"
  };

  return (
    <div className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card/30 hover:bg-card/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          {icons[log.type]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-none">{petName} · {labels[log.type]}</p>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            {new Date(log.date + "T12:00").toLocaleDateString("es-MX")} {log.note && `· ${log.note}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {log.cost > 0 && <span className="text-xs font-bold text-primary">{formatMXN(log.cost)}</span>}
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function PetDialog({ initial, onClose, onSave }: { initial?: Pet; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<PetType>(initial?.type || "dog");
  const [breed, setBreed] = useState(initial?.breed || "");
  const [weight, setWeight] = useState(initial?.weight || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "🐶");
  const [birthDate, setBirthDate] = useState(initial?.birth_date || "");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">{initial ? "Editar Mascota" : "Nueva Mascota"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave({ name, type, breed, weight: weight ? Number(weight) : null, emoji, birth_date: birthDate || null }); }}>
          <div className="grid grid-cols-[70px_1fr] gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Emoji</label>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-full text-center text-2xl py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Toby, Michi..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</label>
              <select value={type} onChange={(e) => { setType(e.target.value as PetType); if (!initial) setEmoji(e.target.value === 'dog' ? '🐶' : '🐱'); }} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="dog">Perro</option>
                <option value="cat">Gato</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Raza</label>
              <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Ej: Husky..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Peso (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Nacimiento</label>
              <DatePicker date={birthDate ? parseISO(birthDate) : undefined} setDate={(d) => setBirthDate(d ? d.toISOString().split('T')[0] : "")} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-[1.02] transition-transform">
              {initial ? "Guardar cambios" : "Registrar mascota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LogDialog({ pets, onClose, onSave }: { pets: Pet[]; onClose: () => void; onSave: (data: any) => void }) {
  const [petId, setPetId] = useState(pets[0]?.id || "");
  const [type, setType] = useState<PetLogType>("bath");
  const [note, setNote] = useState("");
  const [cost, setCost] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Registrar Evento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave({ pet_id: petId, type, note, cost, date }); }}>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Mascota</label>
            <select value={petId} onChange={(e) => setPetId(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" required>
              <option value="" disabled>Selecciona mascota</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Evento</label>
            <select value={type} onChange={(e) => setType(e.target.value as PetLogType)} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="bath">🛀 Baño</option>
              <option value="vaccine">💉 Vacuna</option>
              <option value="food_buy">🛒 Compra de Comida</option>
              <option value="vet">🩺 Veterinario</option>
              <option value="weight">⚖️ Registro de Peso</option>
              <option value="grooming">✂️ Estética</option>
              <option value="other">➕ Otro</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Nota</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Comida bulto 10kg, Vacuna rabia..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fecha</label>
              <DatePicker date={date ? parseISO(date) : undefined} setDate={(d) => setDate(d ? d.toISOString().split('T')[0] : "")} />
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
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
