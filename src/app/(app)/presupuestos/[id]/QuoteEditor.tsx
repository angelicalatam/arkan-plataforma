"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check, X } from "lucide-react";
import type { Quote } from "@/lib/quotes/types";
import { quoteTotals, QUOTE_STATUSES, type QuoteStatus } from "@/lib/quotes/types";
import { addChapter, updateQuote } from "@/lib/quotes/actions";
import { formatCurrency } from "@/lib/format";
import { inputClass } from "@/components/ui/Form";
import { ChapterBlock } from "./ChapterBlock";

export function QuoteEditor({ quote }: { quote: Quote }) {
  const router = useRouter();
  const chapters = quote.chapters ?? [];
  const allItems = chapters.flatMap((c) => c.items ?? []);
  const totals = quoteTotals(allItems, quote.tax_rate);

  const [addingChapter, setAddingChapter] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [savingChapter, setSavingChapter] = useState(false);
  const [status, setStatus] = useState<QuoteStatus>(quote.status);

  async function onAddChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingChapter(true);
    await addChapter(quote.id, name, code || undefined);
    setSavingChapter(false);
    setName("");
    setCode("");
    setAddingChapter(false);
    router.refresh();
  }

  async function onChangeStatus(value: QuoteStatus) {
    setStatus(value);
    await updateQuote(quote.id, { status: value });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Resumen económico + estado */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Coste estimado" value={formatCurrency(totals.cost)} />
            <Metric label="Precio de venta" value={formatCurrency(totals.sale)} tone="brand" />
            <Metric
              label="Margen"
              value={formatCurrency(totals.marginEur)}
              hint={`${totals.marginPct.toFixed(1)}%`}
              tone="green"
            />
            <Metric label="Partidas" value={String(totals.itemCount)} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-ink-100 pt-3 text-sm">
            <span className="text-ink-500">
              Base: <strong className="text-ink-800">{formatCurrency(totals.sale)}</strong>
            </span>
            <span className="text-ink-500">
              IVA ({quote.tax_rate}%): <strong className="text-ink-800">{formatCurrency(totals.tax)}</strong>
            </span>
            <span className="text-base text-ink-900">
              Total: <strong className="text-brand-700">{formatCurrency(totals.total)}</strong>
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
            Estado del presupuesto
          </label>
          <select
            value={status}
            onChange={(e) => onChangeStatus(e.target.value as QuoteStatus)}
            className={inputClass}
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-ink-400">
            Al marcar “Enviado” o “Aceptado” se registra la fecha automáticamente.
          </p>
        </div>
      </div>

      {/* Capítulos */}
      <div className="space-y-4">
        {chapters.map((ch) => (
          <ChapterBlock key={ch.id} quoteId={quote.id} chapter={ch} />
        ))}
      </div>

      {/* Añadir capítulo */}
      {addingChapter ? (
        <form
          onSubmit={onAddChapter}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/40 p-3"
        >
          <input
            className={`${inputClass} max-w-[6rem]`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Cód. (01)"
          />
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del capítulo (ej. Demoliciones)"
            autoFocus
          />
          <button
            type="submit"
            disabled={savingChapter}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {savingChapter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Añadir
          </button>
          <button
            type="button"
            onClick={() => setAddingChapter(false)}
            className="rounded-lg border border-ink-200 bg-white p-2 text-ink-500 hover:bg-ink-50"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAddingChapter(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-600 hover:border-brand-400 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" /> Añadir capítulo
        </button>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "brand" | "green";
}) {
  const color =
    tone === "brand" ? "text-brand-700" : tone === "green" ? "text-green-700" : "text-ink-900";
  return (
    <div>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
