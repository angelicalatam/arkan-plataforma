"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, Users } from "lucide-react";
import type { Customer } from "@/lib/crm/types";
import { CUSTOMER_TYPES } from "@/lib/crm/types";
import { Badge, stageTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import { initials } from "@/lib/format";

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("todos");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers.filter((c) => {
      if (type !== "todos" && c.type !== type) return false;
      if (!term) return true;
      return [c.name, c.email, c.phone, c.tax_id, c.city, c.contact_person]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [customers, q, type]);

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aún no tienes clientes"
        description="Crea tu primer cliente para empezar a gestionar tu cartera comercial."
      >
        <Link
          href={"/clientes/nuevo" as Route}
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Nuevo cliente
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, CIF/NIF…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="todos">Todos los tipos</option>
          {CUSTOMER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Etapa</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Ciudad</th>
              <th className="px-4 py-3 text-right font-semibold">Valor potencial</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50"
              >
                <td className="px-4 py-3">
                  <Link href={`/clientes/${c.id}` as Route} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-800 text-[11px] font-semibold text-white">
                      {initials(c.name)}
                    </span>
                    <span>
                      <span className="block font-medium text-ink-900 hover:text-brand-700">
                        {c.name}
                      </span>
                      {c.email && <span className="block text-xs text-ink-400">{c.email}</span>}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-ink-600">{c.type}</td>
                <td className="px-4 py-3">
                  {c.stage ? (
                    <Badge tone={stageTone(c.stage.color)}>{c.stage.label}</Badge>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-600">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-ink-600">{c.city || "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-800">
                  {formatCurrency(c.potential_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">
          No hay clientes que coincidan con la búsqueda.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {customers.length} cliente{customers.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
