/**
 * Hook de la **Bitácora Médica**: doctores, diagnósticos, recetas y citas.
 * Carga paralela con TanStack Query.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { todayCDMX } from "@/lib/date-utils";
import type {
  Doctor,
  Diagnosis,
  Consultation,
  Treatment,
  Study,
  Appointment,
} from "../lib/medical-types";

/**
 * Devuelve datos médicos del usuario + mutaciones CRUD.
 */
export function useMedical() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["medical", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [d, dx, c, t, s, a] = await Promise.all([
        supabase.from("medical_doctors").select("*").eq("user_id", userId!).order("name"),
        supabase.from("medical_diagnoses").select("*").eq("user_id", userId!).order("date", { ascending: false }),
        supabase.from("medical_consultations").select("*").eq("user_id", userId!).order("date", { ascending: false }),
        supabase.from("medical_treatments").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("medical_studies").select("*").eq("user_id", userId!).order("date", { ascending: false }),
        supabase.from("medical_appointments").select("*").eq("user_id", userId!).order("date"),
      ]);
      return {
        doctors: (d.data ?? []) as unknown as Doctor[],
        diagnoses: (dx.data ?? []) as unknown as Diagnosis[],
        consultations: (c.data ?? []) as unknown as Consultation[],
        treatments: (t.data ?? []) as unknown as Treatment[],
        studies: (s.data ?? []) as unknown as Study[],
        appointments: (a.data ?? []) as unknown as Appointment[],
      };
    },
  });

  const doctors = data?.doctors ?? [];
  const diagnoses = data?.diagnoses ?? [];
  const consultations = data?.consultations ?? [];
  const treatments = data?.treatments ?? [];
  const studies = data?.studies ?? [];
  const appointments = data?.appointments ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["medical"] });
  }, [qc]);

  // ===== Generic CRUD helpers =====
  const make = <T extends { id: string }>(table: string) => ({
    create: async (input: Omit<T, "id">) => {
      if (!user) return;
      const { error } = await supabase.from(table as any).insert({ ...input, user_id: user.id } as any);
      if (!error) await refresh();
      return error;
    },
    update: async (id: string, patch: Partial<T>) => {
      const { error } = await supabase.from(table as any).update(patch as any).eq("id", id);
      if (!error) await refresh();
      return error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (!error) await refresh();
      return error;
    },
  });

  const doctorOps = useMemo(() => make<Doctor>("medical_doctors"), [user, refresh]);
  const dxOps = useMemo(() => make<Diagnosis>("medical_diagnoses"), [user, refresh]);
  const consultOps = useMemo(() => make<Consultation>("medical_consultations"), [user, refresh]);
  const treatOps = useMemo(() => make<Treatment>("medical_treatments"), [user, refresh]);
  const studyOps = useMemo(() => make<Study>("medical_studies"), [user, refresh]);
  const apptOps = useMemo(() => make<Appointment>("medical_appointments"), [user, refresh]);

  // Snapshot médico
  const today = todayCDMX();
  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.date >= today && a.status === "scheduled").slice(0, 10),
    [appointments, today],
  );
  const activeDiagnoses = useMemo(
    () => diagnoses.filter((d) => d.status !== "resolved"),
    [diagnoses],
  );
  const pendingStudies = useMemo(
    () => studies.filter((s) => s.status === "pending"),
    [studies],
  );

  return {
    doctors,
    diagnoses,
    consultations,
    treatments,
    studies,
    appointments,
    upcomingAppointments,
    activeDiagnoses,
    pendingStudies,
    loading,
    refresh,
    doctorOps,
    dxOps,
    consultOps,
    treatOps,
    studyOps,
    apptOps,
  };
}
