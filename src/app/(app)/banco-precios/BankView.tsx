"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import type { PriceItem, PriceMaterial } from "@/lib/quotes/bank-types";
import { EmptyState } from "@/components/ui/EmptyState";
import { itemTotals } from "@/lib/quotes/types";
import { formatCurrency } from "@/lib/format";

type Tab = "partidas" | "materiales";

export function BankView({
  items,
  materials,
}: {
  items: PriceItem[];
  materials: PriceMaterial[];
}) {
  const [tab, setTab] = useState<Tab>("partidas");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("todas");

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (category !== "todas" && i.category !== category) return false;
      if (!term) return true;
      return [i.name, i.description, i.category].filter(Boolean).some((v) =>
        (v as string).toLowerCase().includes(term),
      );
    });
  }, [items, q, category]);

  const filteredMaterials = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter((m) =>
      [m.name, m.code, m.reference].filter(Boolean).some((v) =>
        (v as string).toLowerCase().includes(term),
      ),
    );
  }, [materials, q]);

  if (items.length === 0 && materials.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="El banco de precios está vacío"
        description="Ejecuta el SQL de importación en Supabase para cargar tus partidas y materiales."
      />
    );
  }

  return (
    <div>
      {/* Pestañas */}
      <div className="mb-4 flex gap-1 border-b border-ink-200">
        <TabButton active={tab === "partidas"} onClick={() => setTab("partidas")}>
          Partidas ({items.length})
        </TabButton>
        <TabButton active={tab === "materiales"} onClick={() => setTab("materiales")}>
          Materiales ({materials.length})
        </TabButton>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {tab === "partidas" && (
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
        )}
      </div>

      {/* Tablas */}
      {tab === "partidas" ? (
        <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3 font-semibold">Partida</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 text-center font-semibold">Ud.</th>
                <th className="px-4 py-3 text-right font-semibold">M. obra</th>
                <th className="px-4 py-3 text-right font-semibold">Materiales</th>
                <th className="px-4 py-3 text-right font-semibold">Margen</th>
                <th className="px-4 py-3 text-right font-semibold">Venta ud</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((i) => {
                const t = itemTotals({
                  quantity: 1,
                  cost_labor: i.cost_labor,
                  cost_materials: i.cost_materials,
                  cost_other: i.cost_other,
                  margin_pct: i.margin_pct,
                });
                return (
                  <tr key={i.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                    <td className="px-4 py-3 text-ink-800">{i.name}</td>
                    <td className="px-4 py-3 text-ink-500">{i.category}</td>
                    <td className="px-4 py-3 text-center text-ink-500">{i.unit}</td>
                    <td className="px-4 py-3 text-right text-ink-600">{formatCurrency(i.cost_labor)}</td>
                    <td className="px-4 py-3 text-right text-ink-600">{formatCurrency(i.cost_materials)}</td>
                    <td className="px-4 py-3 text-right text-ink-600">{i.margin_pct}%</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">{formatCurrency(t.saleUnit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Material</th>
                <th className="px-4 py-3 text-center font-semibold">Ud.</th>
                <th className="px-4 py-3 text-right font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((m) => (
                <tr key={m.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-3 text-ink-500">{m.code || "—"}</td>
                  <td className="px-4 py-3 text-ink-800">{m.name}</td>
                  <td className="px-4 py-3 text-center text-ink-500">{m.unit || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink-900">{formatCurrency(m.unit_price)}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">{m.reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-ink-500 hover:text-ink-800"
      }`}
    >
      {children}
    </button>
  );
}
