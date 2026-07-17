/**
 * **Ruta** — Inventario de objetos mágicos del juego.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Trash2, Pencil, Box, Calendar as CalendarIcon, Wallet, Search, ShieldCheck, Tag, Info, FileText } from "lucide-react";
import { useHomeInventory, InventoryItem } from "@/hooks/use-home-inventory";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventario del Hogar · ENKI LIFE OS" },
      { name: "description", content: "Gestiona las garantías y detalles técnicos de tus compras del hogar." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { items, loading, createItem, updateItem, deleteItem } = useHomeInventory();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.model_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInvestment = items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const activeWarranties = items.filter(item => {
    if (!item.warranty_expiry) return false;
    return new Date(item.warranty_expiry) > new Date();
  }).length;

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Box className="w-4 h-4" /> Hogar
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Inventario 📦</h1>
          <p className="mt-2 text-muted-foreground">Garantías, modelos y detalles técnicos de tus pertenencias.</p>
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuevo Artículo
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Box className="w-4 h-4 text-primary" />} label="Artículos totales" value={items.length.toString()} />
        <StatCard icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} label="Garantías vigentes" value={activeWarranties.toString()} />
        <StatCard icon={<Wallet className="w-4 h-4 text-amber-500" />} label="Valor estimado" value={formatMXN(totalInvestment)} />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o modelo..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          {searchQuery ? "No se encontraron artículos que coincidan con la búsqueda." : "No hay artículos en el inventario aún."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <InventoryCard 
              key={item.id} 
              item={item} 
              onEdit={() => setEditingItem(item)}
              onDelete={() => {
                if (confirm(`¿Eliminar ${item.name}?`)) deleteItem(item.id);
              }}
            />
          ))}
        </div>
      )}

      {(openDialog || editingItem) && (
        <InventoryDialog 
          initial={editingItem || undefined} 
          onClose={() => { setOpenDialog(false); setEditingItem(null); }} 
          onSave={async (data) => {
            try {
              if (editingItem) {
                await updateItem(editingItem.id, data);
                toast.success("Artículo actualizado");
              } else {
                await createItem(data);
                toast.success("Artículo agregado al inventario");
              }
              setOpenDialog(false);
              setEditingItem(null);
            } catch (err) {
              toast.error("Error al guardar el artículo");
            }
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

function InventoryCard({ item, onEdit, onDelete }: { item: InventoryItem; onEdit: () => void; onDelete: () => void }) {
  const isWarrantyActive = item.warranty_expiry ? new Date(item.warranty_expiry) > new Date() : false;

  return (
    <div className="group p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
            {item.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold uppercase">
                {item.category}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="w-3 h-3" /> {item.model_number || "Sin modelo"}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        {item.purchase_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Compra: {new Date(item.purchase_date + "T12:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        {item.warranty_expiry && (
          <div className={`flex items-center gap-2 text-xs font-medium ${isWarrantyActive ? "text-emerald-500" : "text-destructive"}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garantía: {new Date(item.warranty_expiry + "T12:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        {(item.purchase_place || item.serial_number) && (
          <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
            {item.purchase_place && (
              <p className="text-[11px] text-muted-foreground">
                <span className="font-bold text-foreground/70 uppercase text-[9px]">Lugar:</span> {item.purchase_place}
              </p>
            )}
            {item.serial_number && (
              <p className="text-[11px] text-muted-foreground">
                <span className="font-bold text-foreground/70 uppercase text-[9px]">S/N:</span> {item.serial_number}
              </p>
            )}
          </div>
        )}
      </div>

      {item.cost && item.cost > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Costo</p>
          <p className="font-display font-bold text-primary">{formatMXN(item.cost)}</p>
        </div>
      )}
    </div>
  );
}

function InventoryDialog({ initial, onClose, onSave }: { initial?: InventoryItem; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchase_date || "");
  const [warrantyExpiry, setWarrantyExpiry] = useState(initial?.warranty_expiry || "");
  const [purchasePlace, setPurchasePlace] = useState(initial?.purchase_place || "");
  const [modelNumber, setModelNumber] = useState(initial?.model_number || "");
  const [serialNumber, setSerialNumber] = useState(initial?.serial_number || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [cost, setCost] = useState(initial?.cost || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card z-10 pb-2">
          <h2 className="font-display text-xl font-bold">{initial ? "Editar Artículo" : "Nuevo Artículo"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { 
          e.preventDefault(); 
          onSave({ 
            name, 
            category: category || null, 
            purchase_date: purchaseDate || null, 
            warranty_expiry: warrantyExpiry || null, 
            purchase_place: purchasePlace || null, 
            model_number: modelNumber || null, 
            serial_number: serialNumber || null, 
            notes: notes || null, 
            cost: cost || 0 
          }); 
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre del artículo</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Lavadora, Refrigerador, TV..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoría</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Electrodoméstico, Tecnología..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground text-primary flex items-center gap-1">
                <Tag className="w-3 h-3" /> Modelo
              </label>
              <input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} placeholder="Ej: LG-V400, Samsung QLED..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Número de Serie</label>
              <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="S/N: 123456789..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fecha de Compra</label>
              <DatePicker 
                date={purchaseDate ? parseISO(purchaseDate) : undefined} 
                setDate={(date) => setPurchaseDate(date ? date.toISOString().split('T')[0] : "")} 
                placeholder="Seleccionar fecha"
              />
            </div>
            <div className="space-y-1 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-muted-foreground text-emerald-500 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3" /> Vencimiento de Garantía
              </label>
              <DatePicker 
                date={warrantyExpiry ? parseISO(warrantyExpiry) : undefined} 
                setDate={(date) => setWarrantyExpiry(date ? date.toISOString().split('T')[0] : "")} 
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Lugar de Compra</label>
              <input value={purchasePlace} onChange={(e) => setPurchasePlace(e.target.value)} placeholder="Ej: Amazon, Best Buy, Costco..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Costo</label>
              <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Notas y Detalles Técnicos</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dimensiones, color, especificaciones adicionales..." className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-[1.02] transition-transform">
              {initial ? "Guardar cambios" : "Agregar artículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
