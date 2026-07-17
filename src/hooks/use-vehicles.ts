/**
 * Hook del módulo **Vehículos**: registro, eventos (servicio, verificación,
 * tenencia, seguro, gasolina) y próximos vencimientos.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Vehicle = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  color: string | null;
  vin: string | null;
  current_km: number;
  fuel_type: string | null;
  emoji: string;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type VehicleEventKind =
  | "service"
  | "verification"
  | "tenencia"
  | "insurance"
  | "fuel"
  | "incident"
  | "other";

export type VehicleEvent = {
  id: string;
  user_id: string;
  vehicle_id: string;
  kind: VehicleEventKind;
  title: string;
  date: string;
  km: number | null;
  cost: number | null;
  provider: string | null;
  note: string | null;
  next_due_date: string | null;
  next_due_km: number | null;
  created_at: string;
  updated_at: string;
};

export function useVehicles() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [v, e] = await Promise.all([
        supabase.from("vehicles" as any).select("*").order("created_at"),
        supabase.from("vehicle_events" as any).select("*").order("date", { ascending: false }),
      ]);
      return {
        vehicles: (v.data ?? []) as unknown as Vehicle[],
        events: (e.data ?? []) as unknown as VehicleEvent[],
      };
    },
  });

  const vehicles = data?.vehicles ?? [];
  const events = data?.events ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["vehicles"] });

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => e.next_due_date)
      .map((e) => {
        const due = new Date(e.next_due_date + "T00:00:00");
        const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...e, daysUntil: days };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events]);

  const createVehicle = async (input: Omit<Vehicle, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase.from("vehicles" as any).insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateVehicle = async (id: string, patch: Partial<Vehicle>) => {
    const { error } = await supabase.from("vehicles" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from("vehicles" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const createEvent = async (input: Omit<VehicleEvent, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase.from("vehicle_events" as any).insert([{ ...input, user_id: userId } as any]);
    if (!error) {
      // Actualiza km actual si aplica
      if (input.km) {
        const v = vehicles.find((x) => x.id === input.vehicle_id);
        if (v && input.km > v.current_km) {
          await supabase.from("vehicles" as any).update({ current_km: input.km } as any).eq("id", v.id);
        }
      }
      invalidate();
    }
    return error;
  };
  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("vehicle_events" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  return {
    vehicles,
    events,
    upcoming,
    loading: isLoading,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    createEvent,
    deleteEvent,
  };
}
