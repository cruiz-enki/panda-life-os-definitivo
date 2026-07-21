/**
 * **Deep link universal** — /quick/:action?params
 *
 * Ejecuta acciones rápidas desde URLs (Apple Shortcuts, widgets, otras apps).
 *
 * Ejemplos:
 *   /quick/expense?amount=120&cat=comida&note=taquería
 *   /quick/med?name=telmisartan
 *   /quick/location?name=Casa&category=hogar
 *   /quick/mood?mood=good&intensity=4&energy=4
 *   /quick/water?amount=250
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useFinance } from "@/hooks/use-finance";
import { useHealth } from "@/hooks/use-health";
import { useLocations } from "@/hooks/use-locations";
import { useMood } from "@/hooks/use-mood";
import { supabase } from "@/integrations/supabase/client";
import { todayCDMX } from "@/lib/date-utils";
import { toast } from "sonner";

/** Normaliza texto: minúsculas + sin acentos, para hacer match tolerante. */
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

type QuickSearch = {
  amount: string; cat: string; category: string; note: string; method: string;
  name: string; names: string; id: string; key: string; lat: string; lng: string;
  mood: string; intensity: string; energy: string; pain: string;
  auto: string; redirect: string;
};

const s = (v: unknown, d = "") => (typeof v === "string" ? v : v == null ? d : String(v));

export const Route = createFileRoute("/quick/$action")({
  head: () => ({ meta: [{ title: "Acción rápida · Panda OS" }] }),
  validateSearch: (r: Record<string, unknown>): QuickSearch => ({
    amount: s(r.amount), cat: s(r.cat), category: s(r.category), note: s(r.note),
    method: s(r.method, "cash"), name: s(r.name), names: s(r.names), id: s(r.id),
    key: s(r.key), lat: s(r.lat), lng: s(r.lng), mood: s(r.mood), intensity: s(r.intensity),
    energy: s(r.energy), pain: s(r.pain), auto: s(r.auto, "1"), redirect: s(r.redirect),
  }),
  component: QuickActionPage,
});

type Status = "idle" | "running" | "success" | "error";

function QuickActionPage() {
  const { action } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const finance = useFinance();
  const health = useHealth();
  const locations = useLocations();
  const mood = useMood();

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [detail, setDetail] = useState<string>("");
  const ranRef = useRef(false);

  const goHomeAfter = () => {
    if (search.redirect) {
      setTimeout(() => navigate({ to: search.redirect as any }), 1200);
    }
  };

  const run = async () => {
    if (!user) {
      setStatus("error");
      setMessage("Inicia sesión primero");
      return;
    }
    setStatus("running");
    try {
      switch (action) {
        case "expense": {
          const amount = Number(search.amount);
          if (!amount || amount <= 0) throw new Error("Monto inválido");
          const cat = search.cat || search.category || "otros";
          const method = ["cash", "debit", "credit", "transfer", "mercadopago", "other"].includes(search.method)
            ? (search.method as any)
            : "cash";
          const err = await finance.createExpense({
            amount,
            date: todayCDMX(),
            category: cat,
            payment_method: method,
            card_id: null,
            note: search.note || "",
            tags: [],
            kind: "expense",
            expense_type: "normal",
            msi_plan_id: null,
          });
          if (err) throw new Error(err.message);
          setMessage(`Gasto registrado`);
          setDetail(`$${amount.toLocaleString("es-MX")} · ${cat}`);
          break;
        }
        case "income": {
          const amount = Number(search.amount);
          if (!amount || amount <= 0) throw new Error("Monto inválido");
          const err = await finance.createExpense({
            amount,
            date: todayCDMX(),
            category: search.cat || search.category || "ingreso",
            payment_method: (search.method as any) || "transfer",
            card_id: null,
            note: search.note || "",
            tags: [],
            kind: "income",
            expense_type: "normal",
            msi_plan_id: null,
          });
          if (err) throw new Error(err.message);
          setMessage("Ingreso registrado");
          setDetail(`+$${amount.toLocaleString("es-MX")}`);
          break;
        }
        case "med": {
          const query = norm(search.name || search.id);
          if (!query) throw new Error("Falta nombre del medicamento");
          const med = health.medications.find(
            (m) => m.id === search.id || norm(m.name).includes(query),
          );
          if (!med) throw new Error(`No encontré "${query}"`);
          const now = new Date();
          const err = await health.logMedication({
            medication_id: med.id,
            date: todayCDMX(),
            scheduled_time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
            taken: true,
            taken_at: now.toISOString(),
            notes: search.note || "",
          });
          if (err) throw new Error(err.message);
          setMessage("Medicamento tomado");
          setDetail(`${med.emoji} ${med.name} ${med.dose}${med.unit}`);
          break;
        }
        case "meds": {
          const list = (search.names || search.name).split(",").map((n: string) => norm(n)).filter(Boolean);
          if (!list.length) throw new Error("Falta names=med1,med2,...");
          const now = new Date();
          const scheduled = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const ok: string[] = [];
          const miss: string[] = [];
          for (const q of list) {
            const med = health.medications.find((m) => norm(m.name).includes(q));
            if (!med) { miss.push(q); continue; }
            const err = await health.logMedication({
              medication_id: med.id,
              date: todayCDMX(),
              scheduled_time: scheduled,
              taken: true,
              taken_at: now.toISOString(),
              notes: search.note || "",
            });
            if (err) miss.push(q); else ok.push(med.emoji ? `${med.emoji} ${med.name}` : med.name);
          }
          if (!ok.length) throw new Error(`No encontré: ${miss.join(", ")}`);
          setMessage(`${ok.length} medicamento${ok.length > 1 ? "s" : ""} registrado${ok.length > 1 ? "s" : ""}`);
          setDetail(ok.join(" · ") + (miss.length ? ` — sin match: ${miss.join(", ")}` : ""));
          break;
        }
        case "slot": {
          const slotKey = norm(search.key || search.name);
          if (!slotKey) throw new Error("Falta key=am|pm");
          const { data: slot, error: sErr } = await supabase
            .from("med_slots")
            .select("id, label, emoji, med_slot_items(medication_id)")
            .eq("user_id", user.id)
            .eq("key", slotKey)
            .maybeSingle();
          if (sErr) throw new Error(sErr.message);
          if (!slot) throw new Error(`No existe el slot "${slotKey}". Créalo en Salud → Medicación.`);
          const ids: string[] = (slot.med_slot_items ?? []).map((i: { medication_id: string }) => i.medication_id);
          if (!ids.length) throw new Error(`El slot "${slotKey}" no tiene medicinas.`);
          const now = new Date();
          const scheduled = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const ok: string[] = [];
          for (const medId of ids) {
            const med = health.medications.find((m) => m.id === medId);
            if (!med || !med.active) continue;
            const err = await health.logMedication({
              medication_id: medId,
              date: todayCDMX(),
              scheduled_time: scheduled,
              taken: true,
              taken_at: now.toISOString(),
              notes: search.note || `slot:${slotKey}`,
            });
            if (!err) ok.push(`${med.emoji ?? "💊"} ${med.name}`);
          }
          if (!ok.length) throw new Error("No se registró ninguna");
          setMessage(`${slot.emoji ?? "💊"} ${slot.label} · ${ok.length} med${ok.length > 1 ? "s" : ""}`);
          setDetail(ok.join(" · "));
          break;
        }
        case "location":
        case "checkin": {
          const name = search.name;
          if (!name) throw new Error("Falta nombre del lugar");
          const err = await locations.add({
            name,
            category: search.category || search.cat || "momento",
            latitude: search.lat ? Number(search.lat) : null,
            longitude: search.lng ? Number(search.lng) : null,
            address: null,
            place_id: null,
            visited_at: todayCDMX(),
            note: search.note || null,
            rating: null,
          });
          if (err) throw new Error(err);
          setMessage("Check-in registrado");
          setDetail(`📍 ${name}`);
          break;
        }
        case "mood": {
          const moodKey = search.mood || "good";
          await mood.add({
            mood: moodKey,
            intensity: search.intensity ? Number(search.intensity) : 3,
            tags: [],
            note: search.note || "",
            energy: search.energy ? Number(search.energy) : undefined,
            pain: search.pain ? Number(search.pain) : undefined,
          });
          setMessage("Check-in emocional registrado");
          setDetail(`Mood: ${moodKey}`);
          break;
        }
        case "water": {
          const amount = Number(search.amount) || 250;
          const today = todayCDMX();
          const existing = health.waterLogs.find((w) => w.date === today);
          const total = (existing?.amount_ml ?? 0) + amount;
          const err = await health.logWater(today, total);
          if (err) throw new Error(err.message);
          setMessage("Agua registrada");
          setDetail(`+${amount} ml · Hoy: ${total} ml`);
          break;
        }
        default:
          throw new Error(`Acción "${action}" no existe`);
      }
      setStatus("success");
      toast.success(message || "Registrado");
      goHomeAfter();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus("error");
      setMessage("Error");
      setDetail(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (ranRef.current) return;
    if (!user) return;
    if (search.auto !== "1") return;
    ranRef.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, action]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        <div className="flex justify-center">
          {status === "running" && <Loader2 className="w-14 h-14 animate-spin text-primary" />}
          {status === "success" && <CheckCircle2 className="w-14 h-14 text-green-500" />}
          {status === "error" && <XCircle className="w-14 h-14 text-destructive" />}
          {status === "idle" && <ArrowRight className="w-14 h-14 text-muted-foreground" />}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold capitalize">{action}</h1>
          {message && <p className="text-lg mt-1">{message}</p>}
          {detail && <p className="text-sm text-muted-foreground mt-1">{detail}</p>}
        </div>

        {status === "idle" && (
          <Button onClick={run} className="w-full">
            Ejecutar
          </Button>
        )}
        {status === "error" && (
          <Button onClick={() => { ranRef.current = false; void run(); }} variant="outline" className="w-full">
            Reintentar
          </Button>
        )}

        <div className="flex gap-2 pt-2">
          <Link to="/" className="flex-1">
            <Button variant="secondary" className="w-full">Home</Button>
          </Link>
          <Link to="/quick" className="flex-1">
            <Button variant="ghost" className="w-full">Ver atajos</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
