"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, FileText } from "lucide-react";
import type { Quote } from "@/lib/quotes/types";
import { QUOTE_STATUSES, statusInfo, quoteTotals } from "@/lib/quotes/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";

function flatItems(q: Quote) {
  return (q.chapters ?? []).flatMap((ch) => ch.items ?? []);
}

export function QuotesTable({ quotes }: { quotes: Quote[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (status !== "todos" && quote.status !== status) return false;
      if (!term) return true;
      return [quote.code, quote.title, quote.customer?.name, quote.work_address]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [quotes, q, status]);

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aún no tienes presupuestos"
        description="Crea tu primer presupuesto para empezar a estructurar capítulos, partidas y costes."
      >
        <Link
          href={"/presupuestos/nuevo" as Route}
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Nuevo presupuesto
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
            placeholder="Buscar por nº, título, cliente…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          {QUOTE_STATUSES.map((s) => (
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
              <th className="px-4 py-3 font-semibold">Nº</th>
              <th className="px-4 py-3 font-semibold">Título / Cliente</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 text-right font-semibold">Partidas</th>
              <th className="px-4 py-3 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quote) => {
              const totals = quoteTotals(flatItems(quote), quote.tax_rate);
              const si = statusInfo(quote.status);
              return (
                <tr
                  key={quote.id}
                  className="border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/presupuestos/${quote.id}` as Route}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {quote.code || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-ink-800">{quote.title || "Sin título"}</span>
                    <span className="block text-xs text-ink-400">
                      {quote.customer?.name || "Sin cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={si.tone}>{si.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(quote.issue_date)}</td>
                  <td className="px-4 py-3 text-right text-ink-600">{totals.itemCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">
                    {formatCurrency(totals.sale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">
          No hay presupuestos que coincidan con la búsqueda.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-400">
        {filtered.length} de {quotes.length} presupuesto{quotes.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
