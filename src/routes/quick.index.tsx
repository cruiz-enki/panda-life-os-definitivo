/**
 * **Índice de atajos rápidos** — /quick
 * Lista todas las URLs de deep link disponibles y una guía para Apple Shortcuts.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/quick/")({
  head: () => ({
    meta: [
      { title: "Atajos rápidos · Panda OS" },
      { name: "description", content: "Deep links para automatizar Panda OS desde Apple Shortcuts, widgets y otras apps." },
    ],
  }),
  component: QuickIndex,
});

type Shortcut = {
  action: string;
  label: string;
  emoji: string;
  example: string;
  params: { name: string; desc: string }[];
};

const SHORTCUTS: Shortcut[] = [
  {
    action: "expense",
    label: "Registrar gasto",
    emoji: "💸",
    example: "/quick/expense?amount=120&cat=comida&note=taqueria",
    params: [
      { name: "amount", desc: "monto en MXN (obligatorio)" },
      { name: "cat", desc: "categoría (ej. comida, transporte)" },
      { name: "method", desc: "cash | debit | credit | transfer | mercadopago" },
      { name: "note", desc: "nota corta" },
    ],
  },
  {
    action: "income",
    label: "Registrar ingreso",
    emoji: "💰",
    example: "/quick/income?amount=5000&cat=freelance",
    params: [
      { name: "amount", desc: "monto en MXN (obligatorio)" },
      { name: "cat", desc: "categoría del ingreso" },
      { name: "note", desc: "nota corta" },
    ],
  },
  {
    action: "med",
    label: "Tomé un medicamento",
    emoji: "💊",
    example: "/quick/med?name=telmisartan",
    params: [
      { name: "name", desc: "nombre parcial del medicamento (busca por match)" },
      { name: "note", desc: "nota opcional" },
    ],
  },
  {
    action: "meds",
    label: "Meds AM (mañana)",
    emoji: "🌅",
    example: "/quick/meds?names=telmisartan,hidroclorotiazida,atorvastatina,colageno,dapagliflozina",
    params: [
      { name: "names", desc: "lista separada por comas (match parcial por nombre)" },
      { name: "note", desc: "nota opcional" },
    ],
  },
  {
    action: "meds",
    label: "Meds PM (noche)",
    emoji: "🌙",
    example: "/quick/meds?names=escitalopram,pregabalina,melatonina,amlodipino,diasporal",
    params: [
      { name: "names", desc: "lista separada por comas" },
      { name: "note", desc: "nota opcional" },
    ],
  },
  {
    action: "location",
    label: "Check-in de ubicación",
    emoji: "📍",
    example: "/quick/location?name=Café%20Passmar&category=restaurante",
    params: [
      { name: "name", desc: "nombre del lugar (obligatorio)" },
      { name: "category", desc: "ciudad | restaurante | hogar | momento" },
      { name: "lat", desc: "latitud (opcional)" },
      { name: "lng", desc: "longitud (opcional)" },
    ],
  },
  {
    action: "mood",
    label: "Check-in emocional",
    emoji: "🧠",
    example: "/quick/mood?mood=good&intensity=4&energy=4",
    params: [
      { name: "mood", desc: "great | good | meh | low | bad" },
      { name: "intensity", desc: "1-5" },
      { name: "energy", desc: "1-5" },
      { name: "pain", desc: "0-10" },
    ],
  },
  {
    action: "water",
    label: "Registrar agua",
    emoji: "💧",
    example: "/quick/water?amount=250",
    params: [{ name: "amount", desc: "ml (default 250)" }],
  },
];

function QuickIndex() {
  const [copied, setCopied] = useState<string | null>(null);
  const base = typeof window !== "undefined" ? window.location.origin : "https://os.cmrs.mx";

  const copy = (path: string) => {
    const full = `${base}${path}`;
    navigator.clipboard.writeText(full);
    setCopied(path);
    toast.success("URL copiada");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display font-bold">Atajos rápidos</h1>
        </div>
        <p className="text-muted-foreground">
          Deep links para automatizar Panda OS desde Apple Shortcuts, widgets de iOS,
          Tasker/Android o cualquier app. Cada URL registra una acción y regresa a Home.
        </p>
      </header>

      <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <h2 className="font-display font-bold text-lg mb-2">📱 Cómo usarlo en iOS (Apple Shortcuts)</h2>
        <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
          <li>Abre la app <b>Atajos</b> → toca <b>+</b> → <b>Añadir acción</b>.</li>
          <li>Busca <b>"Abrir URLs"</b> y pega la URL del atajo que quieras.</li>
          <li>Ponle nombre e ícono. Añádelo a la pantalla de inicio o widget.</li>
          <li>Al tocarlo, se abre Panda OS y ejecuta la acción automáticamente.</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Tip: usa "Preguntar cada vez" en el parámetro <code>amount</code> para que iOS te pida el monto al vuelo.
        </p>
      </Card>

      <div className="space-y-3">
        {SHORTCUTS.map((sc) => (
          <Card key={sc.action} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display font-bold text-lg">
                  {sc.emoji} {sc.label}
                </h3>
                <code className="text-xs text-muted-foreground">/quick/{sc.action}</code>
              </div>
              <div className="flex gap-2">
                <Link to={"/quick/$action" as any} params={{ action: sc.action } as any} search={{ auto: "0" } as any}>
                  <Button variant="outline" size="sm">Probar</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => copy(sc.example)}>
                  {copied === sc.example ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-3 overflow-x-auto">
              <code className="text-xs font-mono break-all">{base}{sc.example}</code>
            </div>

            <div className="space-y-1">
              {sc.params.map((p) => (
                <div key={p.name} className="flex gap-2 text-xs">
                  <code className="text-primary font-semibold min-w-20">{p.name}</code>
                  <span className="text-muted-foreground">{p.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-display font-bold mb-2">🔗 Parámetros comunes</h3>
        <div className="space-y-1 text-xs">
          <div><code className="text-primary">auto=0</code> — no ejecutar automáticamente (muestra botón "Ejecutar")</div>
          <div><code className="text-primary">redirect=/health</code> — redirigir a otra ruta tras registrar</div>
          <div><code className="text-primary">note=texto</code> — agregar nota a cualquier registro</div>
        </div>
      </Card>
    </div>
  );
}
