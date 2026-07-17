/**
 * Hook del módulo **Proyectos**: CRUD de proyectos y su bitácora de notas.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type ProjectCategory = "personal" | "aprendiendum" | "enki" | "otro";
export type ProjectStatus = "idea" | "activo" | "pausado" | "completado" | "archivado";
export type ProjectPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  color: string | null;
  url: string | null;
  tags: string[];
  deadline: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["projects", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [p, n] = await Promise.all([
        (supabase as any).from("projects").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        (supabase as any).from("project_notes").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
      ]);
      return {
        projects: (p.data || []) as Project[],
        notes: (n.data || []) as ProjectNote[],
      };
    },
  });

  const projects = data?.projects ?? [];
  const notes = data?.notes ?? [];

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["projects", userId] });
  }, [qc, userId]);

  const addProject = async (input: Partial<Project> & { title: string }) => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? "personal",
      status: input.status ?? "idea",
      priority: input.priority ?? "medium",
      progress: input.progress ?? 0,
      color: input.color ?? null,
      url: input.url ?? null,
      tags: input.tags ?? [],
      deadline: input.deadline ?? null,
    };
    const { error } = await (supabase as any).from("projects").insert(payload);
    if (!error) refresh();
    return error;
  };

  const updateProject = async (id: string, patch: Partial<Project>) => {
    const p: any = { ...patch };
    if (patch.status === "completado" && !patch.completed_at) p.completed_at = new Date().toISOString();
    if (patch.status === "activo" && !patch.started_at) p.started_at = new Date().toISOString();
    const { error } = await (supabase as any).from("projects").update(p).eq("id", id);
    if (!error) refresh();
    return error;
  };

  const deleteProject = async (id: string) => {
    const { error } = await (supabase as any).from("projects").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  const addNote = async (projectId: string, content: string) => {
    if (!user || !content.trim()) return;
    const { error } = await (supabase as any).from("project_notes").insert({
      project_id: projectId,
      user_id: user.id,
      content: content.trim(),
    });
    if (!error) refresh();
    return error;
  };

  const deleteNote = async (id: string) => {
    const { error } = await (supabase as any).from("project_notes").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  return {
    projects,
    notes,
    loading: isLoading,
    addProject,
    updateProject,
    deleteProject,
    addNote,
    deleteNote,
    refresh,
  };
}
