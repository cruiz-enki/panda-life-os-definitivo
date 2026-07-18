/**
 * **Ruta** — Import bancario: pega CSV/OFX de BBVA, Nu, HSBC, etc.,
 * revisa, deduplica y crea gastos en `finance_expenses` con reglas aplicadas.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, CheckCheck, X, Trash2 } from "lucide-react";
import { useBankImport } from "@/hooks/use-bank-import";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN, DEFAULT_CATEGORIES } from "@/lib/finance-types";

export const Route = createFileRoute("/bank-import")({
  head: () => ({
    meta: [
      { title: "Import bancario — ENKI Life OS" },
      { name: "description", content: "Importa movimientos desde CSV/OFX con dedup y auto-clasificación" },
    ],
  }),
  component: BankImportPage,
});

function BankImportPage() {
  const { staged, sessions, stage, toggle, updateRow, selectAll, clear, commit } = useBankImport();
  const { cards, categories } = useFinance();
  const [text, setText] = useState("");
  const [bank, setBank] = useState("BBVA");
  const [cardId, setCardId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"debit" | "credit" | "cash" | "transfer">("debit");
  const [busy, setBusy] = useState(false);

  const allCategories = useMemo(() => {
    const base = DEFAULT_CATEGORIES.map((c) => c.name);
    const extra = categories.map((c) => c.name);
    return Array.from(new Set([...base, ...extra])).sort();
  }, [categories]);

  const selectedCount = staged.filter((s) => s.selected && !s.duplicate).length;
  const dupCount = staged.filter((s) => s.duplicate).length;

  const handleFile = async (file: File) => {
    const content = await file.text();
    setText(content);
    setBusy(true);
    const res = await stage(content, { bank, filename: file.name });
    setBusy(false);
    if (res?.errors && res.errors.length > 0) toast.error(res.errors.join(" • "));
    if (res?.count) toast.success(`${res.count} movimientos parseados`);
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const res = await stage(text, { bank, filename: null });
    setBusy(false);
    if (res?.errors && res.errors.length > 0) toast.error(res.errors.join(" • "));
    if (res?.count) toast.success(`${res.count} movimientos parseados`);
  };

  const handleCommit = async () => {
    if (selectedCount === 0) {
      toast.error("Selecciona al menos un movimiento");
      return;
    }
    setBusy(true);
    const res = await commit({
      cardId: paymentMethod === "credit" ? cardId || null : null,
      paymentMethod,
    });
    setBusy(false);
    if ("error" in res && res.error) toast.error(String(res.error));
    else if ("imported" in res) {
      toast.success(`${res.imported} gastos importados`);
      setText("");
    }
  };

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🏦 Import bancario</h1>
        <p className="text-sm text-muted-foreground">
          Pega el CSV de tu banco o sube un archivo. Detectamos duplicados y aplicamos tus reglas.
        </p>
      </div>

      {/* ==== 1. Fuente ==== */}
      <Card className="p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Banco</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BBVA">BBVA</SelectItem>
                <SelectItem value="Nu">Nu</SelectItem>
                <SelectItem value="HSBC">HSBC</SelectItem>
                <SelectItem value="Banorte">Banorte</SelectItem>
                <SelectItem value="Citibanamex">Citibanamex</SelectItem>
                <SelectItem value="Santander">Santander</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método de pago</Label>
            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentMethod === "credit" && (
            <div>
              <Label>Tarjeta</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ····{c.last_four}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Subir archivo (CSV / OFX)
          </Label>
          <Input
            type="file"
            accept=".csv,.ofx,.txt,text/csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="mt-1"
          />
        </div>

        <div>
          <Label>O pega el contenido</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Fecha,Descripción,Cargo,Abono\n15/07/2026,UBER TRIP,150.00,\n16/07/2026,NETFLIX,299.00,\n...`}
            rows={6}
            className="mt-1 font-mono text-xs"
          />
          <div className="flex gap-2 mt-2">
            <Button onClick={handleParse} disabled={busy || !text.trim()}>
              <FileText className="h-4 w-4 mr-2" /> Parsear
            </Button>
            {staged.length > 0 && (
              <Button variant="ghost" onClick={clear}>
                <X className="h-4 w-4 mr-2" /> Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ==== 2. Preview ==== */}
      {staged.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{staged.length} parseados</Badge>
              <Badge>{selectedCount} a importar</Badge>
              {dupCount > 0 && <Badge variant="outline">{dupCount} duplicados</Badge>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => selectAll(true)}>
                <CheckCheck className="h-4 w-4 mr-1" /> Todos
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectAll(false)}>
                Ninguno
              </Button>
              <Button size="sm" onClick={handleCommit} disabled={busy || selectedCount === 0}>
                Importar {selectedCount}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th className="p-2 w-8"></th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Descripción</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {staged.map((r) => (
                  <tr
                    key={r.hash}
                    className={`border-b last:border-0 ${r.duplicate ? "opacity-50" : ""}`}
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={r.selected}
                        disabled={r.duplicate}
                        onCheckedChange={() => toggle(r.hash)}
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap font-mono text-xs">{r.date}</td>
                    <td className="p-2 min-w-[200px]">
                      <div className="truncate max-w-xs">{r.description}</div>
                      {r.duplicate && <Badge variant="outline" className="mt-1 text-[10px]">duplicado</Badge>}
                      {r.ruleName && <Badge variant="secondary" className="mt-1 text-[10px]">regla: {r.ruleName}</Badge>}
                    </td>
                    <td className="p-2">
                      <Select
                        value={r.category}
                        onValueChange={(v) => updateRow(r.hash, { category: v })}
                      >
                        <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {allCategories.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className={`p-2 text-right font-mono whitespace-nowrap ${r.kind === "income" ? "text-emerald-500" : ""}`}>
                      {r.kind === "income" ? "+" : ""}{formatMXN(Math.abs(r.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==== 3. Historial ==== */}
      {sessions.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Historial de importaciones</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                <div>
                  <div className="font-medium">
                    {s.bank ?? "—"} · {s.filename ?? "pegado"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("es-MX")}
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge>{s.rows_imported} importados</Badge>
                  {s.rows_skipped > 0 && <Badge variant="outline">{s.rows_skipped} skip</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
