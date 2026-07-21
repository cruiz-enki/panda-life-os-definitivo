/**
 * **Server Route** — Cron público: envía recordatorios programados por Telegram.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/server/telegram.server";
import { titoReminderMessage } from "@/lib/tito-tone";

type Cfg = {
  user_id: string;
  chat_id: number | null;
  timezone: string;
  notify_overdue_tasks: boolean;
  notify_time: string;
  notify_medications: boolean;
  notify_meals: boolean;
  notify_exercise: boolean;
  meal_breakfast_time: string;
  meal_lunch_time: string;
  meal_dinner_time: string;
  exercise_time: string;
  last_reminder_keys: string[];
  enabled: boolean;
  notify_habits: boolean;
  notify_identity: boolean;
};

type GlobalPrefs = {
  global_notifications_enabled: boolean;
  task_reminders_enabled: boolean;
  habit_reminders_enabled: boolean;
  medical_reminders_enabled: boolean;
  meal_reminders_enabled: boolean;
  exercise_reminders_enabled: boolean;
  daily_summary_enabled: boolean;
};

function nowInTZ(tz: string): { hh: number; mm: number; ymd: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    hh: Number(parts.hour),
    mm: Number(parts.minute),
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function parseHM(t: string): { hh: number; mm: number } {
  const [h, m] = t.split(":");
  return { hh: Number(h), mm: Number(m ?? 0) };
}

// El cron corre cada 5 min: hacemos match con tolerancia ±2 min sobre el minuto programado.
function withinWindow(now: { hh: number; mm: number }, target: { hh: number; mm: number }) {
  const nowMins = now.hh * 60 + now.mm;
  const tMins = target.hh * 60 + target.mm;
  return Math.abs(nowMins - tMins) <= 2;
}

export const Route = createFileRoute("/api/public/hooks/telegram-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(SUPABASE_URL, SERVICE, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: cfgs, error } = await supabase
          .from("telegram_config")
          .select("*")
          .not("chat_id", "is", null);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        const baseUrl = new URL(request.url).origin;
        const sendPush = async (userId: string, push: { title: string; body: string; url?: string; tag?: string }) => {
          try {
            await fetch(`${baseUrl}/api/public/hooks/send-push`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
              body: JSON.stringify({ user_id: userId, ...push }),
            });
          } catch (e) {
            console.error("send push failed", e);
          }
        };

        let sent = 0;
        for (const cfg of (cfgs ?? []) as Cfg[]) {
          if (!cfg.chat_id || cfg.enabled === false) continue;

          // Check global notifications preference
          const { data: rawPrefs } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", cfg.user_id)
            .maybeSingle();
          
          const globalPrefs = (rawPrefs as GlobalPrefs) || {
            global_notifications_enabled: true,
            task_reminders_enabled: true,
            habit_reminders_enabled: true,
            medical_reminders_enabled: true,
            meal_reminders_enabled: true,
            exercise_reminders_enabled: true,
            daily_summary_enabled: true,
          };
          
          if (globalPrefs.global_notifications_enabled === false) {
            continue;
          }

          const tz = cfg.timezone || "America/Mexico_City";
          const now = nowInTZ(tz);
          const dedupKeys = new Set(cfg.last_reminder_keys ?? []);
          // Limpia llaves de días anteriores
          for (const k of [...dedupKeys]) {
            if (!k.startsWith(now.ymd)) dedupKeys.delete(k);
          }
          const fired: string[] = [];

          const fire = async (
            key: string,
            text: string,
            push: { title: string; body: string; url?: string; tag?: string },
          ) => {
            if (dedupKeys.has(key)) return;
            try {
              await sendTelegramMessage(cfg.chat_id!, text);
              await sendPush(cfg.user_id, push);
              dedupKeys.add(key);
              fired.push(key);
              sent++;
            } catch (e) {
              console.error("send reminder failed", key, e);
            }
          };

          // === Medicamentos ===
          // Si hay med_slots definidos, se envía UNA notificación por slot
          // (agrupada) con la lista de meds. Si no hay slots, cae al
          // comportamiento legacy: una notif por cada schedule_time.
          if (cfg.notify_medications && globalPrefs.medical_reminders_enabled) {
            const { data: slots } = await supabase
              .from("med_slots")
              .select("id, key, label, emoji, time, active, med_slot_items(medication_id, health_medications(id, name, dose, active))")
              .eq("user_id", cfg.user_id)
              .eq("active", true);

            const hasSlots = Array.isArray(slots) && slots.length > 0;

            if (hasSlots) {
              for (const slot of slots!) {
                const target = parseHM((slot.time as string).slice(0, 5));
                if (!withinWindow(now, target)) continue;
                const items = (slot.med_slot_items ?? []) as Array<{
                  health_medications: Array<{ id: string; name: string; dose: string | null; active: boolean }> | { id: string; name: string; dose: string | null; active: boolean } | null;
                }>;
                const meds = items
                  .flatMap((i) => (Array.isArray(i.health_medications) ? i.health_medications : i.health_medications ? [i.health_medications] : []))
                  .filter((m) => m.active);
                if (!meds.length) continue;
                const key = `${now.ymd}|slot|${slot.id}`;
                const list = meds.map((m) => `• ${m.name}${m.dose ? ` (${m.dose})` : ""}`).join("\n");
                const emoji = (slot.emoji as string) || "💊";
                const label = slot.label as string;
                const tito = titoReminderMessage({
                  kind: "med",
                  subject: `${label.toLowerCase()} (${meds.length} med${meds.length === 1 ? "" : "s"})`,
                  detail: `${list}\n\nToca 1 sola vez para registrar: https://os.cmrs.mx/quick/slot?key=${slot.key}`,
                  level: 1,
                  seed: slot.id as string,
                });
                await fire(
                  key,
                  `${emoji} ${tito.body}`,
                  { title: `${emoji} ${tito.title}`, body: `${meds.length} medicinas`, url: `/quick/slot?key=${slot.key}`, tag: `slot-${slot.id}` },
                );
              }
            } else {
              const { data: meds } = await supabase
                .from("health_medications")
                .select("id, name, dose, schedule_times, status, active")
                .eq("user_id", cfg.user_id)
                .eq("active", true)
                .eq("status", "active");
              for (const m of meds ?? []) {
                for (const t of (m.schedule_times ?? []) as string[]) {
                  const target = parseHM(t);
                  if (!withinWindow(now, target)) continue;
                  const key = `${now.ymd}|med|${m.id}|${t}`;
                  const dose = m.dose ? ` (${m.dose})` : "";
                  await fire(
                    key,
                    `💊 *Medicamento*\nEs hora de: *${m.name}*${dose}`,
                    { title: "💊 Medicamento", body: `Es hora de: ${m.name}${dose}`, url: "/health", tag: `med-${m.id}-${t}` },
                  );
                }
              }
            }
          }

          // === Comidas ===
          if (cfg.notify_meals && globalPrefs.meal_reminders_enabled) {
            const meals: Array<{ key: string; label: string; emoji: string; type: string; time: string }> = [
              { key: "breakfast", label: "Desayuno", emoji: "🥞", type: "breakfast", time: cfg.meal_breakfast_time },
              { key: "lunch", label: "Comida", emoji: "🍽️", type: "lunch", time: cfg.meal_lunch_time },
              { key: "dinner", label: "Cena", emoji: "🌙", type: "dinner", time: cfg.meal_dinner_time },
            ];
            for (const meal of meals) {
              const target = parseHM(meal.time);
              if (!withinWindow(now, target)) continue;
              const key = `${now.ymd}|meal|${meal.key}`;
              // Busca plan del día
              const { data: plan } = await supabase
                .from("meal_plan")
                .select("custom_name, completed, dish_id, meal_dishes(name)")
                .eq("user_id", cfg.user_id)
                .eq("date", now.ymd)
                .eq("meal_type", meal.type)
                .maybeSingle();
              const planned =
                (plan as any)?.custom_name?.trim() ||
                (plan as any)?.meal_dishes?.name ||
                "sin planear";
              const status = (plan as any)?.completed ? " ✅" : "";
              await fire(
                key,
                `${meal.emoji} *${meal.label}*\nHora de comer: _${planned}_${status}\n\nhttps://os.cmrs.mx/meals`,
                { title: `${meal.emoji} ${meal.label}`, body: `Hora de comer: ${planned}${status}`, url: "/meals", tag: `meal-${meal.key}` },
              );
            }
          }

          // === Ejercicio ===
          if (cfg.notify_exercise && globalPrefs.exercise_reminders_enabled) {
            const target = parseHM(cfg.exercise_time);
            if (withinWindow(now, target)) {
              const key = `${now.ymd}|exercise`;
              const dow = new Date(`${now.ymd}T12:00:00Z`).getUTCDay(); // 0..6
              const { data: sched } = await supabase
                .from("workout_schedule")
                .select("is_rest, routines(name)")
                .eq("user_id", cfg.user_id)
                .or(`scheduled_date.eq.${now.ymd},day_of_week.eq.${dow}`)
                .limit(1)
                .maybeSingle();
              const isRest = (sched as any)?.is_rest;
              const routine = (sched as any)?.routines?.name;
              const text = isRest
                ? `🧘 *Día de descanso*\nDescansa y recupérate.`
                : routine
                  ? `🏋️ *Ejercicio*\nHoy toca: *${routine}*\n\nhttps://os.cmrs.mx/exercise`
                  : `🏃 *Ejercicio*\nNo tienes rutina programada hoy. ¿Movemos el cuerpo?\n\nhttps://os.cmrs.mx/exercise`;
              const pushBody = isRest
                ? "Día de descanso. Recupérate."
                : routine
                  ? `Hoy toca: ${routine}`
                  : "No tienes rutina hoy. ¿Movemos el cuerpo?";
              await fire(key, text, {
                title: isRest ? "🧘 Descanso" : "🏋️ Ejercicio",
                body: pushBody,
                url: "/exercise",
                tag: "exercise",
              });
            }
          }

          // === Tareas vencidas ===
          if (cfg.notify_overdue_tasks && globalPrefs.task_reminders_enabled) {
            const target = parseHM(cfg.notify_time);
            if (withinWindow(now, target)) {
              const key = `${now.ymd}|tasks`;
              const { data: tasks } = await supabase
                .from("tasks")
                .select("title, due")
                .eq("user_id", cfg.user_id)
                .eq("completed", false)
                .not("due", "is", null)
                .lt("due", new Date().toISOString())
                .order("due", { ascending: true })
                .limit(10);
              if (tasks && tasks.length > 0) {
                const lines = (tasks as any[])
                  .map((t) => `• ${t.title} _(${new Date(t.due).toLocaleDateString("es-MX")})_`)
                  .join("\n");
                await fire(
                  key,
                  `⏰ *Tienes ${tasks.length} tarea${tasks.length === 1 ? "" : "s"} vencida${tasks.length === 1 ? "" : "s"}:*\n\n${lines}\n\nhttps://os.cmrs.mx/tasks`,
                  {
                    title: `⏰ ${tasks.length} tarea${tasks.length === 1 ? "" : "s"} vencida${tasks.length === 1 ? "" : "s"}`,
                    body: (tasks as any[]).map((t) => t.title).slice(0, 3).join(", "),
                    url: "/tasks",
                    tag: "overdue-tasks",
                  },
                );
              }
            }
          }

          // === Citas Médicas ===
          if (globalPrefs.medical_reminders_enabled) {
            const { data: appointments } = await supabase
              .from("medical_appointments")
              .select("id, title, date, time, reminder_enabled, reminder_days_before")
              .eq("user_id", cfg.user_id)
              .eq("reminder_enabled", true)
              .eq("status", "scheduled")
              .gte("date", now.ymd);

            for (const appt of appointments ?? []) {
              const apptDate = new Date(`${appt.date}T12:00:00Z`);
              const targetDate = new Date(apptDate);
              targetDate.setDate(apptDate.getDate() - (appt.reminder_days_before ?? 1));
              const targetYMD = targetDate.toISOString().split("T")[0];

              if (targetYMD === now.ymd) {
                const targetTime = parseHM(cfg.notify_time || "09:00");
                if (withinWindow(now, targetTime)) {
                  const key = `${now.ymd}|appt|${appt.id}`;
                  await fire(
                    key,
                    `🏥 *Recordatorio de Cita*\nTienes una cita: *${appt.title}*\n📅 Fecha: ${appt.date}\n🕒 Hora: ${appt.time ?? "Sin definir"}`,
                    { title: "🏥 Cita Médica", body: `Mañana: ${appt.title}`, url: "/health", tag: `appt-${appt.id}` },
                  );
                }
              }
            }
          }

          // === Hábitos Pendientes (19:00) ===
          if (globalPrefs.habit_reminders_enabled && cfg.notify_habits) {

            const habitTime = { hh: 19, mm: 0 };
            if (withinWindow(now, habitTime)) {
              const key = `${now.ymd}|habits-rem`;
              const { data: habits } = await supabase
                .from("habits")
                .select("id, name, history")
                .eq("user_id", cfg.user_id)
                .eq("active", true);
              
              const pending = (habits ?? []).filter(h => {
                const history = (h.history as string[]) ?? [];
                return !history.includes(now.ymd);
              });

              if (pending.length > 0) {
                const lines = pending.map(p => `• ${p.name}`).join("\n");
                await fire(
                  key,
                  `✨ *Hábitos pendientes*\nNo olvides completar tus hábitos de hoy:\n\n${lines}\n\nhttps://os.cmrs.mx/habits`,
                  { title: "✨ Hábitos", body: `Te quedan ${pending.length} hábitos hoy.`, url: "/habits", tag: "habits-rem" }
                );
              }
            }
          }

          if (fired.length > 0) {
            await supabase
              .from("telegram_config")
              .update({ last_reminder_keys: Array.from(dedupKeys) })
              .eq("user_id", cfg.user_id);
          }
        }

        return new Response(JSON.stringify({ ok: true, sent }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
