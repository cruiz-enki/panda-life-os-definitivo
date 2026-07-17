import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, BellOff, Flame, Shield, Sparkles, Clock, ExternalLink, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotificationsEngine } from "@/hooks/use-notifications-engine";
import { initOneSignal, requestPushPermission, isOneSignalConfigured } from "@/lib/onesignal-client";
import { sendOneSignalTest } from "@/lib/onesignal-test.functions";
import { MODULE_EMOJI, MODULE_LABELS, STREAK_STATUS_LABEL, type ModuleKey } from "@/lib/notifications-engine-types";
import { InstallPWA } from "@/components/InstallPWA";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { settings, streaks, queue, loading, updateSettings } = useNotificationsEngine();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermissionStatus(Notification.permission);
    }
    void initOneSignal();
  }, []);

  useEffect(() => {
    if (!loading && settings && !settings.onesignal_player_id && permissionStatus !== "denied") {
      setShowOnboarding(true);
    }
  }, [loading, settings, permissionStatus]);

  const enablePush = async () => {
    if (!(await isOneSignalConfigured())) {
      toast.error("Falta ONESIGNAL_APP_ID. Agrega el secret y publica para activar push.");
      return;
    }
    const ok = await requestPushPermission();
    setPermissionStatus(Notification.permission);
    if (ok) {
      toast.success("¡Listo! Panda te enviará notificaciones cuando importe.");
      setShowOnboarding(false);
    } else {
      toast.error("Permiso denegado. Puedes activarlo desde la configuración del navegador.");
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-muted-foreground">Cargando motor de notificaciones…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
          <Bell className="w-7 h-7 text-amber-500" />
          Centro de Notificaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Panda te recuerda lo importante, protege tus rachas y respeta tu tiempo.
        </p>
      </header>

      {/* Instalar como PWA */}
      <InstallPWA />

      {/* Onboarding */}
      {showOnboarding && (
        <Card className="p-6 border-l-4 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🐼</div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold mb-1">Activa las notificaciones de Panda</h3>
              <p className="text-sm text-foreground/80 mb-4">
                Panda puede recordarte tus rachas, proteger tus avances con Freeze Days y ayudarte a no perder momentum.
                Nunca te enviaremos spam: máximo 3 al día y respetamos tus horas tranquilas.
              </p>
              <div className="flex gap-2">
                <Button onClick={enablePush} className="bg-amber-500 hover:bg-amber-600">
                  <Bell className="w-4 h-4 mr-2" /> Activar notificaciones
                </Button>
                <Button variant="ghost" onClick={() => setShowOnboarding(false)}>Más tarde</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Estado push */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {settings.onesignal_player_id && permissionStatus === "granted" ? (
              <><Bell className="w-5 h-5 text-emerald-500" /><span className="font-medium">Push activo</span></>
            ) : (
              <><BellOff className="w-5 h-5 text-muted-foreground" /><span className="font-medium">Push inactivo</span></>
            )}
          </div>
          <div className="flex gap-2">
            {permissionStatus !== "granted" && (
              <Button onClick={enablePush} size="sm">Activar</Button>
            )}
            {settings.onesignal_player_id && permissionStatus === "granted" && (
              <Button
                size="sm"
                variant="outline"
                disabled={sendingTest}
                onClick={async () => {
                  setSendingTest(true);
                  try {
                    const result = await sendOneSignalTest();
                    if (result.ok) {
                      toast.success("🐼 Push enviado. Revisa tu navegador.");
                    } else {
                      toast.error(result.reason ?? "OneSignal no pudo enviar la push.");
                      console.error("[onesignal-test-push]", result);
                    }
                  } catch (e) {
                    toast.error("Error invocando OneSignal");
                    console.error(e);
                  } finally {
                    setSendingTest(false);
                  }
                }}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {sendingTest ? "Enviando…" : "Enviar push de prueba"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Rachas activas */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> Rachas activas
        </h2>
        {streaks.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Aún no tienes rachas. Completa una acción de cualquier módulo para empezar.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {streaks.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MODULE_EMOJI[s.module_key as ModuleKey] ?? "✨"}</span>
                    <div>
                      <div className="font-semibold">{MODULE_LABELS[s.module_key as ModuleKey] ?? s.module_key}</div>
                      <div className="text-xs text-muted-foreground">
                        Récord: {s.longest_streak} días
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-orange-500">{s.current_streak}</div>
                    <Badge variant={s.streak_status === "at_risk" ? "destructive" : s.streak_status === "frozen" ? "secondary" : "default"} className="text-[10px]">
                      {STREAK_STATUS_LABEL[s.streak_status as keyof typeof STREAK_STATUS_LABEL] ?? s.streak_status}
                    </Badge>
                  </div>
                </div>
                {s.freeze_days_available > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    {s.freeze_days_available} Freeze Day{s.freeze_days_available > 1 ? "s" : ""} disponible{s.freeze_days_available > 1 ? "s" : ""}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Configuración */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Configuración
        </h2>
        <Card className="p-5 space-y-5">
          <SettingRow label="Notificaciones globales" checked={settings.global_notifications_enabled} onChange={(v) => updateSettings({ global_notifications_enabled: v })} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Hora preferida (mañana)</Label>
              <Input type="time" value={settings.preferred_morning_time.slice(0, 5)} onChange={(e) => updateSettings({ preferred_morning_time: `${e.target.value}:00` })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hora preferida (tarde)</Label>
              <Input type="time" value={settings.preferred_evening_time.slice(0, 5)} onChange={(e) => updateSettings({ preferred_evening_time: `${e.target.value}:00` })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quiet hours inicio</Label>
              <Input type="number" min={0} max={23} value={settings.quiet_hours_start ?? 22} onChange={(e) => updateSettings({ quiet_hours_start: parseInt(e.target.value, 10) })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quiet hours fin</Label>
              <Input type="number" min={0} max={23} value={settings.quiet_hours_end ?? 7} onChange={(e) => updateSettings({ quiet_hours_end: parseInt(e.target.value, 10) })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Máximo de notificaciones por día</Label>
              <Input type="number" min={1} max={10} value={settings.max_daily_notifications} onChange={(e) => updateSettings({ max_daily_notifications: parseInt(e.target.value, 10) })} />
            </div>
          </div>

          <div className="pt-2 border-t space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Por módulo</h3>
            <SettingRow label="🔥 Rachas" checked={settings.allow_streak_notifications} onChange={(v) => updateSettings({ allow_streak_notifications: v })} />
            <SettingRow label="🎯 Misiones / Quests" checked={settings.allow_quest_notifications} onChange={(v) => updateSettings({ allow_quest_notifications: v })} />
            <SettingRow label="💰 Money OS" checked={settings.allow_money_notifications} onChange={(v) => updateSettings({ allow_money_notifications: v })} />
            <SettingRow label="🏠 Home OS" checked={settings.allow_home_notifications} onChange={(v) => updateSettings({ allow_home_notifications: v })} />
            <SettingRow label="📚 Learning" checked={settings.allow_learning_notifications} onChange={(v) => updateSettings({ allow_learning_notifications: v })} />
            <SettingRow label="💪 Salud" checked={settings.allow_health_notifications} onChange={(v) => updateSettings({ allow_health_notifications: v })} />
            <SettingRow label="✨ Motivacionales" checked={settings.allow_motivational_notifications} onChange={(v) => updateSettings({ allow_motivational_notifications: v })} />
          </div>
        </Card>
      </section>

      {/* Historial */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" /> Historial
        </h2>
        {queue.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">Aún no hay notificaciones registradas.</Card>
        ) : (
          <div className="space-y-2">
            {queue.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{MODULE_EMOJI[n.module_key as ModuleKey] ?? "🔔"}</span>
                      <span className="font-semibold truncate">{n.title}</span>
                      <Badge variant={n.status === "sent" ? "default" : n.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                        {n.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2">{n.body}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(n.sent_at ?? n.created_at).toLocaleString("es-MX")}
                    </div>
                  </div>
                  {n.deep_link && (
                    <Button asChild variant="ghost" size="icon">
                      <a href={n.deep_link}><ExternalLink className="w-4 h-4" /></a>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SettingRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
