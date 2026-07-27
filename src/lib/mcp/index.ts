import { auth, defineMcp } from "@lovable.dev/mcp-js";

import addExpense from "./tools/add-expense";
import addIncome from "./tools/add-income";
import addNote from "./tools/add-note";
import listNotes from "./tools/list-notes";
import logMedication from "./tools/log-medication";
import listMedications from "./tools/list-medications";
import logMood from "./tools/log-mood";
import logSleep from "./tools/log-sleep";
import logWater from "./tools/log-water";
import checkinLocation from "./tools/checkin-location";
import addTask from "./tools/add-task";
import listTasks from "./tools/list-tasks";
import completeTask from "./tools/complete-task";
import dailySummary from "./tools/daily-summary";
import listRecentExpenses from "./tools/list-recent-expenses";
import listHabits from "./tools/list-habits";
import addHabit from "./tools/add-habit";
import completeHabit from "./tools/complete-habit";

// El issuer debe ser el host directo de Supabase, no el proxy .lovable.cloud.
// VITE_SUPABASE_PROJECT_ID se inlinea en build; fallback para el extract manifest.
const projectRef =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_PROJECT_ID ??
  "project-ref-unset";

export default defineMcp({
  name: "pandus-maximus-mcp",
  title: "Pandus Maximus",
  version: "0.1.0",
  instructions:
    "Herramientas de Pandus Maximus (life OS de Carlos): registra gastos, ingresos, notas, medicamentos, mood, sueño, agua, ubicaciones y tareas; consulta resúmenes diarios y listas recientes. Los cambios impactan la base de datos personal del usuario autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    addExpense,
    addIncome,
    listRecentExpenses,
    addNote,
    listNotes,
    logMedication,
    listMedications,
    logMood,
    logSleep,
    logWater,
    checkinLocation,
    addTask,
    listTasks,
    completeTask,
    dailySummary,
    listHabits,
    addHabit,
    completeHabit,
  ],
});
