"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, ShoppingBag } from "lucide-react";
import type { QuoteChapter, QuoteItem } from "@/lib/quotes/types";
import { itemTotals, quoteTotals } from "@/lib/quotes/types";
import { deleteItem, deleteChapter, updateChapter } from "@/lib/quotes/actions";
import { formatCurrency } from "@/lib/format";
import { inputClass } from "@/components/ui/Form";
import { ItemForm } from "./ItemForm";
import { ProductOptions } from "./ProductOptions";

export function ChapterBlock({
  quoteId,
  chapter,
}: {
  quoteId: string;
  chapter: QuoteChapter;
}) {
  const router = useRouter();
  const items = chapter.items ?? [];
  const totals = quoteTotals(items);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productsFor, setProductsFor] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState(false);
  const [chName, setChName] = useState(chapter.name);
  const [chCode, setChCode] = useState(chapter.code ?? "");

  async function onDeleteItem(item: QuoteItem) {
    if (!window.confirm(`¿Eliminar la partida "${item.description}"?`)) return;
    await deleteItem(item.id, quoteId);
    router.refresh();
  }

  async function onDeleteChapter() {
    if (
      !window.confirm(
        `¿Eliminar el capítulo "${chapter.name}" y todas sus partidas? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await deleteChapter(chapter.id, quoteId);
    router.refresh();
  }

  async function onSaveChapter() {
    if (!chName.trim()) return;
    await updateChapter(chapter.id, quoteId, { name: chName, code: chCode || null });
    setEditingChapter(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
      {/* Cabecera del capítulo */}
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 bg-ink-50 px-4 py-2.5">
        {editingChapter ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              className={`${inputClass} max-w-[5rem]`}
              value={chCode}
              onChange={(e) => setChCode(e.target.value)}
              placeholder="Cód."
            />
            <input
              className={inputClass}
              value={chName}
              onChange={(e) => setChName(e.target.value)}
            />
            <button onClick={onSaveChapter} className="rounded p-1.5 text-green-600 hover:bg-green-50">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditingChapter(false)} className="rounded p-1.5 text-ink-500 hover:bg-ink-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-ink-800">
              {chapter.code && <span className="mr-2 text-ink-400">{chapter.code}</span>}
              {chapter.name}
            </h3>
            <div className="flex items-center gap-1">
              <span className="mr-2 text-sm font-medium text-ink-600">
                {formatCurrency(totals.sale)}
              </span>
              <button onClick={() => setEditingChapter(true)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" title="Editar capítulo">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={onDeleteChapter} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar capítulo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tabla de partidas */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-3 py-2 font-semibold">Cód.</th>
              <th className="px-3 py-2 font-semibold">Descripción</th>
              <th className="px-3 py-2 text-center font-semibold">Ud.</th>
              <th className="px-3 py-2 text-right font-semibold">Cant.</th>
              <th className="px-3 py-2 text-right font-semibold">Coste ud</th>
              <th className="px-3 py-2 text-right font-semibold">Venta ud</th>
              <th className="px-3 py-2 text-right font-semibold">Importe</th>
              <th className="px-3 py-2 text-right font-semibold">Margen</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td colSpan={9} className="p-2">
                    <div className="space-y-3">
                      <ItemForm
                        quoteId={quoteId}
                        chapterId={chapter.id}
                        chapterName={chapter.name}
                        item={item}
                        onDone={() => setEditingId(null)}
                        onCancel={() => setEditingId(null)}
                      />
                      <ProductOptions
                        quoteId={quoteId}
                        quoteItemId={item.id}
                        products={item.products ?? []}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                <Fragment key={item.id}>
                  <ItemRow
                    item={item}
                    productCount={item.products?.length ?? 0}
                    expanded={productsFor === item.id}
                    onEdit={() => setEditingId(item.id)}
                    onDelete={() => onDeleteItem(item)}
                    onToggleProducts={() =>
                      setProductsFor((cur) => (cur === item.id ? null : item.id))
                    }
                  />
                  {productsFor === item.id && (
                    <tr>
                      <td colSpan={9} className="bg-ink-50/50 p-3">
                        <ProductOptions
                          quoteId={quoteId}
                          quoteItemId={item.id}
                          products={item.products ?? []}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ),
            )}
            {items.length === 0 && !adding && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-ink-400">
                  Sin partidas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Añadir partida */}
      <div className="border-t border-ink-100 p-3">
        {adding ? (
          <ItemForm
            quoteId={quoteId}
            chapterId={chapter.id}
            chapterName={chapter.name}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> Añadir partida
          </button>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  productCount,
  expanded,
  onEdit,
  onDelete,
  onToggleProducts,
}: {
  item: QuoteItem;
  productCount: number;
  expanded: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleProducts: () => void;
}) {
  const t = itemTotals(item);
  return (
    <tr className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
      <td className="px-3 py-2 text-ink-500">{item.code || "—"}</td>
      <td className="px-3 py-2 text-ink-800">{item.description}</td>
      <td className="px-3 py-2 text-center text-ink-500">{item.unit}</td>
      <td className="px-3 py-2 text-right text-ink-600">{item.quantity}</td>
      <td className="px-3 py-2 text-right text-ink-600">{formatCurrency(t.unitCost)}</td>
      <td className="px-3 py-2 text-right text-ink-600">{formatCurrency(t.saleUnit)}</td>
      <td className="px-3 py-2 text-right font-medium text-ink-900">{formatCurrency(t.lineSale)}</td>
      <td className="px-3 py-2 text-right text-green-700">{formatCurrency(t.marginEur)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onToggleProducts}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-1.5 text-xs font-medium ${
              expanded || productCount > 0
                ? "text-brand-600 hover:bg-brand-50"
                : "text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            }`}
            title="Opciones de producto"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {productCount > 0 ? productCount : ""}
          </button>
          <button onClick={onEdit} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" title="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
