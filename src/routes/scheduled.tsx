import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useScheduledMessages, type ScheduledChannel } from "@/hooks/use-scheduled-messages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Trash2, Clock, MessageCircle, Mail, Bell, Inbox, Phone, Ban, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/scheduled")({ component: ScheduledPage });

const CHANNELS: { key: ScheduledChannel; label: string; icon: React.ComponentType<{ className?: string }>; disabled?: boolean; note?: string }[] = [
  { key: "inapp", label: "En la app", icon: Inbox },
  { key: "push", label: "Push", icon: Bell },
  { key: "telegram", label: "Telegram", icon: MessageCircle },
  { key: "email", label: "Email", icon: Mail },
  { key: "whatsapp", label: "WhatsApp", icon: Phone, disabled: true, note: "Próximamente" },
];

function ScheduledPage() {
  const { messages, unreadInapp, loading, create, cancel, remove, markRead } = useScheduledMessages();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("");
  const [channels, setChannels] = useState<ScheduledChannel[]>(["inapp"]);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (c: ScheduledChannel) => {
    setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim() || !when || channels.length === 0) {
      toast.error("Completa título, mensaje, fecha y al menos un canal");
      return;
    }
    const scheduled = new Date(when);
    if (scheduled.getTime() <= Date.now()) {
      toast.error("La fecha debe ser en el futuro");
      return;
    }
    setSaving(true);
    const err = await create({ title, body, channels, scheduled_at: scheduled.toISOString() });
    setSaving(false);
    if (err) toast.error(err);
    else {
      toast.success("Mensaje programado 🕒");
      setTitle(""); setBody(""); setWhen(""); setChannels(["inapp"]);
    }
  };

  const pending = messages.filter((m) => m.status === "pending");
  const sent = messages.filter((m) => m.status === "sent");
  const other = messages.filter((m) => m.status === "failed" || m.status === "cancelled");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="w-7 h-7 text-primary" /> Mensajes al futuro
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Prográmate recordatorios, notas o mensajes de motivación. Elige por dónde te llegan.
          {unreadInapp > 0 && <> · <span className="text-primary font-medium">{unreadInapp} sin leer en la app</span></>}
        </p>
      </header>

      <Card className="border-primary/20 shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> Nuevo mensaje</CardTitle>
          <CardDescription>Se enviará automáticamente en la fecha indicada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Renovar dominio, Recordar a mamá..." />
          </div>
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[120px]" placeholder="El texto que te llegará..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>¿Cuándo?</Label>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Canales</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const active = channels.includes(c.key);
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      disabled={c.disabled}
                      onClick={() => !c.disabled && toggleChannel(c.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition ${
                        c.disabled
                          ? "opacity-50 cursor-not-allowed border-muted"
                          : active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {c.label}
                      {c.note && <span className="text-[10px] opacity-70">({c.note})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving} className="w-full rounded-full h-11">
            <Send className="w-4 h-4 mr-2" /> {saving ? "Programando…" : "Programar mensaje"}
          </Button>
        </CardContent>
      </Card>

      <Section title={`Pendientes (${pending.length})`} empty="No tienes mensajes programados.">
        {pending.map((m) => (
          <MessageRow key={m.id} m={m} onCancel={() => cancel(m.id)} onDelete={() => remove(m.id)} />
        ))}
      </Section>

      <Section title={`Entregados (${sent.length})`} empty="Aún no se ha entregado ningún mensaje.">
        {sent.map((m) => (
          <MessageRow
            key={m.id}
            m={m}
            onDelete={() => remove(m.id)}
            onRead={m.channels.includes("inapp") && !m.inapp_read_at ? () => markRead(m.id) : undefined}
          />
        ))}
      </Section>

      {other.length > 0 && (
        <Section title={`Otros (${other.length})`} empty="">
          {other.map((m) => (
            <MessageRow key={m.id} m={m} onDelete={() => remove(m.id)} />
          ))}
        </Section>
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.filter(Boolean).length > 0;
  return (
    <div className="space-y-2">
      <h2 className="text-sm uppercase tracking-widest font-bold text-muted-foreground">{title}</h2>
      {hasContent ? <div className="space-y-2">{children}</div> : empty ? <p className="text-sm text-muted-foreground italic">{empty}</p> : null}
    </div>
  );
}

function channelIcon(c: string) {
  switch (c) {
    case "telegram": return MessageCircle;
    case "email": return Mail;
    case "push": return Bell;
    case "inapp": return Inbox;
    case "whatsapp": return Phone;
    default: return Bell;
  }
}

function MessageRow({ m, onCancel, onDelete, onRead }: { m: ReturnType<typeof useScheduledMessages>["messages"][number]; onCancel?: () => void; onDelete?: () => void; onRead?: () => void }) {
  return (
    <Card className={m.status === "sent" && m.channels.includes("inapp") && !m.inapp_read_at ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold truncate">{m.title}</h3>
            {m.status === "sent" && <Badge variant="outline" className="text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Entregado</Badge>}
            {m.status === "failed" && <Badge variant="outline" className="text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" /> Falló</Badge>}
            {m.status === "cancelled" && <Badge variant="outline"><Ban className="w-3 h-3 mr-1" /> Cancelado</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.body}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(m.scheduled_at), "PPP p", { locale: es })}</span>
            <div className="flex gap-1">
              {m.channels.map((c) => {
                const Icon = channelIcon(c);
                const log = m.delivery_log?.[c];
                const failed = log && log.ok === false;
                return (
                  <span key={c} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${failed ? "border-destructive/40 text-destructive" : "border-muted"}`}>
                    <Icon className="w-3 h-3" /> {c}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {onRead && <Button size="sm" variant="outline" onClick={onRead}>Marcar leído</Button>}
          {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>}
          {onDelete && <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </CardContent>
    </Card>
  );
}
