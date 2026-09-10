"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Pencil, Search, CalendarClock, User, HardHat } from "lucide-react";
import { createTask, setTaskStatus, deleteTask } from "@/lib/tasks/actions";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  taskPriorityInfo,
  dueState,
  isOpen,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/tasks/types";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";
import { formatDate } from "@/lib/format";

type Option = { id: string; name: string | null; code?: string | null };
type Filter = "todas" | "pendientes" | "hoy" | "vencidas" | "hechas";

export function TasksClient({
  tasks,
  employees,
  projects,
}: {
  tasks: Task[];
  employees: { id: string; name: string }[];
  projects: Option[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [term, setTerm] = useState("");

  // Alta rápida.
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");
  const [project, setProject] = useState("");
  const [adding, setAdding] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const counts = useMemo(() => {
    let pendientes = 0, hoy = 0, vencidas = 0, hechas = 0;
    for (const t of tasks) {
      if (t.status === "hecha") hechas++;
      if (isOpen(t.status)) {
        pendientes++;
        if (t.due_date && t.due_date === today) hoy++;
        if (t.due_date && t.due_date < today) vencidas++;
      }
    }
    return { todas: tasks.length, pendientes, hoy, vencidas, hechas };
  }, [tasks, today]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "pendientes":
          return isOpen(t.status);
        case "hoy":
          return isOpen(t.status) && t.due_date === today;
        case "vencidas":
          return isOpen(t.status) && !!t.due_date && t.due_date < today;
        case "hechas":
          return t.status === "hecha";
        default:
          return true;
      }
    });
  }, [tasks, filter, term, today]);

  async function onQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    await createTask({
      title,
      priority,
      due_date: due || null,
      assignee_id: assignee || null,
      project_id: project || null,
    });
    setAdding(false);
    setTitle("");
    setDue("");
    setAssignee("");
    setProject("");
    setPriority("media");
    router.refresh();
  }

  async function onToggle(t: Task) {
    await setTaskStatus(t.id, t.status === "hecha" ? "pendiente" : "hecha");
    router.refresh();
  }

  async function onStatus(t: Task, status: TaskStatus) {
    await setTaskStatus(t.id, status);
    router.refresh();
  }

  async function onDelete(t: Task) {
    if (!window.confirm(`¿Eliminar la tarea "${t.title}"?`)) return;
    await deleteTask(t.id);
    router.refresh();
  }

  const tabs: { key: Filter; label: string; n: number }[] = [
    { key: "pendientes", label: "Pendientes", n: counts.pendientes },
    { key: "hoy", label: "Hoy", n: counts.hoy },
    { key: "vencidas", label: "Vencidas", n: counts.vencidas },
    { key: "hechas", label: "Hechas", n: counts.hechas },
    { key: "todas", label: "Todas", n: counts.todas },
  ];

  return (
    <div>
      {/* Alta rápida */}
      <form onSubmit={onQuickAdd} className="mb-4 rounded-xl border border-ink-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className={`${inputClass} flex-1`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Escribe una tarea y pulsa Añadir…"
          />
          <button
            type="submit"
            disabled={adding || !title.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                Prioridad: {p.label}
              </option>
            ))}
          </select>
          <input type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} title="Fecha límite" />
          <select className={inputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Sin asignar</option>
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {em.name}
              </option>
            ))}
          </select>
          <select className={inputClass} value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">Sin obra</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra"}
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Filtros + búsqueda */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === t.key ? "bg-brand-600 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${filter === t.key ? "text-white/80" : "text-ink-400"}`}>{t.n}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className={`${inputClass} pl-8`}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar tarea…"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-400">No hay tareas en esta vista.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {filtered.map((t) => {
              const pi = taskPriorityInfo(t.priority);
              const ds = dueState(t);
              const done = t.status === "hecha";
              return (
                <li key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50/60">
                  <button
                    onClick={() => onToggle(t)}
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      done ? "border-green-500 bg-green-500 text-white" : "border-ink-300 text-transparent hover:border-brand-400"
                    }`}
                    title={done ? "Marcar pendiente" : "Marcar hecha"}
                  >
                    ✓
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium ${done ? "text-ink-400 line-through" : "text-ink-900"}`}>{t.title}</span>
                      <Badge tone={pi.tone}>{pi.label}</Badge>
                      {ds === "vencida" && <Badge tone="red">Vencida</Badge>}
                      {ds === "hoy" && <Badge tone="amber">Hoy</Badge>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-400">
                      {t.due_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatDate(t.due_date)}
                        </span>
                      )}
                      {t.assignee && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {t.assignee.name}
                        </span>
                      )}
                      {t.project && (
                        <span className="inline-flex items-center gap-1">
                          <HardHat className="h-3 w-3" />
                          {t.project.code || t.project.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <select
                      value={t.status}
                      onChange={(e) => onStatus(t, e.target.value as TaskStatus)}
                      className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700"
                      title="Estado"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <Link
                      href={`/tareas/${t.id}/editar` as Route}
                      className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => onDelete(t)}
                      className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
