"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, TriangleAlert, HardHat, User, ChevronRight } from "lucide-react";
import {
  severityInfo,
  incidentStatusInfo,
  isIncidentOpen,
  type Incident,
} from "@/lib/incidents/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

type Filter = "abiertas" | "resueltas" | "todas";

export function IncidentsList({ incidents }: { incidents: Incident[] }) {
  const [filter, setFilter] = useState<Filter>("abiertas");
  const [term, setTerm] = useState("");

  const counts = useMemo(() => {
    let abiertas = 0;
    for (const i of incidents) if (isIncidentOpen(i.status)) abiertas++;
    return { abiertas, resueltas: incidents.length - abiertas, todas: incidents.length };
  }, [incidents]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return incidents.filter((i) => {
      if (q && ![i.title, i.code, i.project?.name, i.project?.code].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)))
        return false;
      if (filter === "abiertas") return isIncidentOpen(i.status);
      if (filter === "resueltas") return !isIncidentOpen(i.status);
      return true;
    });
  }, [incidents, filter, term]);

  const tabs: { key: Filter; label: string; n: number }[] = [
    { key: "abiertas", label: "Abiertas", n: counts.abiertas },
    { key: "resueltas", label: "Resueltas/cerradas", n: counts.resueltas },
    { key: "todas", label: "Todas", n: counts.todas },
  ];

  return (
    <div>
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
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar incidencia…"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <TriangleAlert className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm text-ink-400">No hay incidencias en esta vista.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {filtered.map((i) => {
              const sev = severityInfo(i.severity);
              const st = incidentStatusInfo(i.status);
              return (
                <li key={i.id}>
                  <Link href={`/incidencias/${i.id}` as Route} className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50">
                    <TriangleAlert
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        i.severity === "critica" || i.severity === "alta" ? "text-red-500" : i.severity === "media" ? "text-amber-500" : "text-ink-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-brand-700">{i.code}</span>
                        <span className="font-medium text-ink-900">{i.title}</span>
                        <Badge tone={sev.tone}>{sev.label}</Badge>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-400">
                        {i.incident_date && <span>{formatDate(i.incident_date)}</span>}
                        {i.project && (
                          <span className="inline-flex items-center gap-1">
                            <HardHat className="h-3 w-3" />
                            {i.project.code || i.project.name}
                          </span>
                        )}
                        {i.assignee && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {i.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
