import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContacts, type Contact, daysUntilAnnualDate, isContactDue } from "@/hooks/use-contacts";
import { Users, Cake, Gift, Clock, Plus, Trash2, MessageSquarePlus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

const RELATIONSHIP_OPTIONS = ["amigo", "familia", "pareja", "mentor", "network", "colega", "cliente", "otro"];
const OCCASION_OPTIONS = ["cumpleaños", "aniversario", "navidad", "gracias", "porque sí"];

function ContactsPage() {
  const { contacts, interactions, gifts, upsertContact, removeContact, addInteraction, upsertGift, removeGift } = useContacts();
  const [tab, setTab] = useState("directorio");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;
  const selectedInteractions = interactions.filter((i) => i.contact_id === selectedId);
  const selectedGifts = gifts.filter((g) => g.contact_id === selectedId);

  const upcomingBirthdays = useMemo(() => {
    return contacts
      .map((c) => ({ c, days: daysUntilAnnualDate(c.birthday) }))
      .filter((x) => x.days !== null && x.days! <= 60)
      .sort((a, b) => (a.days! - b.days!));
  }, [contacts]);

  const upcomingAnniversaries = useMemo(() => {
    return contacts
      .map((c) => ({ c, days: daysUntilAnnualDate(c.anniversary) }))
      .filter((x) => x.days !== null && x.days! <= 60)
      .sort((a, b) => (a.days! - b.days!));
  }, [contacts]);

  const dueContacts = useMemo(() => contacts.filter(isContactDue), [contacts]);
  const pendingTopicContacts = useMemo(() => contacts.filter((c) => (c.pending_topics ?? []).length > 0), [contacts]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Contactos
          </h1>
          <p className="text-sm text-muted-foreground">Tu CRM personal: amigos, familia, mentores y network.</p>
        </div>
        <ContactDialog onSave={upsertContact} />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-4 h-4" />} label="Contactos" value={contacts.length} />
        <StatCard icon={<Cake className="w-4 h-4" />} label="Cumpleaños 60d" value={upcomingBirthdays.length} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Toca contactar" value={dueContacts.length} />
        <StatCard icon={<Gift className="w-4 h-4" />} label="Ideas regalo" value={gifts.filter((g) => g.status === "idea").length} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="directorio">Directorio</TabsTrigger>
          <TabsTrigger value="cumples">Cumpleaños & Fechas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="regalos">Regalos</TabsTrigger>
        </TabsList>

        <TabsContent value="directorio" className="space-y-3">
          {contacts.length === 0 && <EmptyHint text="Aún no tienes contactos. Agrega el primero arriba." />}
          <div className="grid md:grid-cols-2 gap-3">
            {contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                interactionCount={interactions.filter((i) => i.contact_id === c.id).length}
                onOpen={() => setSelectedId(c.id)}
                onDelete={() => removeContact(c.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cumples" className="space-y-4">
          <Section title="🎂 Cumpleaños próximos" empty="Sin cumpleaños en los próximos 60 días.">
            {upcomingBirthdays.map(({ c, days }) => (
              <DateRow key={c.id} name={c.name} date={c.birthday!} days={days!} onClick={() => setSelectedId(c.id)} />
            ))}
          </Section>
          <Section title="💍 Aniversarios próximos" empty="Sin aniversarios en 60 días.">
            {upcomingAnniversaries.map(({ c, days }) => (
              <DateRow key={c.id} name={c.name} date={c.anniversary!} days={days!} onClick={() => setSelectedId(c.id)} />
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="pendientes" className="space-y-4">
          <Section title="⏰ Toca contactar" empty="Nadie pendiente. Bien 💪">
            {dueContacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary cursor-pointer" onClick={() => setSelectedId(c.id)}>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Último contacto: {c.last_contact_at ?? "nunca"} · cada {c.cadence_days ?? "?"}d
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </Section>
          <Section title="💭 Temas pendientes" empty="Sin temas pendientes registrados.">
            {pendingTopicContacts.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-secondary/40 cursor-pointer" onClick={() => setSelectedId(c.id)}>
                <div className="font-medium">{c.name}</div>
                <ul className="text-sm text-muted-foreground list-disc ml-5 mt-1">
                  {(c.pending_topics ?? []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="regalos" className="space-y-3">
          <GiftDialog contacts={contacts} onSave={upsertGift} />
          {gifts.length === 0 && <EmptyHint text="Sin ideas de regalo aún." />}
          <div className="grid md:grid-cols-2 gap-3">
            {gifts.map((g) => {
              const c = contacts.find((x) => x.id === g.contact_id);
              return (
                <Card key={g.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{g.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {c?.name ?? "sin destinatario"} · {g.occasion ?? "sin ocasión"} · {g.status}
                      </div>
                      {g.notes && <div className="text-sm mt-2">{g.notes}</div>}
                      {g.url && <a className="text-xs text-primary underline" href={g.url} target="_blank" rel="noreferrer">Enlace</a>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Select value={g.status} onValueChange={(v) => upsertGift({ ...g, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea</SelectItem>
                          <SelectItem value="comprado">Comprado</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                          <SelectItem value="descartado">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => removeGift(g.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {selected && (
        <ContactDetailDialog
          contact={selected}
          interactions={selectedInteractions}
          gifts={selectedGifts}
          onClose={() => setSelectedId(null)}
          onSave={upsertContact}
          onAddInteraction={addInteraction}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon} {label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground text-center p-6 border border-dashed rounded-lg">{text}</div>;
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.filter(Boolean).length > 0;
  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      {hasContent ? <div className="space-y-2">{children}</div> : <div className="text-xs text-muted-foreground">{empty}</div>}
    </div>
  );
}

function DateRow({ name, date, days, onClick }: { name: string; date: string; days: number; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary cursor-pointer" onClick={onClick}>
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{date}</div>
      </div>
      <Badge variant={days <= 7 ? "default" : "secondary"}>
        {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `en ${days}d`}
      </Badge>
    </div>
  );
}

function ContactCard({ contact, interactionCount, onOpen, onDelete }: { contact: Contact; interactionCount: number; onOpen: () => void; onDelete: () => void }) {
  const due = isContactDue(contact);
  return (
    <Card className="p-4 hover:border-primary/40 transition-colors cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium truncate">{contact.name}</div>
            {contact.relationship && <Badge variant="outline" className="text-[10px]">{contact.relationship}</Badge>}
            {due && <Badge className="text-[10px]">tocar</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {contact.last_contact_at ? `Último: ${contact.last_contact_at}` : "Sin contacto registrado"}
            {" · "}{interactionCount} 1:1
          </div>
          {(contact.pending_topics ?? []).length > 0 && (
            <div className="mt-2 text-xs text-primary">💭 {(contact.pending_topics ?? []).length} pendiente(s)</div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function ContactDialog({ existing, onSave, trigger }: { existing?: Contact; onSave: (c: Partial<Contact> & { name: string }) => void; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>(existing ?? {});
  const [topicsText, setTopicsText] = useState((existing?.pending_topics ?? []).join("\n"));

  const submit = () => {
    if (!form.name?.trim()) return;
    onSave({
      ...(existing ?? {}),
      ...form,
      name: form.name!.trim(),
      pending_topics: topicsText.split("\n").map((s) => s.trim()).filter(Boolean),
    } as Partial<Contact> & { name: string });
    setOpen(false);
    if (!existing) setForm({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="w-4 h-4 mr-1" /> Nuevo contacto</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{existing ? "Editar contacto" : "Nuevo contacto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Nombre"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Relación">
              <Select value={form.relationship ?? ""} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Importancia (1-5)">
              <Input type="number" min={1} max={5} value={form.importance ?? 3} onChange={(e) => setForm({ ...form, importance: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cumpleaños"><Input type="date" value={form.birthday ?? ""} onChange={(e) => setForm({ ...form, birthday: e.target.value || null })} /></Field>
            <Field label="Aniversario"><Input type="date" value={form.anniversary ?? ""} onChange={(e) => setForm({ ...form, anniversary: e.target.value || null })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Teléfono"><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ubicación"><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Cadencia (días)"><Input type="number" value={form.cadence_days ?? ""} onChange={(e) => setForm({ ...form, cadence_days: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <Field label="Cómo nos conocimos"><Input value={form.how_we_met ?? ""} onChange={(e) => setForm({ ...form, how_we_met: e.target.value })} /></Field>
          <Field label="Notas"><Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <Field label="Temas pendientes (uno por línea)">
            <Textarea rows={3} value={topicsText} onChange={(e) => setTopicsText(e.target.value)} placeholder="Preguntarle por su viaje&#10;Devolverle el libro" />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactDetailDialog({
  contact, interactions, gifts, onClose, onSave, onAddInteraction,
}: {
  contact: Contact;
  interactions: ReturnType<typeof useContacts>["interactions"];
  gifts: ReturnType<typeof useContacts>["gifts"];
  onClose: () => void;
  onSave: (c: Partial<Contact> & { name: string }) => void;
  onAddInteraction: (i: { contact_id: string; occurred_at?: string; kind?: string; summary?: string; notes?: string; next_agenda?: string }) => void;
}) {
  const [interaction, setInteraction] = useState({ summary: "", notes: "", next_agenda: "", kind: "meeting" });
  const submitInteraction = () => {
    if (!interaction.summary.trim() && !interaction.notes.trim()) return;
    onAddInteraction({
      contact_id: contact.id,
      occurred_at: new Date().toISOString().slice(0, 10),
      kind: interaction.kind,
      summary: interaction.summary,
      notes: interaction.notes,
      next_agenda: interaction.next_agenda,
    });
    setInteraction({ summary: "", notes: "", next_agenda: "", kind: "meeting" });
  };

  const lastNextAgenda = interactions.find((i) => i.next_agenda)?.next_agenda;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contact.name}
            {contact.relationship && <Badge variant="outline">{contact.relationship}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="reuniones">Reuniones ({interactions.length})</TabsTrigger>
            <TabsTrigger value="regalos">Regalos ({gifts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-2 text-sm">
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Teléfono" value={contact.phone} />
            <InfoRow label="Cumpleaños" value={contact.birthday} />
            <InfoRow label="Aniversario" value={contact.anniversary} />
            <InfoRow label="Ubicación" value={contact.location} />
            <InfoRow label="Cómo nos conocimos" value={contact.how_we_met} />
            <InfoRow label="Último contacto" value={contact.last_contact_at} />
            <InfoRow label="Cadencia" value={contact.cadence_days ? `${contact.cadence_days} días` : null} />
            {contact.notes && <div className="p-3 rounded-lg bg-secondary/40 whitespace-pre-wrap">{contact.notes}</div>}
            {(contact.pending_topics ?? []).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Temas pendientes</div>
                <ul className="list-disc ml-5 text-sm">
                  {(contact.pending_topics ?? []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            <div className="pt-3"><ContactDialog existing={contact} onSave={onSave} trigger={<Button variant="outline" size="sm">Editar</Button>} /></div>
          </TabsContent>

          <TabsContent value="reuniones" className="space-y-3">
            {lastNextAgenda && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="text-xs uppercase tracking-wide text-primary mb-1">Agenda para la próxima vez</div>
                <div className="text-sm whitespace-pre-wrap">{lastNextAgenda}</div>
              </div>
            )}
            <Card className="p-3 space-y-2">
              <div className="text-xs font-medium flex items-center gap-1"><MessageSquarePlus className="w-3.5 h-3.5" /> Registrar interacción</div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={interaction.kind} onValueChange={(v) => setInteraction({ ...interaction, kind: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Reunión 1:1</SelectItem>
                    <SelectItem value="call">Llamada</SelectItem>
                    <SelectItem value="message">Mensaje</SelectItem>
                    <SelectItem value="coffee">Café</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Resumen" value={interaction.summary} onChange={(e) => setInteraction({ ...interaction, summary: e.target.value })} />
              </div>
              <Textarea rows={2} placeholder="Notas de lo que hablamos" value={interaction.notes} onChange={(e) => setInteraction({ ...interaction, notes: e.target.value })} />
              <Textarea rows={2} placeholder="Agenda para la próxima vez" value={interaction.next_agenda} onChange={(e) => setInteraction({ ...interaction, next_agenda: e.target.value })} />
              <Button size="sm" onClick={submitInteraction}>Guardar interacción</Button>
            </Card>
            {interactions.map((i) => (
              <div key={i.id} className="p-3 rounded-lg bg-secondary/40">
                <div className="text-xs text-muted-foreground">{i.occurred_at} · {i.kind}</div>
                {i.summary && <div className="font-medium text-sm">{i.summary}</div>}
                {i.notes && <div className="text-sm whitespace-pre-wrap mt-1">{i.notes}</div>}
                {i.next_agenda && <div className="text-xs mt-2 text-primary">📌 Próxima: {i.next_agenda}</div>}
              </div>
            ))}
            {interactions.length === 0 && <div className="text-xs text-muted-foreground">Sin interacciones aún.</div>}
          </TabsContent>

          <TabsContent value="regalos" className="space-y-2">
            {gifts.map((g) => (
              <div key={g.id} className="p-3 rounded-lg bg-secondary/40">
                <div className="font-medium text-sm">{g.title} <Badge variant="outline" className="ml-2 text-[10px]">{g.status}</Badge></div>
                {g.notes && <div className="text-xs mt-1">{g.notes}</div>}
              </div>
            ))}
            {gifts.length === 0 && <div className="text-xs text-muted-foreground">Sin ideas de regalo para {contact.name}.</div>}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function GiftDialog({ contacts, onSave }: { contacts: Contact[]; onSave: (g: { title: string; contact_id?: string | null; notes?: string; url?: string; occasion?: string; price?: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; contact_id: string; notes: string; url: string; occasion: string; price: string }>({
    title: "", contact_id: "", notes: "", url: "", occasion: "", price: "",
  });
  const submit = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      contact_id: form.contact_id || null,
      notes: form.notes,
      url: form.url,
      occasion: form.occasion,
      price: form.price ? Number(form.price) : undefined,
    });
    setOpen(false);
    setForm({ title: "", contact_id: "", notes: "", url: "", occasion: "", price: "" });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva idea de regalo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva idea de regalo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Idea"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Para">
            <Select value={form.contact_id} onValueChange={(v) => setForm({ ...form, contact_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ocasión">
              <Select value={form.occasion} onValueChange={(v) => setForm({ ...form, occasion: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {OCCASION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Precio aprox."><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          </div>
          <Field label="URL"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></Field>
          <Field label="Notas"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter><Button onClick={submit}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-border/40 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
