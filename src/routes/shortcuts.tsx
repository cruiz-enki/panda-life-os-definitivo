/**
 * **Atajos & Deep links** — /shortcuts
 * Página de documentación completa de los deep links de Panda OS.
 * Accesible desde SETUP en el sidebar.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Zap, Smartphone, Link2, Bot, ShieldCheck, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/shortcuts")({
  head: () => ({
    meta: [
      { title: "Atajos & Deep links · Panda OS" },
      { name: "description", content: "Todas las URLs de acceso rápido para automatizar Panda OS desde Apple Shortcuts, widgets y otras apps." },
    ],
  }),
  component: ShortcutsPage,
});

type Shortcut = {
  id: string;
  action: string;
  label: string;
  emoji: string;
  example: string;
  params: { name: string; desc: string }[];
};

const SHORTCUTS: Shortcut[] = [
  {
    id: "expense",
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
    id: "income",
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
    id: "med",
    action: "med",
    label: "Tomé un medicamento",
    emoji: "💊",
    example: "/quick/med?name=telmisartan",
    params: [
      { name: "name", desc: "nombre parcial (busca por match)" },
      { name: "note", desc: "nota opcional" },
    ],
  },
  {
    id: "slot-am",
    action: "slot",
    label: "Meds AM (una sola tap)",
    emoji: "🌅",
    example: "/quick/slot?key=am",
    params: [
      { name: "key", desc: "identificador del slot (am | pm | ...)" },
    ],
  },
  {
    id: "slot-pm",
    action: "slot",
    label: "Meds PM (una sola tap)",
    emoji: "🌙",
    example: "/quick/slot?key=pm",
    params: [
      { name: "key", desc: "identificador del slot (am | pm | ...)" },
    ],
  },
  {
    id: "meds-manual",
    action: "meds",
    label: "Meds por nombre (respaldo)",
    emoji: "💊",
    example: "/quick/meds?names=telmisartan,hidroclorotiazida",
    params: [
      { name: "names", desc: "lista separada por comas (match tolerante a acentos)" },
      { name: "note", desc: "nota opcional" },
    ],
  },
  {
    id: "location",
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
    id: "mood",
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
    id: "desayuno",
    action: "desayuno",
    label: "Registrar desayuno",
    emoji: "🍳",
    example: "/quick/desayuno?name=Huevos%20con%20espinaca&classification=saludable&protein=25",
    params: [
      { name: "name", desc: "descripción del desayuno" },
      { name: "classification", desc: "saludable | regular | chatarra" },
      { name: "protein", desc: "gramos de proteína (opcional)" },
      { name: "time", desc: "HH:MM (default ahora)" },
    ],
  },
  {
    id: "comida",
    action: "comida",
    label: "Registrar comida",
    emoji: "🍽️",
    example: "/quick/comida?name=Pasta%20bolognesa&classification=regular",
    params: [
      { name: "name", desc: "descripción" },
      { name: "classification", desc: "saludable | regular | chatarra" },
      { name: "protein", desc: "gramos de proteína (opcional)" },
    ],
  },
  {
    id: "cena",
    action: "cena",
    label: "Registrar cena",
    emoji: "🌙",
    example: "/quick/cena?name=Ensalada&classification=saludable",
    params: [
      { name: "name", desc: "descripción" },
      { name: "classification", desc: "saludable | regular | chatarra" },
      { name: "protein", desc: "gramos de proteína (opcional)" },
    ],
  },
  {
    id: "snack",
    action: "snack",
    label: "Registrar snack",
    emoji: "🥨",
    example: "/quick/snack?name=Fruta&classification=saludable",
    params: [
      { name: "name", desc: "descripción" },
      { name: "classification", desc: "saludable | regular | chatarra" },
    ],
  },
  {
    id: "water",
    action: "water",
    label: "Registrar agua",
    emoji: "💧",
    example: "/quick/water?amount=250",
    params: [{ name: "amount", desc: "ml (default 250)" }],
  },
];

function ShortcutsPage() {
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-display font-bold">Atajos & Deep links</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          URLs mágicas que registran algo en Panda OS de un solo tap. Úsalas desde Apple Shortcuts, widgets,
          NFC, Tasker o cualquier app que abra URLs.
        </p>
      </header>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guide" className="gap-2">
            <Smartphone className="w-4 h-4" /> <span className="hidden sm:inline">Guía de uso</span><span className="sm:hidden">Guía</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="w-4 h-4" /> <span>Deep links</span>
          </TabsTrigger>
          <TabsTrigger value="mcp" className="gap-2">
            <Bot className="w-4 h-4" /> <span>MCP</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ GUÍA DE USO ============ */}
        <TabsContent value="guide" className="space-y-4 mt-6">
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <h2 className="font-display font-bold text-lg mb-2">iOS (Apple Shortcuts)</h2>
                <ol className="text-sm space-y-1.5 list-decimal list-inside text-muted-foreground">
                  <li>Abre la app <b>Atajos</b> → toca <b>+</b> → <b>Añadir acción</b>.</li>
                  <li>Busca <b>"Abrir URLs"</b> y pega la URL del atajo que quieras.</li>
                  <li>Ponle nombre e ícono. Añádelo a la pantalla de inicio o widget.</li>
                  <li>Al tocarlo, se abre Panda OS y ejecuta la acción automáticamente.</li>
                  <li>Con "Oye Siri, [nombre del atajo]" también funciona por voz.</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-3">
                  Tip: usa <b>"Preguntar cada vez"</b> en el parámetro <code>amount</code> para que iOS te pida el monto al vuelo.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-green-500 mt-1 shrink-0" />
              <div>
                <h2 className="font-display font-bold text-lg mb-2">Android</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  <b>Instalar la app:</b> abre <code>os.cmrs.mx</code> en Chrome → menú ⋮ → <b>Instalar app</b>. Queda como app nativa con push notifications reales.
                </p>
                <p className="text-sm font-semibold mt-3 mb-1">Formas de disparar los deep links:</p>
                <ol className="text-sm space-y-1.5 list-decimal list-inside text-muted-foreground">
                  <li><b>Google Assistant (Rutinas):</b> app Google Home → Rutinas → "Cuando yo diga: tomé mis medicinas" → acción "Abrir URL".</li>
                  <li><b>Tasker:</b> tarea con acción <b>Browse URL</b>. Dispárala por NFC, ubicación, hora, gesto, voz.</li>
                  <li><b>Widget URL:</b> apps como <b>URL Shortcut Maker</b> crean íconos en el home que abren una URL específica.</li>
                  <li><b>NFC:</b> con <b>NFC Tools</b> escribe la URL en un tag → pégalo donde quieras.</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Link2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="space-y-2">
                <h2 className="font-display font-bold text-lg">Estructura de las URLs</h2>
                <p className="text-sm text-muted-foreground">
                  Todas siguen el patrón <code className="text-primary">{base}/quick/&lt;acción&gt;?param1=valor&amp;param2=valor</code>.
                  Al abrirse, ejecutan sin preguntar y muestran ✅ o ❌. Añade <code>auto=0</code> para confirmar manualmente.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-muted/30">
            <h3 className="font-display font-bold mb-2">Ejemplos de uso real</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• <b>Widget en pantalla de inicio:</b> "Meds AM" → 1 tap y quedan registrados los 5 medicamentos de la mañana.</li>
              <li>• <b>NFC tag en la mesita de noche:</b> pega el tag con la URL de "Meds PM"; acércale el iPhone al dormir.</li>
              <li>• <b>Siri por voz:</b> "Oye Siri, gasto" → Atajos te pregunta cuánto → registrado.</li>
              <li>• <b>Automatización por ubicación:</b> al llegar a "Gimnasio", corre un atajo que haga check-in.</li>
            </ul>
          </Card>
        </TabsContent>

        {/* ============ DEEP LINKS ============ */}
        <TabsContent value="links" className="space-y-3 mt-6">
          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Parámetros comunes que funcionan en todos: <code className="text-primary">auto=0</code> (no ejecutar auto),
              <code className="text-primary ml-1">redirect=/health</code> (a dónde ir al terminar),
              <code className="text-primary ml-1">note=texto</code> (agrega nota).
            </p>
          </Card>

          {SHORTCUTS.map((sc) => (
            <Card key={sc.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
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
        </TabsContent>

        {/* ============ MCP SERVER ============ */}
        <TabsContent value="mcp" className="space-y-4 mt-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-display font-bold">MCP Server</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Panda OS expone un servidor <b>MCP (Model Context Protocol)</b> con OAuth 2.1. Conéctalo a ChatGPT,
              Claude, Cursor, n8n o cualquier cliente compatible para que un LLM registre gastos, medicinas,
              notas, tareas y consulte tu resumen diario en lenguaje natural.
            </p>
          </div>

          <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-start gap-3">
              <Link2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="space-y-2 w-full">
                <h3 className="font-display font-bold text-lg">Endpoint</h3>
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between gap-2 overflow-x-auto">
                  <code className="text-sm font-mono">{base}/mcp</code>
                  <Button variant="secondary" size="sm" onClick={() => copy("/mcp")}>
                    {copied === "/mcp" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Descubrimiento OAuth: <code>{base}/.well-known/oauth-protected-resource</code>. El cliente hace
                  Dynamic Client Registration solo.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-lg mb-2">Cómo conectarlo</h3>
                <ol className="text-sm space-y-1.5 list-decimal list-inside text-muted-foreground">
                  <li><b>ChatGPT:</b> Settings → Connectors → Add custom connector → pega <code>{base}/mcp</code>.</li>
                  <li><b>Claude Desktop / claude.ai:</b> Settings → Connectors → Add custom → misma URL.</li>
                  <li><b>Cursor:</b> Settings → MCP → Add server → tipo <b>HTTP</b> → URL <code>{base}/mcp</code>.</li>
                  <li><b>n8n:</b> nodo <b>MCP Client Tool</b> → transport <b>HTTP Streamable</b> → URL <code>{base}/mcp</code> → auth OAuth2.</li>
                  <li>Al conectar, el cliente te manda a la pantalla de consentimiento. Aprueba y listo.</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-bold text-lg mb-3">Herramientas disponibles</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-primary mb-1">💸 Finanzas</div>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• <code>add_expense</code> — registrar gasto</li>
                  <li>• <code>add_income</code> — registrar ingreso</li>
                  <li>• <code>list_recent_expenses</code> — gastos recientes</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary mb-1">📝 Notas</div>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• <code>add_note</code> — crear nota</li>
                  <li>• <code>list_notes</code> — últimas notas</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary mb-1">💊 Salud</div>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• <code>log_medication</code> — tomé medicina</li>
                  <li>• <code>list_medications</code> — meds activos</li>
                  <li>• <code>log_mood</code> — check-in emocional</li>
                  <li>• <code>log_sleep</code> — registro de sueño</li>
                  <li>• <code>log_water</code> — hidratación</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary mb-1">✅ Productividad</div>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• <code>add_task</code> / <code>list_tasks</code> / <code>complete_task</code></li>
                  <li>• <code>list_habits</code> / <code>add_habit</code> / <code>complete_habit</code></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary mb-1">📍 Ubicación</div>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• <code>checkin_location</code> — check-in de lugar</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary mb-1">📊 Resumen</div>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• <code>daily_summary</code> — recap del día</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-muted/30">
            <div className="flex items-start gap-3">
              <Terminal className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-lg mb-2">Ejemplos de prompts</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• "Me acabo de tomar un café de $65 y las pastillas de la mañana" → <code>add_expense</code> + <code>log_medication</code>.</li>
                  <li>• "¿Cómo va mi día?" → <code>daily_summary</code>.</li>
                  <li>• "Recuérdame llamar a Juan mañana 3pm, alta prioridad" → <code>add_task</code>.</li>
                  <li>• "¿Los días que duermo menos de 6h gasto más?" → el LLM cruza <code>list_recent_expenses</code> + resúmenes.</li>
                  <li>• <b>n8n cron:</b> llama <code>daily_summary</code> a las 10pm y te lo manda por Telegram.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-amber-500/30 bg-amber-500/5">
            <h3 className="font-display font-bold mb-2">⚠️ Seguridad</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Cada cliente MCP se conecta con <b>tu cuenta</b> — las herramientas actúan como tú, respetando RLS.</li>
              <li>• Puedes revocar accesos desde tu Supabase Auth → OAuth clients.</li>
              <li>• Solo conecta clientes MCP en los que confíes.</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
