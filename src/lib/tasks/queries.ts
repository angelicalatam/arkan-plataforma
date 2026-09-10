import { createClient } from "@/lib/supabase/server";
import type { Task } from "./types";

const SELECT =
  "*, assignee:employees(id, name), project:projects(id, name, code)";

/** Todas las tareas (abiertas primero, luego por fecha límite). */
export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .order("created_at", { ascending: false });
  return (data as Task[]) ?? [];
}

/** Una tarea por id. */
export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select(SELECT).eq("id", id).maybeSingle();
  return (data as Task) ?? null;
}

/** Tareas de una obra. */
export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as Task[]) ?? [];
}

/** Tareas abiertas con fecha límite vencida o para hoy (para las alertas). */
export async function getDueTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .in("status", ["pendiente", "en_proceso"])
    .not("due_date", "is", null)
    .lte("due_date", today)
    .order("due_date", { ascending: true });
  return (data as Task[]) ?? [];
}

/** Contadores para el panel principal. */
export async function getTaskCounts(): Promise<{ open: number; overdue: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [openRes, overdueRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["pendiente", "en_proceso"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["pendiente", "en_proceso"])
      .not("due_date", "is", null)
      .lt("due_date", today),
  ]);
  return { open: openRes.count ?? 0, overdue: overdueRes.count ?? 0 };
}
