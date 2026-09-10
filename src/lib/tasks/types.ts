/** Tareas (Fase 9 · Operaciones). */

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export type TaskStatus = "pendiente" | "en_proceso" | "hecha" | "cancelada";

export const TASK_STATUSES: { value: TaskStatus; label: string; tone: Tone }[] = [
  { value: "pendiente", label: "Pendiente", tone: "ink" },
  { value: "en_proceso", label: "En proceso", tone: "blue" },
  { value: "hecha", label: "Hecha", tone: "green" },
  { value: "cancelada", label: "Cancelada", tone: "red" },
];

export function taskStatusInfo(status: string) {
  return TASK_STATUSES.find((s) => s.value === status) ?? TASK_STATUSES[0];
}

export type TaskPriority = "baja" | "media" | "alta";

export const TASK_PRIORITIES: { value: TaskPriority; label: string; tone: Tone }[] = [
  { value: "alta", label: "Alta", tone: "red" },
  { value: "media", label: "Media", tone: "amber" },
  { value: "baja", label: "Baja", tone: "ink" },
];

export function taskPriorityInfo(priority: string) {
  return TASK_PRIORITIES.find((p) => p.value === priority) ?? TASK_PRIORITIES[1];
}

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string | null;
  assignee_id: string | null;
  notes: string | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { id: string; name: string } | null;
  project?: { id: string; name: string | null; code: string | null } | null;
};

/** Una tarea está "abierta" si no está hecha ni cancelada. */
export function isOpen(status: string): boolean {
  return status !== "hecha" && status !== "cancelada";
}

/** Estado de la fecha límite de una tarea abierta. */
export type DueState = "vencida" | "hoy" | "proxima" | "sin_fecha" | "no_aplica";

export function dueState(task: { status: string; due_date: string | null }): DueState {
  if (!isOpen(task.status)) return "no_aplica";
  if (!task.due_date) return "sin_fecha";
  const today = new Date().toISOString().slice(0, 10);
  if (task.due_date < today) return "vencida";
  if (task.due_date === today) return "hoy";
  return "proxima";
}
