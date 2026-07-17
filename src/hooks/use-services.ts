/**
 * **Servicios del Hogar**: suscripciones y servicios recurrentes (luz,
 * gas, internet, streaming…) con su periodicidad y coste.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Servicio recurrente del hogar.
 */
export type HomeService = {
  id: string;
  user_id: string;
  name: string;
  provider: string | null;
  monthly_cost: number;
  due_day: number | null;
  status: "active" | "inactive";
  category: string | null;
  emoji: string;
  created_at: string;
  updated_at: string;
};

/**
 * Devuelve los servicios y mutaciones CRUD.
 */
export function useServices() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const key = ["home_services", userId] as const;

  const { data: services = [], isLoading: loading, refetch } = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_services")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as HomeService[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["home_services"] });

  const createService = async (service: Omit<HomeService, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("home_services")
      .insert([{ ...service, user_id: userId }]);
    if (!error) invalidate();
    return error;
  };

  const updateService = async (id: string, patch: Partial<HomeService>) => {
    const { error } = await supabase
      .from("home_services")
      .update(patch)
      .eq("id", id);
    if (!error) invalidate();
    return error;
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from("home_services")
      .delete()
      .eq("id", id);
    if (!error) invalidate();
    return error;
  };

  return {
    services,
    loading,
    refresh: () => refetch(),
    createService,
    updateService,
    deleteService,
  };
}
