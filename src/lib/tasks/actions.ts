"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

export type TaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  project_id?: string | null;
  assignee_id?: string | null;
  notes?: string | null;
};

function revalidate(projectId?: string | null) {
  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  if (projectId) revalidatePath(`/obras/${projectId}`);
}

export async function createTask(input: TaskInput): Promise<Result> {
  if (!input.title?.trim()) return { ok: false, error: "La tarea necesita un título." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(clean({ ...input, title: input.title.trim() }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidate(input.project_id);
  return { ok: true, id: data.id };
}

export async function updateTask(id: string, input: TaskInput): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = clean({ ...input });
  // Registrar/limpiar la fecha de finalización según el estado.
  if (input.status === "hecha") patch.done_at = new Date().toISOString();
  else if (input.status) patch.done_at = null;
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(input.project_id);
  return { ok: true, id };
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status, done_at: status === "hecha" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
