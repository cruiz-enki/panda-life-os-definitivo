/**
 * Import masivo de planes MSI desde texto pegado (estado de cuenta).
 *
 * Formato flexible: una compra por línea. Detecta:
 *  - Descripción (texto)
 *  - Monto total (número más grande con $ o decimal)
 *  - Meses (patrón "a X meses" o "X MSI" o "X/Y")
 *  - Pago actual (X de Y, o "pago X/Y")
 */
import { useState, useMemo } from "react";
import { useFinance } from "@/hooks/use-finance";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2 } from "lucide-react";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";

type Parsed = {
  description: string;
  total_amount: number;
  months: number;
  paid_months: number;
};

function parseLine(line: string): Parsed | null {
  const raw = line.trim();
  if (!raw) return null;

  // Meses: "a 12 meses", "12 MSI", "12/18", "12 de 18"
  let months = 0;
  let paid_months = 0;
  const mFrac = raw.match(/(\d{1,2})\s*[\/de]{1,2}\s*(\d{1,2})/i);
  if (mFrac) {
    paid_months = parseInt(mFrac[1], 10);
    months = parseInt(mFrac[2], 10);
  } else {
    const mMonths = raw.match(/(\d{1,2})\s*(?:MSI|meses|msi)/i);
    if (mMonths) months = parseInt(mMonths[1], 10);
  }
  if (!months || months > 60) return null;

  // Montos: todos los números con decimales o >= 100
  const amounts = Array.from(raw.matchAll(/\$?\s*([\d,]+(?:\.\d{1,2})?)/g))
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((n) => !isNaN(n) && n >= 50);
  if (amounts.length === 0) return null;
  // Total = el más grande
  const total_amount = Math.max(...amounts);

  // Descripción: quita números y palabras clave
  const description = raw
    .replace(/\$\s*[\d,]+(?:\.\d{1,2})?/g, "")
    .replace(/\d{1,2}\s*[\/de]{1,2}\s*\d{1,2}/gi, "")
    .replace(/\d{1,2}\s*(?:MSI|meses|msi)/gi, "")
    .replace(/[\d,]+(?:\.\d{1,2})?/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Compra MSI";

  return { description, total_amount, months, paid_months };
}

export function MsiImport() {
  const { cards, createMsiPlan } = useFinance();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cardId, setCardId] = useState<string>("");
  const [category, setCategory] = useState("Compras");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const parsed = useMemo(() => {
    return text.split("\n").map(parseLine).filter((p): p is Parsed => p !== null);
  }, [text]);

  const total = parsed.reduce((s, p) => s + p.total_amount, 0);

  const handleImport = async () => {
    if (!cardId) { toast.error("Selecciona una tarjeta"); return; }
    if (parsed.length === 0) { toast.error("No se detectó ninguna compra"); return; }
    let ok = 0;
    for (const p of parsed) {
      const err = await createMsiPlan({
        card_id: cardId,
        description: p.description,
        total_amount: p.total_amount,
        months: p.months,
        paid_months: p.paid_months,
        start_date: startDate,
        category,
        note: "Importado desde estado de cuenta",
        status: "active",
      });
      if (!err) ok++;
    }
    toast.success(`${ok} planes MSI importados`);
    setText("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Upload className="w-4 h-4" /> Importar de estado de cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar MSI desde estado de cuenta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tarjeta</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger><SelectValue placeholder="Elige" /></SelectTrigger>
                <SelectContent>
                  {cards.filter((c) => c.status === "active").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fecha inicio</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Categoría por defecto</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Pega las líneas del estado de cuenta</Label>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Amazon MX  $12,500.00  6/18\nSamsung Store  $8,999.00  a 12 meses  3/12\nApple Store  15000  12 MSI`}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Formato flexible: descripción + monto + meses (ej: "6/18", "a 12 meses", "12 MSI").
            </p>
          </div>

          {parsed.length > 0 && (
            <div className="border rounded p-2 space-y-1 max-h-48 overflow-y-auto bg-secondary/30">
              <div className="text-xs font-bold mb-1">
                {parsed.length} compras detectadas · Total {formatMXN(total)}
              </div>
              {parsed.map((p, i) => (
                <div key={i} className="text-xs flex justify-between gap-2 py-1 border-b border-border/40 last:border-0">
                  <span className="truncate flex-1">{p.description}</span>
                  <span className="text-muted-foreground shrink-0">
                    {formatMXN(p.total_amount)} · {p.paid_months}/{p.months}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setText("")}><Trash2 className="w-4 h-4" /></Button>
          <Button onClick={handleImport} disabled={parsed.length === 0 || !cardId}>
            Importar {parsed.length > 0 && `(${parsed.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
