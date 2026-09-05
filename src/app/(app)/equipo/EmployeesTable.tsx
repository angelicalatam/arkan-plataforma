"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, Users } from "lucide-react";
import type { Employee } from "@/lib/team/types";
import { RELATION_TYPES } from "@/lib/team/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

function relLabel(r: string) {
  return RELATION_TYPES.find((x) => x.value === r)?.label ?? r;
}

export function EmployeesTable({ employees }: { employees: Employee[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((e) =>
      [e.name, e.role, e.specialty, e.email].filter(Boolean).some((v) =>
        (v as string).toLowerCase().includes(term),
      ),
    );
  }, [employees, q]);

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aún no tienes equipo"
        description="Añade a tus operarios y colaboradores con su coste por hora para poder imputar horas a las obras."
      >
        <Link href={"/equipo/nuevo" as Route} className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Nuevo miembro
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, rol, especialidad…"
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Especialidad</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 text-right font-semibold">Coste/hora</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link href={`/equipo/${e.id}/editar` as Route} className="font-medium text-ink-900 hover:text-brand-700">
                    {e.name}
                  </Link>
                  {e.role && <div className="text-xs text-ink-400">{e.role}</div>}
                </td>
                <td className="px-4 py-3 text-ink-600">{e.specialty || "—"}</td>
                <td className="px-4 py-3 text-ink-600">{relLabel(e.relationship)}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-800">{formatCurrency(e.hourly_cost)}</td>
                <td className="px-4 py-3">
                  {e.active ? <Badge tone="green">Activo</Badge> : <Badge tone="ink">Inactivo</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {employees.length} persona{employees.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
