/**
 * **Mantenimiento del Hogar**: tareas preventivas y correctivas con estado
 * (pendiente, programada, completada).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Tipo de mantenimiento: preventivo o correctivo.
 */
export type MaintenanceType = "preventative" | "corrective";
/**
 * Estado del mantenimiento: pendiente, completado o programado.
 */
export type MaintenanceStatus = "pending" | "completed" | "scheduled";

/**
 * Registro de mantenimiento del hogar.
 */
export type HouseMaintenance = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: MaintenanceType;
  status: MaintenanceStatus;
  date: string;
  cost: number;
  created_at: string;
  updated_at: string;
};

/**
 * Devuelve la lista y mutaciones CRUD.
 */
export function useMaintenance() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const key = ["house_maintenance", userId] as const;

  const { data: maintenance = [], isLoading: loading, refetch } = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("house_maintenance")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HouseMaintenance[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["house_maintenance"] });

  const createMaintenance = async (item: Omit<HouseMaintenance, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("house_maintenance")
      .insert([{ ...item, user_id: userId }]);
    if (!error) invalidate();
    return error;
  };

  const updateMaintenance = async (id: string, patch: Partial<HouseMaintenance>) => {
    const { error } = await supabase
      .from("house_maintenance")
      .update(patch)
      .eq("id", id);
    if (!error) invalidate();
    return error;
  };

  const deleteMaintenance = async (id: string) => {
    const { error } = await supabase
      .from("house_maintenance")
      .delete()
      .eq("id", id);
    if (!error) invalidate();
    return error;
  };

  return {
    maintenance,
    loading,
    refresh: () => refetch(),
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
  };
}
