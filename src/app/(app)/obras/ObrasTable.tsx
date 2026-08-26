"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, HardHat } from "lucide-react";
import type { Project } from "@/lib/projects/types";
import { PROJECT_STATUSES, projectStatusInfo, projectProgress } from "@/lib/projects/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/format";

function flatItems(p: Project) {
  return (p.chapters ?? []).flatMap((ch) => ch.items ?? []);
}

export function ObrasTable({ projects }: { projects: Project[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (status !== "todos" && p.status !== status) return false;
      if (!term) return true;
      return [p.code, p.name, p.customer?.name, p.address]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [projects, q, status]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={HardHat}
        title="Aún no tienes obras"
        description="Crea una obra manualmente, o convierte un presupuesto aceptado en obra desde su ficha."
      >
        <Link
          href={"/obras/nueva" as Route}
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Nueva obra
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, nombre, cliente…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Obra / Cliente</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Avance</th>
              <th className="px-4 py-3 text-right font-semibold">Contratado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const prog = projectProgress(flatItems(p));
              const si = projectStatusInfo(p.status);
              return (
                <tr
                  key={p.id}
                  className="border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/obras/${p.id}` as Route}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {p.code || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-ink-800">{p.name || "Sin nombre"}</span>
                    <span className="block text-xs text-ink-400">
                      {p.customer?.name || "Sin cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={si.tone}>{si.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={prog} className="w-24" />
                      <span className="text-xs font-medium text-ink-600">{Math.round(prog)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">
                    {formatCurrency(p.contract_value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">
          No hay obras que coincidan con la búsqueda.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {projects.length} obra{projects.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
