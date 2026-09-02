"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, ShoppingCart } from "lucide-react";
import type { Purchase } from "@/lib/purchases/types";
import { PURCHASE_STATUSES, purchaseStatusInfo, purchaseTotals } from "@/lib/purchases/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

export function PurchasesTable({ purchases }: { purchases: Purchase[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return purchases.filter((p) => {
      if (status !== "todos" && p.status !== status) return false;
      if (!term) return true;
      return [p.code, p.material, p.supplier?.name, p.project?.name, p.invoice_ref]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [purchases, q, status]);

  if (purchases.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Aún no hay compras"
        description="Registra la primera compra de material vinculada a una obra y un proveedor."
      >
        <Link
          href={"/compras/nueva" as Route}
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Nueva compra
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
            placeholder="Buscar por material, proveedor, obra, nº…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          {PURCHASE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-semibold">Nº</th>
              <th className="px-4 py-3 font-semibold">Material / Proveedor</th>
              <th className="px-4 py-3 font-semibold">Obra</th>
              <th className="px-4 py-3 text-right font-semibold">Cant.</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const t = purchaseTotals(p);
              const si = purchaseStatusInfo(p.status);
              return (
                <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <Link href={`/compras/${p.id}/editar` as Route} className="font-medium text-ink-900 hover:text-brand-700">
                      {p.code || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-ink-800">{p.material}</span>
                    <span className="block text-xs text-ink-400">{p.supplier?.name || "Sin proveedor"}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{p.project?.name || p.project?.code || "—"}</td>
                  <td className="px-4 py-3 text-right text-ink-600">
                    {p.quantity} {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">{formatCurrency(t.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={si.tone}>{si.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">No hay compras que coincidan.</p>
      )}
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {purchases.length} compra{purchases.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
