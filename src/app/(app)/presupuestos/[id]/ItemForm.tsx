"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, BookOpen, Search } from "lucide-react";
import {
  addItem,
  updateItem,
  searchPriceItems,
  saveToBank,
  type ItemInput,
} from "@/lib/quotes/actions";
import { itemTotals, type QuoteItem } from "@/lib/quotes/types";
import type { PriceItem } from "@/lib/quotes/bank-types";
import { formatCurrency } from "@/lib/format";
import { inputClass } from "@/components/ui/Form";

type Props = {
  quoteId: string;
  chapterId: string;
  chapterName?: string;
  item?: QuoteItem;
  onDone: () => void;
  onCancel: () => void;
};

export function ItemForm({ quoteId, chapterId, chapterName, item, onDone, onCancel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ItemInput>({
    code: item?.code ?? "",
    description: item?.description ?? "",
    unit: item?.unit ?? "ud",
    quantity: item?.quantity ?? 1,
    cost_labor: item?.cost_labor ?? 0,
    cost_materials: item?.cost_materials ?? 0,
    cost_other: item?.cost_other ?? 0,
    margin_pct: item?.margin_pct ?? 0,
    est_hours: item?.est_hours ?? null,
    est_workers: item?.est_workers ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveBank, setSaveBank] = useState(false);

  // Selector del banco de precios
  const [bankOpen, setBankOpen] = useState(false);
  const [bankTerm, setBankTerm] = useState("");
  const [bankResults, setBankResults] = useState<PriceItem[]>([]);
  const [bankLoading, setBankLoading] = useState(false);

  function set<K extends keyof ItemInput>(key: K, value: ItemInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function runBankSearch(term: string) {
    setBankTerm(term);
    setBankLoading(true);
    const res = await searchPriceItems(term);
    setBankResults(res);
    setBankLoading(false);
  }

  function pickFromBank(p: PriceItem) {
    setForm((f) => ({
      ...f,
      code: p.code ?? f.code,
      description: p.name,
      unit: p.unit ?? "ud",
      cost_labor: p.cost_labor,
      cost_materials: p.cost_materials,
      cost_other: p.cost_other,
      margin_pct: p.margin_pct,
      est_hours: p.est_hours,
      est_workers: p.est_workers,
    }));
    setBankOpen(false);
  }

  const preview = itemTotals({
    quantity: Number(form.quantity) || 0,
    cost_labor: Number(form.cost_labor) || 0,
    cost_materials: Number(form.cost_materials) || 0,
    cost_other: Number(form.cost_other) || 0,
    margin_pct: Number(form.margin_pct) || 0,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description?.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload: ItemInput = {
      ...form,
      quantity: Number(form.quantity) || 0,
      cost_labor: Number(form.cost_labor) || 0,
      cost_materials: Number(form.cost_materials) || 0,
      cost_other: Number(form.cost_other) || 0,
      margin_pct: Number(form.margin_pct) || 0,
      est_hours: form.est_hours === null || (form.est_hours as unknown) === "" ? null : Number(form.est_hours),
      est_workers: form.est_workers === null || (form.est_workers as unknown) === "" ? null : Number(form.est_workers),
    };
    const res = item
      ? await updateItem(item.id, quoteId, payload)
      : await addItem(quoteId, chapterId, payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    // Guardar también en el banco de precios si la usuaria lo pidió.
    if (saveBank) {
      await saveToBank({
        category: chapterName ?? null,
        code: payload.code ?? null,
        name: payload.description!,
        description: payload.description ?? null,
        unit: payload.unit ?? "ud",
        cost_labor: payload.cost_labor,
        cost_materials: payload.cost_materials,
        cost_other: payload.cost_other,
        margin_pct: payload.margin_pct,
        est_hours: payload.est_hours ?? null,
        est_workers: payload.est_workers ?? null,
      });
    }

    router.refresh();
    onDone();
  }

  const numCls = `${inputClass} text-right`;

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {/* Selector del banco de precios */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => {
            setBankOpen((v) => !v);
            if (!bankOpen && bankResults.length === 0) runBankSearch("");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Elegir del banco de precios
        </button>

        {bankOpen && (
          <div className="mt-2 rounded-lg border border-ink-200 bg-white p-2 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={bankTerm}
                onChange={(e) => runBankSearch(e.target.value)}
                placeholder="Buscar partida (ej. pladur, alicatado, derribo…)"
                className={`${inputClass} pl-8`}
              />
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto">
              {bankLoading ? (
                <p className="py-3 text-center text-xs text-ink-400">Buscando…</p>
              ) : bankResults.length === 0 ? (
                <p className="py-3 text-center text-xs text-ink-400">
                  Sin resultados. ¿Has importado el banco de precios?
                </p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {bankResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => pickFromBank(p)}
                        className="flex w-full items-center justify-between gap-2 px-1 py-2 text-left hover:bg-brand-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-ink-800">{p.name}</span>
                          <span className="block text-xs text-ink-400">{p.category}</span>
                        </span>
                        <span className="shrink-0 text-xs text-ink-500">
                          MO {formatCurrency(p.cost_labor)} · Mat {formatCurrency(p.cost_materials)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
        <label className="col-span-1 sm:col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Código</span>
          <input className={inputClass} value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} />
        </label>
        <label className="col-span-2 sm:col-span-7">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Descripción *</span>
          <input
            className={inputClass}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Ej. Demolición de tabique de ladrillo"
          />
        </label>
        <label className="col-span-1 sm:col-span-1">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Ud.</span>
          <input className={inputClass} value={form.unit ?? ""} onChange={(e) => set("unit", e.target.value)} />
        </label>
        <label className="col-span-1 sm:col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Cantidad</span>
          <input
            type="number"
            step="0.001"
            className={numCls}
            value={form.quantity ?? 0}
            onChange={(e) => set("quantity", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-12">
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Mano de obra (€/ud)</span>
          <input type="number" step="0.01" className={numCls} value={form.cost_labor ?? 0} onChange={(e) => set("cost_labor", Number(e.target.value))} />
        </label>
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Materiales (€/ud)</span>
          <input type="number" step="0.01" className={numCls} value={form.cost_materials ?? 0} onChange={(e) => set("cost_materials", Number(e.target.value))} />
        </label>
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Otros (€/ud)</span>
          <input type="number" step="0.01" className={numCls} value={form.cost_other ?? 0} onChange={(e) => set("cost_other", Number(e.target.value))} />
        </label>
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Margen (%)</span>
          <input type="number" step="0.01" className={numCls} value={form.margin_pct ?? 0} onChange={(e) => set("margin_pct", Number(e.target.value))} />
        </label>
      </div>

      {/* Tiempo estimado */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-12">
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Horas estimadas</span>
          <input
            type="number"
            step="0.5"
            className={numCls}
            value={form.est_hours ?? ""}
            onChange={(e) => set("est_hours", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Nº operarios</span>
          <input
            type="number"
            step="1"
            className={numCls}
            value={form.est_workers ?? ""}
            onChange={(e) => set("est_workers", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
      </div>

      {/* Previsualización de cálculos */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-white px-3 py-2 text-xs text-ink-600">
        <span>Coste ud: <strong className="text-ink-800">{formatCurrency(preview.unitCost)}</strong></span>
        <span>Venta ud: <strong className="text-ink-800">{formatCurrency(preview.saleUnit)}</strong></span>
        <span>Importe: <strong className="text-brand-700">{formatCurrency(preview.lineSale)}</strong></span>
        <span>Margen: <strong className="text-green-700">{formatCurrency(preview.marginEur)}</strong></span>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={saveBank}
            onChange={(e) => setSaveBank(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Guardar también en el banco de precios
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {item ? "Guardar" : "Añadir"}
          </button>
        </div>
      </div>
    </form>
  );
}
