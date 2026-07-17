/**
 * **Componente** — Tarjeta de gestión de notificaciones (permiso, Web Push, recordatorios).
 */
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check, Loader2, Brain, Sparkles, Utensils, Activity, Heart, User, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  notificationsSupported,
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/notifications";
import { collectOneSignalDiagnostics, disableOneSignalPush, requestPushPermission } from "@/lib/onesignal-client";
import { runOneSignalDeliveryDiagnostic, sendOneSignalTest } from "@/lib/onesignal-test.functions";
import { sendQuestTestNotification, createDemoQuest } from "@/lib/quests.functions";
import { sendIdentityTestNotification } from "@/lib/identity.functions";
import { IDENTITY_DEFS } from "@/lib/identities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

type Prefs = {
  global_notifications_enabled: boolean;
  daily_summary_enabled: boolean;
  daily_summary_hour: number;
  habit_reminders_enabled: boolean;
  task_reminders_enabled: boolean;
  medical_reminders_enabled: boolean;
  meal_reminders_enabled: boolean;
  exercise_reminders_enabled: boolean;
  identity_reminders_enabled: boolean;
};

const DEFAULT_PREFS: Prefs = {
  global_notifications_enabled: true,
  daily_summary_enabled: true,
  daily_summary_hour: 9,
  habit_reminders_enabled: true,
  task_reminders_enabled: true,
  medical_reminders_enabled: true,
  meal_reminders_enabled: true,
  exercise_reminders_enabled: true,
  identity_reminders_enabled: true,
};

export function NotificationsCard() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [pushActive, setPushActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [identityKey, setIdentityKey] = useState<string>(IDENTITY_DEFS[0].key);
  const [diagnosticReport, setDiagnosticReport] = useState("");

  useEffect(() => {
    if (notificationsSupported()) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          global_notifications_enabled: data.global_notifications_enabled ?? true,
          daily_summary_enabled: data.daily_summary_enabled,
          daily_summary_hour: data.daily_summary_hour,
          habit_reminders_enabled: data.habit_reminders_enabled,
          task_reminders_enabled: data.task_reminders_enabled,
          medical_reminders_enabled: data.medical_reminders_enabled ?? true,
          meal_reminders_enabled: data.meal_reminders_enabled ?? true,
          exercise_reminders_enabled: data.exercise_reminders_enabled ?? true,
          identity_reminders_enabled: data.identity_reminders_enabled ?? true,
        });
        setPushActive(Boolean(data.onesignal_player_id));
      }
      setLoading(false);
    })();
  }, [user]);

  async function savePrefs(next: Prefs) {
    if (!user) return;
    setPrefs(next);
    await supabase.from("notification_preferences").upsert({ user_id: user.id, ...next });
  }

  async function handleEnable() {
    setBusy(true);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Permiso de notificaciones denegado");
        return;
      }
      showLocalNotification("🐼 ¡Notificaciones activadas!", {
        body: "Te avisaré de tus hábitos y tareas.",
      });
      toast.success("Notificaciones activadas");
    } finally {
      setBusy(false);
    }
  }

  async function handleEnablePush() {
    if (!user) return;
    setBusy(true);
    try {
      const ok = await requestPushPermission();
      setPermission(Notification.permission);
      if (ok) {
        setPushActive(true);
        toast.success("Push Android activadas con OneSignal");
      } else {
        toast.error("No se pudo activar push. Abre os.cmrs.mx en Chrome Android e inténtalo de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDisablePush() {
    if (!user) return;
    setBusy(true);
    try {
      await disableOneSignalPush();
      setPushActive(false);
      toast.success("Push desactivadas");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendTest() {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Necesitas iniciar sesión");
        return;
      }
      
      // 1) OneSignal real push
      let osOk = false;
      try {
        const r = await sendOneSignalTest();
        if (r.ok) {
          toast.success(`Push OneSignal enviada (${r.recipients ?? 0} dispositivo/s)`);
          osOk = true;
        } else {
          toast.error(r.reason || "OneSignal no pudo enviar la push.");
        }
      } catch (e) {
        console.error("OneSignal test push error:", e);
        toast.error("Error invocando OneSignal.");
      }

      // 2) Local fallback
      showLocalNotification("🐼 ¡Funciona!", {
        body: "Notificación local de prueba.",
        badge: "/icon-192.png",
        icon: "/icon-192.png",
      });

      if (!osOk) {
        toast.info("Solo se envió la local. Activa Push y vuelve a intentar.");
      }
    } catch (e: any) {
      toast.error(e.message || "Error al enviar");
    } finally {
      setBusy(false);
    }
  }

  async function handleRunDiagnostics() {
    setBusy(true);
    try {
      const client = await collectOneSignalDiagnostics();
      const server = await runOneSignalDeliveryDiagnostic();
      const report = JSON.stringify({ client, server }, null, 2);
      setDiagnosticReport(report);
      await navigator.clipboard?.writeText(report).catch(() => undefined);
      toast.success("Diagnóstico copiado. Pégamelo aquí para corregir el error exacto.");
    } catch (e: any) {
      const report = JSON.stringify({ diagnosticError: e?.message ?? String(e) }, null, 2);
      setDiagnosticReport(report);
      toast.error("No se pudo completar el diagnóstico; copia el reporte mostrado.");
    } finally {
      setBusy(false);
    }
  }

  if (!notificationsSupported()) {
    return (
      <Card className="p-5 border-dashed">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="size-5" />
          <p className="text-sm">Tu navegador no soporta notificaciones.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <BellRing className="size-5 text-primary" /> Notificaciones
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los recordatorios y alertas del sistema.
          </p>
        </div>
        {permission === "granted" ? (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary inline-flex items-center gap-1">
            <Check className="size-3" /> Permitidas
          </span>
        ) : (
          <Button size="sm" onClick={handleEnable} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4 mr-1" />}
            Activar
          </Button>
        )}
      </div>

      {permission === "granted" && !loading && (
        <>
          <div className="space-y-4 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="min-w-0">
                <p className="font-semibold text-sm">Activar notificaciones</p>
                <p className="text-xs text-muted-foreground mt-0.5">Interruptor maestro para todos los avisos.</p>
              </div>
              <Switch 
                checked={prefs.global_notifications_enabled} 
                onCheckedChange={(v) => savePrefs({ ...prefs, global_notifications_enabled: v })} 
              />
            </div>

            <div className={`space-y-4 transition-opacity ${!prefs.global_notifications_enabled ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <PrefCard
                  icon={<Brain className="size-4" />}
                  label="Resumen IA"
                  description="Resumen diario de tu coach"
                  checked={prefs.daily_summary_enabled}
                  onChange={(v) => savePrefs({ ...prefs, daily_summary_enabled: v })}
                />
                <PrefCard
                  icon={<Sparkles className="size-4" />}
                  label="Hábitos"
                  description="Recordatorio de hábitos pendientes"
                  checked={prefs.habit_reminders_enabled}
                  onChange={(v) => savePrefs({ ...prefs, habit_reminders_enabled: v })}
                />
                <PrefCard
                  icon={<ClipboardList className="size-4" />}
                  label="Tareas"
                  description="Avisos de tareas vencidas"
                  checked={prefs.task_reminders_enabled}
                  onChange={(v) => savePrefs({ ...prefs, task_reminders_enabled: v })}
                />
                <PrefCard
                  icon={<Heart className="size-4" />}
                  label="Salud"
                  description="Medicamentos y citas médicas"
                  checked={prefs.medical_reminders_enabled}
                  onChange={(v) => savePrefs({ ...prefs, medical_reminders_enabled: v })}
                />
                <PrefCard
                  icon={<Utensils className="size-4" />}
                  label="Comidas"
                  description="Recordatorios de alimentación"
                  checked={prefs.meal_reminders_enabled}
                  onChange={(v) => savePrefs({ ...prefs, meal_reminders_enabled: v })}
                />
                <PrefCard
                  icon={<Activity className="size-4" />}
                  label="Ejercicio"
                  description="Tu rutina programada de hoy"
                  checked={prefs.exercise_reminders_enabled}
                  onChange={(v) => savePrefs({ ...prefs, exercise_reminders_enabled: v })}
                />
                <PrefCard
                  icon={<User className="size-4" />}
                  label="Identidad"
                  description="Diario y reflexión semanal"
                  checked={prefs.identity_reminders_enabled}
                  onChange={(v) => savePrefs({ ...prefs, identity_reminders_enabled: v })}
                />
              </div>
            </div>
          </div>

          {notificationsSupported() && (
            <div className={`border-t border-border/50 pt-4 ${!prefs.global_notifications_enabled ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Push notifications (servidor)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recibe alertas aunque la app esté cerrada. Requiere instalar la app.
                  </p>
                </div>
                {pushActive ? (
                  <Button size="sm" variant="outline" onClick={handleDisablePush} disabled={busy}>
                    Desactivar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleEnablePush} disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "Activar push"}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-border/50 pt-4 space-y-2">
            <Button size="sm" variant="secondary" onClick={handleSendTest} disabled={busy || !prefs.global_notifications_enabled} className="w-full">
              {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <Bell className="size-4 mr-2" />}
              Enviar notificación de prueba
            </Button>
            <Button size="sm" variant="outline" onClick={handleRunDiagnostics} disabled={busy} className="w-full">
              {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Diagnóstico Android / OneSignal
            </Button>
            {diagnosticReport && (
              <textarea
                readOnly
                value={diagnosticReport}
                className="h-44 w-full rounded-md border border-border bg-background p-2 font-mono text-[10px] text-muted-foreground"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await sendQuestTestNotification();
                    if (r.ok) toast.success(`🎯 Quest push enviada (${r.recipients ?? 0})`);
                    else toast.error(r.reason || "Falló quest push");
                  } finally { setBusy(false); }
                }}
              >
                🎯 Quest de prueba
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await createDemoQuest();
                    if (r.ok) toast.success("Quest demo creada ✓ (visible en Dashboard)");
                    else toast.error(r.reason || "Falló crear quest");
                  } finally { setBusy(false); }
                }}
              >
                ➕ Crear quest demo
              </Button>
            </div>

            <div className="flex items-stretch gap-2">
              <select
                aria-label="Identidad"
                value={identityKey}
                onChange={(e) => setIdentityKey(e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 text-xs"
              >
                {IDENTITY_DEFS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.emoji} {d.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await sendIdentityTestNotification({ data: { identity_key: identityKey } });
                    if (r.ok) toast.success(`👑 Identity push enviada (${r.recipients ?? 0})`);
                    else toast.error(r.reason || "Falló identity push");
                  } finally { setBusy(false); }
                }}
              >
                Enviar identidad
              </Button>
            </div>
          </div>

        </>
      )}
    </Card>
  );
}

function PrefCard({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-background border border-border shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
