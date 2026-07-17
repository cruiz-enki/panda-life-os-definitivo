/**
 * Hook para el dashboard interno de un proyecto: tareas, hitos y recursos.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ResourceKind = "link" | "doc" | "repo" | "design" | "video" | "other";

export interface ProjectTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectResource {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  url: string | null;
  kind: ResourceKind;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectDetails(projectId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const enabled = !!user && !!projectId;

  const { data, isLoading } = useQuery({
    queryKey: ["project-details", projectId],
    enabled,
    queryFn: async () => {
      const [t, m, r] = await Promise.all([
        (supabase as any).from("project_tasks").select("*").eq("project_id", projectId!).order("position").order("created_at"),
        (supabase as any).from("project_milestones").select("*").eq("project_id", projectId!).order("position").order("created_at"),
        (supabase as any).from("project_resources").select("*").eq("project_id", projectId!).order("created_at", { ascending: false }),
      ]);
      return {
        tasks: (t.data || []) as ProjectTask[],
        milestones: (m.data || []) as ProjectMilestone[],
        resources: (r.data || []) as ProjectResource[],
      };
    },
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["project-details", projectId] });
  }, [qc, projectId]);

  // TASKS
  const addTask = async (input: Partial<ProjectTask> & { title: string }) => {
    if (!user || !projectId) return;
    const { error } = await (supabase as any).from("project_tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      due_date: input.due_date ?? null,
    });
    if (!error) refresh();
    return error;
  };
  const updateTask = async (id: string, patch: Partial<ProjectTask>) => {
    const p: any = { ...patch };
    if (patch.status === "done" && !patch.completed_at) p.completed_at = new Date().toISOString();
    if (patch.status && patch.status !== "done") p.completed_at = null;
    const { error } = await (supabase as any).from("project_tasks").update(p).eq("id", id);
    if (!error) refresh();
    return error;
  };
  const deleteTask = async (id: string) => {
    const { error } = await (supabase as any).from("project_tasks").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  // MILESTONES
  const addMilestone = async (input: Partial<ProjectMilestone> & { title: string }) => {
    if (!user || !projectId) return;
    const { error } = await (supabase as any).from("project_milestones").insert({
      project_id: projectId,
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      target_date: input.target_date ?? null,
    });
    if (!error) refresh();
    return error;
  };
  const updateMilestone = async (id: string, patch: Partial<ProjectMilestone>) => {
    const { error } = await (supabase as any).from("project_milestones").update(patch).eq("id", id);
    if (!error) refresh();
    return error;
  };
  const toggleMilestone = async (m: ProjectMilestone) => {
    return updateMilestone(m.id, { completed_at: m.completed_at ? null : new Date().toISOString() });
  };
  const deleteMilestone = async (id: string) => {
    const { error } = await (supabase as any).from("project_milestones").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  // RESOURCES
  const addResource = async (input: Partial<ProjectResource> & { title: string }) => {
    if (!user || !projectId) return;
    const { error } = await (supabase as any).from("project_resources").insert({
      project_id: projectId,
      user_id: user.id,
      title: input.title,
      url: input.url ?? null,
      kind: input.kind ?? "link",
      notes: input.notes ?? null,
    });
    if (!error) refresh();
    return error;
  };
  const deleteResource = async (id: string) => {
    const { error } = await (supabase as any).from("project_resources").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  return {
    tasks: data?.tasks ?? [],
    milestones: data?.milestones ?? [],
    resources: data?.resources ?? [],
    loading: isLoading,
    addTask, updateTask, deleteTask,
    addMilestone, updateMilestone, toggleMilestone, deleteMilestone,
    addResource, deleteResource,
    refresh,
  };
}
