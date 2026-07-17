/**
 * Tipos y metadatos del módulo **Bitácora Médica**: doctores, diagnósticos,
 * consultas, tratamientos, estudios y citas.
 */
export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  email: string;
  notes: string;
  emoji: string;
};

export type DiagnosisStatus = "active" | "in_treatment" | "resolved";

export type Diagnosis = {
  id: string;
  name: string;
  doctor_id: string | null;
  date: string;
  status: DiagnosisStatus;
  notes: string;
};

export type Consultation = {
  id: string;
  date: string;
  doctor_id: string | null;
  reason: string;
  symptoms: string;
  diagnosis: string;
  indications: string;
  prescribed_meds: string;
  requested_studies: string;
  next_appointment: string | null;
  notes: string;
};

export type TreatmentStatus = "active" | "paused" | "completed";

export type Treatment = {
  id: string;
  name: string;
  type: string;
  doctor_id: string | null;
  diagnosis_id: string | null;
  frequency: string;
  duration: string;
  start_date: string | null;
  end_date: string | null;
  indications: string;
  result: string;
  status: TreatmentStatus;
  notes: string;
};

export type StudyStatus = "pending" | "done";

export type Study = {
  id: string;
  name: string;
  type: string;
  date: string;
  doctor_id: string | null;
  result: string;
  file_url: string;
  status: StudyStatus;
  notes: string;
};

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  title: string;
  doctor_id: string | null;
  date: string;
  time: string;
  location: string;
  reason: string;
  notes: string;
  reminder_enabled: boolean;
  reminder_days_before: number;
  status: AppointmentStatus;
};

export const DIAGNOSIS_STATUS_LABEL: Record<DiagnosisStatus, string> = {
  active: "Activo",
  in_treatment: "En tratamiento",
  resolved: "Resuelto",
};

export const DIAGNOSIS_STATUS_COLOR: Record<DiagnosisStatus, string> = {
  active: "oklch(0.7 0.2 25)",
  in_treatment: "oklch(0.78 0.15 70)",
  resolved: "oklch(0.78 0.18 150)",
};

export const TREATMENT_STATUS_LABEL: Record<TreatmentStatus, string> = {
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
};

export const STUDY_STATUS_LABEL: Record<StudyStatus, string> = {
  pending: "Pendiente",
  done: "Realizado",
};
