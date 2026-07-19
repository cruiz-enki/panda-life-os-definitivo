/**
 * **Componente** — Tarjeta de integración con Telegram (vincular chat, enviar test).
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, MessageCircle, Loader2, ClipboardList, Heart, Utensils, Activity, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { sendTelegramTest, syncTelegramNow } from "@/lib/telegram.functions";

type Cfg = {
  user_id: string;
  chat_id: number | string | null;
  notify_overdue_tasks: boolean;
  notify_time: string;
  timezone: string;
  notify_medications: boolean;
  notify_meals: boolean;
  notify_exercise: boolean;
  notify_habits: boolean;
  notify_identity: boolean;
  meal_breakfast_time: string;
  meal_lunch_time: string;
  meal_dinner_time: string;
  exercise_time: string;
  enabled: boolean;
};

export function TelegramCard() {
  const { user } = useAuth();
  const sendTest = useServerFn(sendTelegramTest);
  const syncNow = useServerFn(syncTelegramNow);

  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: existing, error } = await supabase
        .from("telegram_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      if (existing) {
        setCfg(existing as Cfg);
      } else {
        const { data: created, error: insErr } = await supabase
          .from("telegram_config")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (insErr) throw insErr;
        setCfg(created as Cfg);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("telegram_config")
        .update(patch as never)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      setCfg(data as Cfg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!cfg?.chat_id) return;
    setTesting(true);
    try {
      await sendTest({ data: { chatId: cfg.chat_id } });
      toast.success("Mensaje enviado a Telegram");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error enviando");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncTelegram = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await syncNow();
      await refresh();
      toast.success("Telegram sincronizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo sincronizar Telegram");
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlink = async () => {
    if (!user) return;
    if (!confirm("¿Desvincular Telegram? Tendrás que escribir /start de nuevo al bot.")) return;
    const { error } = await supabase
      .from("telegram_config")
      .update({ chat_id: null })
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Desvinculado");
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Telegram</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando…
        </div>
      ) : !cfg?.chat_id ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Conecta tu Telegram para recibir avisos de tareas vencidas y capturar tareas/notas escribiendo al bot.
          </p>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5">
            <li>Abre el chat con tu bot en Telegram.</li>
            <li>Envíale el comando <code className="bg-secondary px-1 rounded">/start</code>.</li>
            <li>Espera unos segundos y refresca esta página.</li>
          </ol>
          <Button variant="outline" size="sm" onClick={handleSyncTelegram} disabled={syncing}>
            {syncing ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Ya envié /start, sincronizar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="min-w-0">
              <p className="font-semibold text-sm">Activar bot de Telegram</p>
              <p className="text-xs text-muted-foreground mt-0.5">Habilita o deshabilita todos los mensajes del bot.</p>
            </div>
            <Switch 
              checked={cfg.enabled} 
              onCheckedChange={(v) => save({ enabled: v })} 
            />
          </div>

          <div className={`space-y-4 transition-opacity ${!cfg.enabled ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="text-sm text-muted-foreground">
              <span className="text-emerald-500">●</span> Conectado · chat ID <code className="bg-secondary px-1 rounded text-xs">{String(cfg.chat_id)}</code>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TgSwitch
                icon={<ClipboardList className="size-4" />}
                label="Tareas vencidas"
                checked={cfg.notify_overdue_tasks}
                onCheckedChange={(v) => save({ notify_overdue_tasks: v })}
              />
              <TgSwitch
                icon={<Heart className="size-4" />}
                label="Medicamentos"
                checked={cfg.notify_medications}
                onCheckedChange={(v) => save({ notify_medications: v })}
              />
              <TgSwitch
                icon={<Utensils className="size-4" />}
                label="Comidas"
                checked={cfg.notify_meals}
                onCheckedChange={(v) => save({ notify_meals: v })}
              />
              <TgSwitch
                icon={<Activity className="size-4" />}
                label="Ejercicio"
                checked={cfg.notify_exercise}
                onCheckedChange={(v) => save({ notify_exercise: v })}
              />
              <TgSwitch
                icon={<Sparkles className="size-4" />}
                label="Hábitos"
                checked={cfg.notify_habits}
                onCheckedChange={(v) => save({ notify_habits: v })}
              />
              <TgSwitch
                icon={<User className="size-4" />}
                label="Identidad"
                checked={cfg.notify_identity}
                onCheckedChange={(v) => save({ notify_identity: v })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="notify-time" className="text-sm font-medium">Hora de avisos generales</Label>
                <Input
                  id="notify-time"
                  type="time"
                  value={cfg.notify_time?.slice(0, 5) ?? "08:00"}
                  disabled={saving}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    save({ notify_time: v.length === 5 ? `${v}:00` : v });
                  }}
                  className="w-32"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-sm font-medium">Zona horaria</Label>
                <Input
                  id="timezone"
                  value={cfg.timezone}
                  disabled={saving}
                  onChange={(e) => setCfg({ ...cfg, timezone: e.target.value })}
                  onBlur={(e) => save({ timezone: e.target.value })}
                  className="w-full"
                  placeholder="America/Mexico_City"
                />
              </div>
            </div>

            {cfg.notify_meals && (
              <div className="space-y-3 bg-secondary/20 p-3 rounded-xl border border-border/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Utensils className="size-3" /> Horarios de comida
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Desayuno</Label>
                    <Input
                      type="time"
                      value={cfg.meal_breakfast_time?.slice(0, 5) ?? "08:00"}
                      disabled={saving}
                      onChange={(e) => { const v = e.target.value; if (!v) return; save({ meal_breakfast_time: v.length === 5 ? `${v}:00` : v }); }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Comida</Label>
                    <Input
                      type="time"
                      value={cfg.meal_lunch_time?.slice(0, 5) ?? "14:00"}
                      disabled={saving}
                      onChange={(e) => save({ meal_lunch_time: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Cena</Label>
                    <Input
                      type="time"
                      value={cfg.meal_dinner_time?.slice(0, 5) ?? "20:00"}
                      disabled={saving}
                      onChange={(e) => save({ meal_dinner_time: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {cfg.notify_exercise && (
              <div className="space-y-3 bg-secondary/20 p-3 rounded-xl border border-border/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="size-3" /> Horario ejercicio
                </p>
                <div className="max-w-[10rem]">
                  <Input
                    type="time"
                    value={cfg.exercise_time?.slice(0, 5) ?? "07:00"}
                    disabled={saving}
                    onChange={(e) => save({ exercise_time: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border/50 mt-4">
              <Button onClick={handleTest} disabled={testing} size="sm" className="flex-1">
                {testing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                Prueba
              </Button>
              <Button onClick={handleUnlink} variant="outline" size="sm" className="flex-1">
                Desvincular
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function TgSwitch({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/50">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="text-primary shrink-0">
          {icon}
        </div>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
