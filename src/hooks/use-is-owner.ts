/**
 * Hook que comprueba si el usuario autenticado tiene rol `owner`.
 * Usa la función SECURITY DEFINER `has_role` para evitar recursión RLS.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Devuelve `{ isOwner, isLoading }`. Cachea 5 minutos.
 */
export function useIsOwner() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const { data: isOwner = false, isLoading } = useQuery({
    queryKey: ["is-owner", userId],
    enabled: !authLoading && !!userId,
    // El rol cambia muy raramente; cachear durante toda la sesión y evitar refetches en navegación.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "owner")
        .maybeSingle();
      return !!data;
    },
  });

  return { isOwner, loading: authLoading || (!!userId && isLoading) };
}
