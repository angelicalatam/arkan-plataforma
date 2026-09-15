"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, Package } from "lucide-react";
import type { Material } from "@/lib/materials/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

export function MaterialsCatalog({ materials }: { materials: Material[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter((m) =>
      [m.name, m.category, m.reference, m.supplier?.name].filter(Boolean).some((v) =>
        (v as string).toLowerCase().includes(term),
      ),
    );
  }, [materials, q]);

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Catálogo vacío"
        description="Añade tus materiales habituales con su precio de referencia para elegirlos rápido en obras y compras."
      >
        <Link href={"/materiales/catalogo/nuevo" as Route} className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Nuevo material
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
          placeholder="Buscar por nombre, categoría, proveedor…"
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-semibold">Material</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Ud.</th>
              <th className="px-4 py-3 text-right font-semibold">Precio ref.</th>
              <th className="px-4 py-3 font-semibold">Proveedor</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-ink-50">
                      {m.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/materiales/catalogo/${m.id}/editar` as Route} className="font-medium text-ink-900 hover:text-brand-700">
                        {m.name}
                      </Link>
                      {m.pack_unit && m.pack_quantity ? (
                        <div className="text-xs text-ink-400">
                          1 {m.pack_unit} = {m.pack_quantity} {m.unit}
                          {m.pieces_per_pack ? ` = ${m.pieces_per_pack} ${m.piece_unit || "piezas"}` : ""}
                        </div>
                      ) : (
                        m.reference && <div className="text-xs text-ink-400">Ref. {m.reference}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-600">{m.category || "—"}</td>
                <td className="px-4 py-3 text-ink-500">{m.unit}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-800">{formatCurrency(m.reference_price)}</td>
                <td className="px-4 py-3 text-ink-600">{m.supplier?.name || "—"}</td>
                <td className="px-4 py-3">
                  {m.active ? <Badge tone="green">Activo</Badge> : <Badge tone="ink">Inactivo</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {materials.length} material{materials.length === 1 ? "" : "es"}
      </p>
    </div>
  );
}
