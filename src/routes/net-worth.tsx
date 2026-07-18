/**
 * **Ruta** — Net Worth: patrimonio (activos - deudas), cuentas y snapshots.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Camera, TrendingUp, TrendingDown, Wallet, Landmark } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useNetWorth, ASSET_KIND_META, type AssetAccountKind } from "@/hooks/use-net-worth";
import { useFinance } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";

export const Route = createFileRoute("/net-worth")({
  head: () => ({
    meta: [
      { title: "Patrimonio · ENKI LIFE OS" },
      { name: "description", content: "Foto mensual de tu patrimonio: activos, deudas y net worth." },
    ],
  }),
  component: NetWorthPage,
});

function NetWorthPage() {
  const { accounts, snapshots, totals, createAccount, deleteAccount, createSnapshot, deleteSnapshot } = useNetWorth();
  const { cards } = useFinance();
  const [openNew, setOpenNew] = useState(false);
  const [snapNote, setSnapNote] = useState("");

  const [form, setForm] = useState({
    name: "",
    kind: "debit" as AssetAccountKind,
    institution: "",
    current_balance: "",
    emoji: "🏦",
    note: "",
  });

  const chartData = snapshots.map((s) => ({
    date: s.snapshot_date.slice(5),
    net: s.net_worth,
    assets: s.assets_total,
    debts: -s.debts_total,
  }));

  const lastSnap = snapshots[snapshots.length - 1];
  const prevSnap = snapshots[snapshots.length - 2];
  const delta = lastSnap && prevSnap ? lastSnap.net_worth - prevSnap.net_worth : 0;

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Nombre requerido");
      return;
    }
    const err = await createAccount({
      name: form.name.trim(),
      kind: form.kind,
      institution: form.institution || null,
      currency: "MXN",
      current_balance: Number(form.current_balance) || 0,
      emoji: form.emoji || ASSET_KIND_META[form.kind].emoji,
      color: null,
      note: form.note || null,
      status: "active",
    });
    if (err) {
      toast.error("Error al crear cuenta");
    } else {
      toast.success("Cuenta agregada");
      setOpenNew(false);
      setForm({ name: "", kind: "debit", institution: "", current_balance: "", emoji: "🏦", note: "" });
    }
  };

  const handleSnapshot = async () => {
    const err = await createSnapshot(snapNote || undefined);
    if (err) toast.error("Error al guardar snapshot");
    else {
      toast.success("Snapshot guardado ✓");
      setSnapNote("");
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Patrimonio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Un solo número. Cada domingo actualiza saldos y toma un snapshot.
        </p>
      </header>

      {/* Big number */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className={`p-6 border-2 ${totals.netWorth >= 0 ? "border-primary/40" : "border-destructive/40"}`}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Net Worth</div>
          <div className="mt-2 font-display text-4xl font-bold">
            {formatMXN(totals.netWorth)}
          </div>
          {delta !== 0 && (
            <div className={`mt-1 text-sm flex items-center gap-1 ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {delta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatMXN(Math.abs(delta))} vs snapshot anterior
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5" /> Activos
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-emerald-400">
            {formatMXN(totals.assets)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{accounts.length} cuentas</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Landmark className="h-3.5 w-3.5" /> Deudas
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-red-400">
            {formatMXN(totals.debts)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{cards.length} tarjetas</div>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Evolución</h2>
            <span className="text-xs text-muted-foreground">{snapshots.length} snapshots</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMXN(v)} />
                <Line type="monotone" dataKey="net" name="Net Worth" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="assets" name="Activos" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="debts" name="Deudas" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Snapshot */}
      <Card className="p-6 mb-8 bg-primary/5 border-primary/30">
        <div className="flex flex-wrap items-center gap-3">
          <Camera className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-[200px]">
            <div className="font-medium">Tomar snapshot de hoy</div>
            <div className="text-xs text-muted-foreground">
              Guarda: {formatMXN(totals.netWorth)} · activos {formatMXN(totals.assets)} · deudas {formatMXN(totals.debts)}
            </div>
          </div>
          <Input
            placeholder="Nota (opcional)"
            value={snapNote}
            onChange={(e) => setSnapNote(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleSnapshot}>Guardar</Button>
        </div>
      </Card>

      {/* Accounts */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Cuentas de activos</h2>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva cuenta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: BBVA débito" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.kind} onValueChange={(v: AssetAccountKind) => setForm({ ...form, kind: v, emoji: ASSET_KIND_META[v].emoji })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ASSET_KIND_META) as AssetAccountKind[]).map((k) => (
                          <SelectItem key={k} value={k}>{ASSET_KIND_META[k].emoji} {ASSET_KIND_META[k].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Emoji</Label>
                    <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={4} />
                  </div>
                </div>
                <div>
                  <Label>Institución</Label>
                  <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="BBVA, Binance..." />
                </div>
                <div>
                  <Label>Saldo actual (MXN)</Label>
                  <Input type="number" step="0.01" value={form.current_balance} onChange={(e) => setForm({ ...form, current_balance: e.target.value })} />
                </div>
                <div>
                  <Label>Nota</Label>
                  <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
                </div>
                <Button onClick={handleCreate} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {accounts.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Aún no tienes cuentas. Agrega tu débito, ahorros, inversiones o crypto.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {accounts.map((a) => (
              <Card key={a.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl">{a.emoji}</div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {ASSET_KIND_META[a.kind].label}{a.institution ? ` · ${a.institution}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-display font-semibold">{formatMXN(a.current_balance)}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      const val = window.prompt(`Nuevo saldo para ${a.name}`, String(a.current_balance));
                      if (val === null) return;
                      const n = Number(val);
                      if (isNaN(n)) return toast.error("Número inválido");
                      const err = await deleteAccount.constructor === Function ? null : null;
                      const { updateAccount } = await import("@/hooks/use-net-worth").then(() => ({ updateAccount: null }));
                      // usa el hook directamente
                    }}
                    className="hidden"
                  />
                  <QuickBalanceEdit accountId={a.id} name={a.name} current={a.current_balance} />
                  <Button size="icon" variant="ghost" onClick={async () => {
                    if (!confirm(`Eliminar ${a.name}?`)) return;
                    const err = await deleteAccount(a.id);
                    if (err) toast.error("Error"); else toast.success("Eliminada");
                  }}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Snapshots list */}
      {snapshots.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Historial de snapshots</h2>
          <div className="space-y-2">
            {[...snapshots].reverse().map((s) => (
              <Card key={s.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.snapshot_date}</div>
                  {s.note && <div className="text-xs text-muted-foreground">{s.note}</div>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-display font-semibold">{formatMXN(s.net_worth)}</div>
                    <div className="text-xs text-muted-foreground">
                      +{formatMXN(s.assets_total)} · −{formatMXN(s.debts_total)}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={async () => {
                    if (!confirm("Eliminar snapshot?")) return;
                    await deleteSnapshot(s.id);
                  }}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickBalanceEdit({ accountId, name, current }: { accountId: string; name: string; current: number }) {
  const { updateAccount } = useNetWorth();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        const val = window.prompt(`Nuevo saldo para ${name}`, String(current));
        if (val === null) return;
        const n = Number(val);
        if (isNaN(n)) return toast.error("Número inválido");
        const err = await updateAccount(accountId, { current_balance: n });
        if (err) toast.error("Error"); else toast.success("Actualizado");
      }}
    >
      Editar
    </Button>
  );
}
