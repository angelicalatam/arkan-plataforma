"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, CalendarRange } from "lucide-react";
import { itemTotals } from "@/lib/quotes/types";
import { projectProgress, type ProjectChapter } from "@/lib/projects/types";
import {
  computeSchedule,
  barPosition,
  expectedProgress,
  daysBetween,
  toMs,
  type ScheduleItemInput,
} from "@/lib/projects/schedule";
import { updateItemSchedule, resetProjectSchedule } from "@/lib/projects/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

const dateInput =
  "rounded border border-ink-200 bg-white px-1 py-0.5 text-[10px] text-ink-600 focus:border-brand-400 focus:outline-none";

export function ProjectSchedule({
  projectId,
  startPlanned,
  endPlanned,
  chapters,
}: {
  projectId: string;
  startPlanned: string | null;
  endPlanned: string | null;
  chapters: ProjectChapter[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const allItems = useMemo(() => chapters.flatMap((c) => c.items ?? []), [chapters]);

  const slots = useMemo(() => {
    if (!startPlanned || !endPlanned) return null;
    const inputs: ScheduleItemInput[] = allItems.map((it) => ({
      id: it.id,
      weight: itemTotals(it).lineSale,
      planned_start: it.planned_start,
      planned_end: it.planned_end,
    }));
    return computeSchedule(inputs, startPlanned, endPlanned);
  }, [allItems, startPlanned, endPlanned]);

  if (!startPlanned || !endPlanned) {
    return (
      <Card>
        <CardHeader title="Cronograma" />
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
          <CalendarRange className="h-8 w-8 text-ink-300" />
          <p className="text-sm text-ink-500">
            Para ver el cronograma, primero indica la <strong>fecha de inicio</strong> y la{" "}
            <strong>fecha de fin previstas</strong> de la obra.
          </p>
          <Link
            href={`/obras/${projectId}/editar` as Route}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Editar datos de la obra
          </Link>
        </div>
      </Card>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const withinWindow = toMs(today) >= toMs(startPlanned) && toMs(today) <= toMs(endPlanned);
  const todayPct = withinWindow
    ? ((toMs(today) - toMs(startPlanned)) / (toMs(endPlanned) - toMs(startPlanned) || 1)) * 100
    : null;

  const realProgress = projectProgress(allItems);
  const expected = slots
    ? expectedProgress(
        allItems.map((it) => ({ weight: itemTotals(it).lineSale, slot: slots.get(it.id)! })),
        today,
      )
    : 0;
  const onSchedule = realProgress + 0.5 >= expected;
  const totalDays = daysBetween(startPlanned, endPlanned);

  async function onDate(
    itemId: string,
    which: "start" | "end",
    value: string,
    curStart: string,
    curEnd: string,
  ) {
    const planned_start = which === "start" ? value : curStart;
    const planned_end = which === "end" ? value : curEnd;
    setSavingId(itemId);
    await updateItemSchedule(itemId, projectId, { planned_start, planned_end });
    setSavingId(null);
    router.refresh();
  }

  async function onReset() {
    if (!window.confirm("¿Recalcular todas las fechas automáticamente? Se perderán los ajustes manuales.")) return;
    setResetting(true);
    await resetProjectSchedule(projectId);
    setResetting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Cronograma"
        action={
          <button
            onClick={onReset}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalcular fechas
          </button>
        }
      />

      {/* Resumen */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-ink-100 px-4 py-2.5 text-sm">
        <span className="text-ink-600">
          {formatDate(startPlanned)} → {formatDate(endPlanned)}{" "}
          <span className="text-ink-400">({totalDays} días)</span>
        </span>
        <span className="text-ink-600">
          Avance real: <strong className="text-ink-900">{Math.round(realProgress)}%</strong>
        </span>
        <span className="text-ink-600">
          Previsto a hoy: <strong className="text-ink-900">{Math.round(expected)}%</strong>
        </span>
        {withinWindow && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              onSchedule ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {onSchedule ? "En plazo" : "Retrasada"}
          </span>
        )}
      </div>

      {/* Gantt */}
      <div className="overflow-x-auto p-4">
        <div className="min-w-[720px]">
          {chapters.map((ch) => {
            const items = ch.items ?? [];
            if (items.length === 0) return null;
            return (
              <div key={ch.id} className="mb-3">
                <div className="mb-1 flex items-center gap-2">
                  <div className="w-56 shrink-0 text-xs font-semibold text-ink-800">
                    {ch.code && <span className="mr-1 text-ink-400">{ch.code}</span>}
                    {ch.name}
                  </div>
                  <div className="flex-1" />
                </div>

                {items.map((it) => {
                  const slot = slots!.get(it.id)!;
                  const { left, width } = barPosition(slot.start, slot.end, startPlanned, endPlanned);
                  const pct = Math.max(0, Math.min(100, Number(it.pct_done) || 0));
                  return (
                    <div key={it.id} className="flex items-center gap-2 border-b border-ink-50 py-1.5">
                      <div className="w-56 shrink-0">
                        <p className="truncate text-xs text-ink-700" title={it.description}>
                          {it.code && <span className="mr-1 text-ink-400">{it.code}</span>}
                          {it.description}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <input
                            type="date"
                            className={dateInput}
                            value={slot.start}
                            min={startPlanned}
                            max={endPlanned}
                            onChange={(e) => onDate(it.id, "start", e.target.value, slot.start, slot.end)}
                          />
                          <span className="text-ink-300">→</span>
                          <input
                            type="date"
                            className={dateInput}
                            value={slot.end}
                            min={startPlanned}
                            max={endPlanned}
                            onChange={(e) => onDate(it.id, "end", e.target.value, slot.start, slot.end)}
                          />
                          {savingId === it.id && <Loader2 className="h-3 w-3 animate-spin text-ink-400" />}
                          {!slot.auto && (
                            <span className="rounded bg-ink-100 px-1 text-[9px] text-ink-500" title="Fecha ajustada a mano">
                              manual
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative h-7 flex-1 rounded bg-ink-50">
                        {todayPct !== null && (
                          <div
                            className="absolute bottom-0 top-0 z-10 w-px bg-red-400"
                            style={{ left: `${todayPct}%` }}
                            title={`Hoy: ${formatDate(today)}`}
                          />
                        )}
                        <div
                          className="absolute bottom-1 top-1 overflow-hidden rounded bg-brand-200"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${formatDate(slot.start)} → ${formatDate(slot.end)} · ${Math.round(pct)}%`}
                        >
                          <div className="h-full rounded bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="px-4 pb-3 text-xs text-ink-400">
        Las fechas se reparten automáticamente entre el inicio y el fin de la obra según el importe de
        cada partida. Ajusta cualquier fecha a mano (queda marcada como “manual”). La línea roja marca
        el día de hoy y el relleno de cada barra es su % de avance.
      </p>
    </Card>
  );
}
