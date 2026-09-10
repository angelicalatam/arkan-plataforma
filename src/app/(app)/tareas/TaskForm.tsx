"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createTask, updateTask, type TaskInput } from "@/lib/tasks/actions";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

type Option = { id: string; name: string | null; code?: string | null };

export function TaskForm({
  employees,
  projects,
  task,
}: {
  employees: { id: string; name: string }[];
  projects: Option[];
  task?: Task;
}) {
  const router = useRouter();
  const editing = Boolean(task);

  const [form, setForm] = useState<TaskInput>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: (task?.status as TaskStatus) ?? "pendiente",
    priority: (task?.priority as TaskPriority) ?? "media",
    due_date: task?.due_date ?? "",
    project_id: task?.project_id ?? "",
    assignee_id: task?.assignee_id ?? "",
    notes: task?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) {
      setError("La tarea necesita un título.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = editing ? await updateTask(task!.id, form) : await createTask(form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/tareas");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <FormSection title="Datos de la tarea">
        <Field label="Título" required full>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ej. Llamar al proveedor de pladur"
          />
        </Field>
        <Field label="Prioridad">
          <select className={inputClass} value={form.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha límite">
          <input type="date" className={inputClass} value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} />
        </Field>
        <Field label="Asignada a">
          <select className={inputClass} value={form.assignee_id ?? ""} onChange={(e) => set("assignee_id", e.target.value)}>
            <option value="">— Sin asignar —</option>
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {em.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Obra (opcional)">
          <select className={inputClass} value={form.project_id ?? ""} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">— Sin obra —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción" full>
          <textarea rows={3} className={inputClass} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Notas internas" full>
          <textarea
            rows={3}
            className={inputClass}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Notas privadas, seguimiento, recordatorios…"
          />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear tarea"}
        </button>
      </div>
    </form>
  );
}
