/**
 * Hook del módulo **Mascotas**: mascotas familiares y registros (vacunas,
 * baños, comida, vet, peso, etc.).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Tipo de mascota.
 */
export type PetType = "dog" | "cat" | "other";
/**
 * Categoría del registro (vacuna, baño, comida, vet, peso…).
 */
export type PetLogType = "vaccine" | "bath" | "food_buy" | "vet" | "weight" | "grooming" | "other";

/**
 * Mascota registrada.
 */
export type Pet = {
  id: string;
  user_id: string;
  name: string;
  type: PetType;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  emoji: string;
  created_at: string;
  updated_at: string;
};

/**
 * Mascota registrada.
 */
export type PetLog = {
  id: string;
  user_id: string;
  pet_id: string;
  type: PetLogType;
  note: string | null;
  cost: number;
  date: string;
  created_at: string;
  updated_at: string;
};

/**
 * Devuelve mascotas + logs y mutaciones CRUD para ambos.
 */
export function usePets() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const petsQuery = useQuery({
    queryKey: ["pets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_pets")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Pet[];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["pet_logs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_logs")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PetLog[];
    },
  });

  const invalidatePets = () => qc.invalidateQueries({ queryKey: ["pets"] });
  const invalidateLogs = () => qc.invalidateQueries({ queryKey: ["pet_logs"] });

  const createPet = async (pet: Omit<Pet, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("family_pets")
      .insert([{ ...pet, user_id: userId }]);
    if (!error) invalidatePets();
    return error;
  };

  const updatePet = async (id: string, patch: Partial<Pet>) => {
    const { error } = await supabase
      .from("family_pets")
      .update(patch)
      .eq("id", id);
    if (!error) invalidatePets();
    return error;
  };

  const deletePet = async (id: string) => {
    const { error } = await supabase
      .from("family_pets")
      .delete()
      .eq("id", id);
    if (!error) invalidatePets();
    return error;
  };

  const createLog = async (log: Omit<PetLog, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("pet_logs")
      .insert([{ ...log, user_id: userId }]);
    if (!error) invalidateLogs();
    return error;
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase
      .from("pet_logs")
      .delete()
      .eq("id", id);
    if (!error) invalidateLogs();
    return error;
  };

  return {
    pets: petsQuery.data ?? [],
    logs: logsQuery.data ?? [],
    loading: petsQuery.isLoading || logsQuery.isLoading,
    refreshAll: () => {
      invalidatePets();
      invalidateLogs();
    },
    createPet,
    updatePet,
    deletePet,
    createLog,
    deleteLog,
  };
}
