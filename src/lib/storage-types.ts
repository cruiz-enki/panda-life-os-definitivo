/**
 * **Tipos compartidos del estado de la app**: hábitos, tareas, notas,
 * aprendizajes, energía, recurrencias, etiquetas, etc.
 */
export type HabitFrequency = "daily" | "weekly" | "monthly";

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  points: number;
  streak: number;
  lastCompleted: string | null;
  history: string[];
  frequency: HabitFrequency;
  targetCount: number;
  category?: string;
};

export type LearningCategory = "tech" | "mindset" | "health" | "creative" | "business" | "other";

export type Learning = {
  id: string;
  title: string;
  notes: string;
  ai_summary?: string;
  category: LearningCategory;
  skillId?: string; // Relación con el Skill Tree
  date: string;
};

export type EnergyEntry = {
  date: string;
  physical: number;
  mental: number;
  emotional: number;
  sleep?: number;
  pain?: number;
  notes?: string;
};

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed";
/** Minutos antes del `due` para el recordatorio. Presets clásicos: 10/60/1440. */
export type ReminderOffset = number;

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurrenceMonthlyMode = "day-of-month" | "nth-weekday" | "last-weekday";
export type Recurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
  /** Solo `weekly`: días 0-6 (dom-sab). Si vacío usa el weekday del due. */
  byWeekday?: number[];
  /** Solo `monthly`. */
  monthlyMode?: RecurrenceMonthlyMode;
  /** Si true, la siguiente ocurrencia se calcula desde la fecha en que se
   *  completa la tarea, no desde el due original. */
  fromCompletion?: boolean;
};

export type Subtask = { id: string; title: string; done: boolean; children?: Subtask[] };

export type TaskAttachment = {
  id: string;
  /** `image` (jpg/png/webp), `pdf`, o `link` (URL genérica). */
  type: "image" | "pdf" | "link";
  url: string;
  name?: string;
  addedAt: string;
};

export type TaskComment = {
  id: string;
  body: string;
  checklist?: Subtask[];
  createdAt: string;
};

export type TaskTimeEntry = {
  id: string;
  startedAt: string;
  /** Si está `null` la sesión está corriendo. */
  endedAt: string | null;
};
export type ReminderChannel = "push" | "telegram" | "email" | "inapp";

export type TaskList = { id: string; name: string; emoji: string; color: string; parentId?: string | null; sortOrder?: number };
export type Tag = { id: string; name: string; color: string };

export type Task = {
  id: string;
  title: string;
  description?: string;
  /** Fecha/hora en que empieza el trabajo (opcional). */
  startDate?: string;
  /** Fecha/hora límite. */
  due?: string;
  /** Duración estimada en minutos. */
  durationMinutes?: number;
  priority: Priority;
  tags: string[];
  listId: string;
  status: TaskStatus;
  subtasks: Subtask[];
  /** Recordatorio único (legacy). */
  reminder?: ReminderOffset;
  /** Múltiples recordatorios en minutos antes del due. */
  reminders?: number[];
  /** Canales por los que llegan los recordatorios de esta tarea. */
  reminderChannels?: ReminderChannel[];
  recurrence?: Recurrence;
  /** Si tiene valor futuro, la tarea está pospuesta hasta esa fecha. */
  snoozedUntil?: string;
  /** Favorita: se muestra arriba de todas las vistas. */
  pinned?: boolean;
  /** Orden manual persistente dentro de la vista. Menor va primero. */
  sortOrder?: number;
  xpReward?: number;
  /** Adjuntos: fotos de recibos, PDFs, enlaces. */
  attachments?: TaskAttachment[];
  /** Comentarios/notas con checklist propio. */
  comments?: TaskComment[];
  /** Sesiones de trabajo (para time tracking). */
  timeEntries?: TaskTimeEntry[];
  /** Minutos reales acumulados (suma de timeEntries cerradas). */
  actualMinutes?: number;
  createdAt: string;
  completedAt?: string;
};

export type ProductivityStats = { streak: number; lastCompletedDate: string | null };

export type NoteType = "idea" | "learning" | "note" | "project";
export type NoteCategory = "negocio" | "marketing" | "personal" | "clientes" | "contenido" | "otro";
export type NoteImportance = "normal" | "important" | "high" | "money";
export type NoteChecklistItem = { id: string; text: string; done: boolean };

export type Note = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  category: NoteCategory;
  tags: string[];
  importance: NoteImportance;
  checklist: NoteChecklistItem[];
  linkedNoteIds: string[];
  createdAt: string;
  updatedAt: string;
};

// Snapshot ligero de finanzas para alimentar gamificación (no se persiste en localStorage de AppState)
export type FinanceSnapshot = {
  cardsCount: number;
  totalCreditLimit: number;
  totalBalance: number;
  expensesCount: number;
  budgetsCount: number;
  // gastos de la semana actual (lunes-domingo)
  expensesThisWeekCount: number;
  paymentsThisWeekCount: number;
  paymentsThisWeekAmount: number;
  // mes actual
  monthIncome: number;
  monthExpenses: number;
  // utilización máxima de crédito (0..1) entre tarjetas activas
  maxUtilization: number;
  // # de presupuestos del mes que están dentro del límite (no excedidos)
  budgetsOnTrack: number;
  budgetsTotal: number;
  // MSI activos
  activeMsiCount: number;
};

// Snapshot ligero de salud para gamificación
export type HealthSnapshot = {
  bodyEntriesCount: number;
  mealsCount: number;
  healthyMealsThisWeek: number;
  junkMealsThisWeek: number;
  activeMedsCount: number;
  medAdherenceWeekPct: number;
  medsTakenThisWeekCount: number;
  weightLatest: number | null;
  weightDelta30d: number | null;
  bodyFatLatest: number | null;
  muscleMassLatest: number | null;
};

// Snapshot ligero del módulo Hogar (no se persiste en localStorage)
export type HomeSnapshotForState = {
  totalTasks: number;
  activeTasks: number;
  totalCompletions: number;
  todayTotal: number;
  todayDone: number;
  dayComplete: boolean;
  mvdMet: boolean;
  weekCompletionsCount: number;
  weeklyTasksTotal: number;
  weeklyTasksDone: number;
  weekComplete: boolean;
};

export type AppState = {
  xp: number;
  pandaCoins: number;
  habits: Habit[];
  learnings: Learning[];
  energy: EnergyEntry[];
  tasks: Task[];
  taskLists: TaskList[];
  tags: Tag[];
  productivity: ProductivityStats;
  notes: Note[];
  finance?: FinanceSnapshot;
  health?: HealthSnapshot;
  home?: HomeSnapshotForState;
  importedTemplateIds?: string[];
  dailyWins?: DailyWin[];
  unlockedSkills?: string[];
  customSkillCategories?: Category[];
  enkiModeEnabled?: boolean;
};

export type Skill = {
  id: string;
  name: string;
};

export type SubCategory = {
  name: string;
  skills: Skill[];
};

export type Category = {
  id: string;
  name: string;
  icon: string; // Nombre del icono de lucide o emoji
  description: string;
  color: string;
  multiplier?: boolean;
  subCategories: SubCategory[];
};

export type DailyWin = {
  id: string;
  date: string;
  content: string;
  feeling?: string;
  xpRewarded: boolean;
};
