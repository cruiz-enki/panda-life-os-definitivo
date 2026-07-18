/**
 * **Ruta** — Money Tools: gastos recurrentes (cargar mes), sobres de presupuesto
 * con semáforo semanal y reglas de auto-clasificación.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Zap, CheckCircle2, AlertCircle, Wand2 } from "lucide-react";
import { useMoneyTools, type RuleMatchType } from "@/hooks/use-money-tools";
import { useCashflow } from "@/hooks/use-cashflow";
import { formatMXN, DEFAULT_CATEGORIES } from "@/lib/finance-types";
import { toast } from "sonner";

export const Route = createFileRoute("/money-tools")({
  head: () => ({
    meta: [
      { title: "Money Tools — ENKI Life OS" },
      { name: "description", content: "Recurrentes, sobres y reglas para automatizar tu dinero" },
    ],
  }),
  component: MoneyToolsPage,
});

const CATS = DEFAULT_CATEGORIES.filter((c) => c.kind === "expense");

function MoneyToolsPage() {
  return (
    <div className="px-4 py-4 space-y-4 max-w-4xl mx-auto pb-24">
      <header>
        <h1 className="text-2xl font-display font-bold">Money Tools</h1>
        <p className="text-sm text-muted-foreground">
          Automatiza tu registro: recurrentes, sobres y reglas.
        </p>
      </header>

      <Tabs defaultValue="recurring">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="recurring">Recurrentes</TabsTrigger>
          <TabsTrigger value="envelopes">Sobres</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="mt-4">
          <RecurringTab />
        </TabsContent>
        <TabsContent value="envelopes" className="mt-4">
          <EnvelopesTab />
        </TabsContent>
        <TabsContent value="rules" className="mt-4">
          <RulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ TAB 1: RECURRING ============
function RecurringTab() {
  const { recurringStatus, pendingRecurring, loadRecurring, loadAllPending, unloadRecurring, currentMonth } =
    useMoneyTools();
  const { recurring } = useCashflow();

  const totalPending = pendingRecurring.reduce((s, x) => s + x.recurring.amount, 0);
  const totalLoaded = recurringStatus
    .filter((s) => s.loaded)
    .reduce((s, x) => s + x.recurring.amount, 0);

  if (recurring.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aún no tienes gastos recurrentes. Créalos en <strong>Cashflow</strong>.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cargado {currentMonth}</div>
          <div className="text-lg font-bold text-green-500">{formatMXN(totalLoaded)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pendiente</div>
          <div className="text-lg font-bold text-orange-500">{formatMXN(totalPending)}</div>
        </Card>
      </div>

      {pendingRecurring.length > 0 && (
        <Card className="p-4 border-orange-500/40 bg-orange-500/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-sm">
                  {pendingRecurring.length} gasto{pendingRecurring.length !== 1 ? "s" : ""} sin registrar este mes
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {pendingRecurring.map((s) => s.recurring.name).join(" · ")}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                await loadAllPending();
                toast.success("Todos cargados");
              }}
            >
              <Zap className="w-4 h-4 mr-1" />
              Cargar todos
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {recurringStatus.map((s) => (
          <Card key={s.recurring.id} className="p-3 flex items-center gap-3">
            <span className="text-2xl">{s.recurring.emoji || "📌"}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{s.recurring.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatMXN(s.recurring.amount)}
                {s.recurring.day_of_month ? ` · día ${s.recurring.day_of_month}` : ""}
                {s.recurring.category ? ` · ${s.recurring.category}` : ""}
              </div>
            </div>
            {s.loaded ? (
              <button
                onClick={async () => {
                  if (!confirm("¿Deshacer carga? Borrará el gasto del mes.")) return;
                  await unloadRecurring(s.log!.id, s.log!.expense_id);
                  toast.success("Carga deshecha");
                }}
                className="flex items-center gap-1 text-xs text-green-500 hover:underline"
              >
                <CheckCircle2 className="w-4 h-4" />
                Cargado
              </button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await loadRecurring(s.recurring.id);
                  toast.success(`${s.recurring.name} cargado`);
                }}
              >
                Cargar
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ TAB 2: ENVELOPES ============
function EnvelopesTab() {
  const { envelopes, envelopeProgress, upsertEnvelope, deleteEnvelope, loadEnvelopeTemplate, currentMonth } =
    useMoneyTools();

  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState<"month" | "template">("month");
  const [category, setCategory] = useState(CATS[0].name);
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"need" | "want" | "save">("need");
  const [percent, setPercent] = useState("");

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    const cat = CATS.find((c) => c.name === category);
    await upsertEnvelope({
      month: scope === "template" ? "template" : currentMonth,
      category,
      emoji: cat?.emoji || "📦",
      amount: amt,
      percent: percent ? Number(percent) : null,
      kind,
      note: null,
    });
    setAmount("");
    setPercent("");
    setShowForm(false);
    toast.success("Sobre guardado");
  };

  const totalMonth = envelopeProgress.reduce((s, e) => s + e.envelope.amount, 0);
  const totalSpent = envelopeProgress.reduce((s, e) => s + e.spent, 0);
  const templateCount = envelopes.filter((e) => e.month === "template").length;
  const hasCurrentMonth = envelopeProgress.length > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Asignado {currentMonth}</div>
          <div className="text-lg font-bold">{formatMXN(totalMonth)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Gastado</div>
          <div className="text-lg font-bold">
            {formatMXN(totalSpent)}
            {totalMonth > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((totalSpent / totalMonth) * 100)}%
              </span>
            )}
          </div>
        </Card>
      </div>

      {!hasCurrentMonth && templateCount > 0 && (
        <Card className="p-4 border-primary/40 bg-primary/5 flex items-center gap-3">
          <Wand2 className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">Plantilla lista</div>
            <div className="text-xs text-muted-foreground">
              Copia tus {templateCount} sobres al mes actual.
            </div>
          </div>
          <Button
            size="sm"
            onClick={async () => {
              await loadEnvelopeTemplate();
              toast.success("Plantilla cargada");
            }}
          >
            Cargar
          </Button>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Sobre
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div>
            <Label>Alcance</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este mes ({currentMonth})</SelectItem>
                <SelectItem value="template">Plantilla (todos los meses)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATS.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Monto</Label>
              <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>% del ingreso</Label>
              <Input type="number" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="opcional" />
            </div>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="need">Necesidad (50)</SelectItem>
                <SelectItem value="want">Deseo (30)</SelectItem>
                <SelectItem value="save">Ahorro / Deuda (20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} className="w-full">Guardar sobre</Button>
        </Card>
      )}

      <div className="space-y-2">
        {envelopeProgress.map((p) => {
          const lightColor =
            p.light === "red"
              ? "text-red-500 bg-red-500/10 border-red-500/40"
              : p.light === "yellow"
                ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/40"
                : "text-green-500 bg-green-500/10 border-green-500/40";
          return (
            <Card key={p.envelope.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.envelope.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.envelope.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatMXN(p.spent)} / {formatMXN(p.envelope.amount)}
                    {p.envelope.percent ? ` · ${p.envelope.percent}%` : ""}
                  </div>
                </div>
                <Badge variant="outline" className={lightColor}>
                  {p.light === "red" ? "Rebasado" : p.light === "yellow" ? "Justo" : "En ritmo"}
                </Badge>
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar sobre?")) return;
                    await deleteEnvelope(p.envelope.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Progress value={Math.min(100, p.pctUsed * 100)} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Esperado: {Math.round(p.expectedProgress * 100)}%</span>
                <span>Restante: {formatMXN(Math.max(0, p.remaining))}</span>
              </div>
            </Card>
          );
        })}

        {envelopes.filter((e) => e.month === "template").length > 0 && (
          <div className="pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Plantilla base
            </div>
            {envelopes
              .filter((e) => e.month === "template")
              .map((e) => (
                <Card key={e.id} className="p-3 flex items-center gap-2 mb-2">
                  <span className="text-xl">{e.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{e.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatMXN(e.amount)}{e.percent ? ` · ${e.percent}%` : ""} · {e.kind}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar de plantilla?")) return;
                      await deleteEnvelope(e.id);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ TAB 3: RULES ============
function RulesTab() {
  const { rules, createRule, deleteRule, updateRule } = useMoneyTools();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [matchType, setMatchType] = useState<RuleMatchType>("note_contains");
  const [matchText, setMatchText] = useState("");
  const [matchAmount, setMatchAmount] = useState("");
  const [matchDay, setMatchDay] = useState("");
  const [category, setCategory] = useState(CATS[0].name);

  const submit = async () => {
    if (!name) return;
    await createRule({
      name,
      match_type: matchType,
      match_text: matchType === "note_contains" ? matchText : null,
      match_amount: matchType !== "note_contains" ? Number(matchAmount) || null : null,
      match_day: matchType === "amount_on_day" ? Number(matchDay) || null : null,
      set_category: category,
      set_tags: [],
      priority: 100,
      status: "active",
    });
    setName("");
    setMatchText("");
    setMatchAmount("");
    setMatchDay("");
    setShowForm(false);
    toast.success("Regla creada");
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-muted/40">
        <div className="text-xs text-muted-foreground">
          Las reglas se aplican automáticamente al capturar un gasto. Ejemplos:
          "nota contiene <em>uber</em> → Transporte" · "monto $299 día 5 → Netflix".
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Regla
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Uber → Transporte" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={matchType} onValueChange={(v) => setMatchType(v as RuleMatchType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note_contains">Nota contiene…</SelectItem>
                <SelectItem value="amount_equals">Monto exacto</SelectItem>
                <SelectItem value="amount_on_day">Monto + día del mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {matchType === "note_contains" && (
            <div>
              <Label>Texto a buscar</Label>
              <Input value={matchText} onChange={(e) => setMatchText(e.target.value)} placeholder="uber" />
            </div>
          )}
          {matchType !== "note_contains" && (
            <div>
              <Label>Monto</Label>
              <Input type="number" inputMode="decimal" value={matchAmount} onChange={(e) => setMatchAmount(e.target.value)} placeholder="299" />
            </div>
          )}
          {matchType === "amount_on_day" && (
            <div>
              <Label>Día del mes</Label>
              <Input type="number" min="1" max="31" value={matchDay} onChange={(e) => setMatchDay(e.target.value)} placeholder="5" />
            </div>
          )}
          <div>
            <Label>Asignar categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATS.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} className="w-full">Crear regla</Button>
        </Card>
      )}

      <div className="space-y-2">
        {rules.map((r) => (
          <Card key={r.id} className="p-3 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground">
                {r.match_type === "note_contains" && <>nota contiene "{r.match_text}"</>}
                {r.match_type === "amount_equals" && <>monto = {formatMXN(r.match_amount || 0)}</>}
                {r.match_type === "amount_on_day" && (
                  <>monto = {formatMXN(r.match_amount || 0)} en día {r.match_day}</>
                )}
                {" → "}<strong>{r.set_category}</strong>
              </div>
            </div>
            <button
              onClick={() =>
                updateRule(r.id, { status: r.status === "active" ? "paused" : "active" })
              }
              className={`text-xs px-2 py-1 rounded ${
                r.status === "active" ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
              }`}
            >
              {r.status === "active" ? "Activa" : "Pausada"}
            </button>
            <button
              onClick={async () => {
                if (!confirm("¿Eliminar regla?")) return;
                await deleteRule(r.id);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
        {rules.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Sin reglas todavía. Crea una para acelerar tu captura.
          </Card>
        )}
      </div>
    </div>
  );
}
