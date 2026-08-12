"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, Building2 } from "lucide-react";
import type { Supplier } from "@/lib/crm/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StarRating } from "@/components/crm/StarRating";
import { initials } from "@/lib/format";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("todas");

  const categories = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort();
  }, [suppliers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (category !== "todas" && s.category !== category) return false;
      if (!term) return true;
      return [s.name, s.email, s.phone, s.tax_id, s.city, s.category, s.products_services]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [suppliers, q, category]);

  if (suppliers.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aún no tienes proveedores"
        description="Da de alta tu primer proveedor para gestionar contactos, documentación y evaluaciones."
      >
        <Link
          href={"/proveedores/nuevo" as Route}
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Nuevo proveedor
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
            placeholder="Buscar por nombre, categoría, email, CIF/NIF…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="todas">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-semibold">Proveedor</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Ciudad</th>
              <th className="px-4 py-3 font-semibold">Valoración</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50"
              >
                <td className="px-4 py-3">
                  <Link href={`/proveedores/${s.id}` as Route} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-800 text-[11px] font-semibold text-white">
                      {initials(s.name)}
                    </span>
                    <span>
                      <span className="block font-medium text-ink-900 hover:text-brand-700">
                        {s.name}
                      </span>
                      {s.email && <span className="block text-xs text-ink-400">{s.email}</span>}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-600">{s.category || "—"}</td>
                <td className="px-4 py-3 text-ink-600">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-ink-600">{s.city || "—"}</td>
                <td className="px-4 py-3">
                  <StarRating value={s.rating_overall} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">
          No hay proveedores que coincidan con la búsqueda.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {suppliers.length} proveedor{suppliers.length === 1 ? "" : "es"}
      </p>
    </div>
  );
}
