/**
 * Contexto de **autenticación** basado en Supabase Auth. Provee el usuario
 * actual, sesión, helpers de signIn/signUp/signOut y un listener que se
 * actualiza al cambiar la sesión.
 *
 * Regla crítica: la suscripción a `onAuthStateChange` debe declararse antes
 * de llamar a `getSession()` para evitar deadlocks.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener PRIMERO
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    // Luego carga sesión actual
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("pandas-life-os-v1");
      window.location.href = "/auth";
    }
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
