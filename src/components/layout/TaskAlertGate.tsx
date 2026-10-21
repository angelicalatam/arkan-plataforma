"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, User, HardHat, Check, Loader2 } from "lucide-react";
import { setTaskStatus } from "@/lib/tasks/actions";
import { taskPriorityInfo, dueState, type Task } from "@/lib/tasks/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

/**
 * Ventana de alerta a pantalla completa que bloquea la app cuando hay
 * tareas para hoy o vencidas. Se cierra con "Entendido, ya las vi" SOLO
 * durante esta visita: al volver a entrar (recargar / nuevo día) vuelve a
 * salir mientras la tarea siga sin marcarse como hecha.
 */
export function TaskAlertGate({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => tasks.filter((t) => !resolved.has(t.id)), [tasks, resolved]);
  const vencidas = visible.filter((t) => dueState(t) === "vencida");
  const hoy = visible.filter((t) => dueState(t) === "hoy");

  if (dismissed || visible.length === 0) return null;

  async function onDone(t: Task) {
    setBusyId(t.id);
    await setTaskStatus(t.id, "hecha");
    setResolved((s) => new Set(s).add(t.id));
    setBusyId(null);
    router.refresh();
  }

  function Row({ t }: { t: Task }) {
    const pi = taskPriorityInfo(t.priority);
    const busy = busyId === t.id;
    return (
      <li className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-900">{t.title}</span>
            <Badge tone={pi.tone}>{pi.label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
            {t.due_date && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDate(t.due_date)}
              </span>
            )}
            {t.assignee && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {t.assignee.name}
              </span>
            )}
            {t.project && (
              <span className="inline-flex items-center gap-1">
                <HardHat className="h-3.5 w-3.5" />
                {t.project.code || t.project.name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDone(t)}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          title="Marcar como hecha"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Hecha
        </button>
      </li>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Cabecera */}
        <div className="flex items-center gap-3 border-b border-ink-100 bg-amber-50 px-6 py-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Tienes tareas que requieren tu atención</h2>
            <p className="text-sm text-ink-500">
              {vencidas.length > 0 && `${vencidas.length} vencida${vencidas.length === 1 ? "" : "s"}`}
              {vencidas.length > 0 && hoy.length > 0 && " · "}
              {hoy.length > 0 && `${hoy.length} para hoy`}
            </p>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {vencidas.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600">⚠️ Vencidas</h3>
              <ul className="space-y-2">
                {vencidas.map((t) => (
                  <Row key={t.id} t={t} />
                ))}
              </ul>
            </section>
          )}
          {hoy.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">Para hoy</h3>
              <ul className="space-y-2">
                {hoy.map((t) => (
                  <Row key={t.id} t={t} />
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Pie */}
        <div className="border-t border-ink-100 bg-ink-50/60 px-6 py-4">
          <p className="mb-3 text-center text-xs text-ink-500">
            Si cierras sin resolverlas, esta alerta volverá a aparecer cada vez que entres hasta que las marques como
            hechas.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={"/tareas" as Route}
              onClick={() => setDismissed(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Ir a Tareas
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Entendido, ya las vi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
