/**
 * Tipos del módulo **Crecimiento Personal**: sueños, horizontes, objetivos,
 * proyectos, acciones, cartas al futuro y métricas de vida.
 */

export type DreamStatus = 'active' | 'achieved' | 'paused';

export interface Dream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  motivation: string | null;
  category: string | null;
  timeframe: string | null;
  deadline: string | null;
  image_url: string | null;
  status: DreamStatus | null;
  created_at: string;
  updated_at: string;
}

export type HorizonType = '90_days' | '1_year' | '3_years' | '5_years' | '10_years';

export interface Horizon {
  id: string;
  user_id: string;
  horizon_type: string;
  content: string | null;
  status: 'pending' | 'completed' | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  dream_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | null;
  created_at: string;
  updated_at: string;
}

export interface GoalProject {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | null;
  created_at: string;
  updated_at: string;
}

export interface GoalAction {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FutureLetter {
  id: string;
  user_id: string;
  title: string;
  content: string;
  unlock_date: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifeMetric {
  id: string;
  user_id: string;
  health: number;
  finances: number;
  relationships: number;
  business: number;
  stress: number;
  created_at: string;
}

export interface FutureSimulation {
  id: string;
  user_id: string;
  type: 'current_trend' | 'habit_maintenance';
  timeframe: string;
  simulation_data: {
    scenarios: Array<{
      title: string;
      timeframe: string;
      projections: Array<{
        category: string;
        impact: string;
        description: string;
      }>;
      summary: string;
    }>;
    ai_insight: string;
  };
  ai_insight: string | null;
  created_at: string;
}
