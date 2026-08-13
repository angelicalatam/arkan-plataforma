"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Star,
  Loader2,
  Check,
  X,
  ShoppingBag,
  Search,
  ImageOff,
} from "lucide-react";
import type { QuoteItemProduct, Product } from "@/lib/products/types";
import {
  addItemProduct,
  deleteItemProduct,
  setRecommendedProduct,
  searchProducts,
  type ItemProductInput,
} from "@/lib/products/actions";
import { formatCurrency } from "@/lib/format";
import { inputClass } from "@/components/ui/Form";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function ProductOptions({
  quoteId,
  quoteItemId,
  products,
}: {
  quoteId: string;
  quoteItemId: string;
  products: QuoteItemProduct[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  async function onDelete(p: QuoteItemProduct) {
    if (!window.confirm(`¿Quitar la opción "${p.name}"?`)) return;
    await deleteItemProduct(p.id, quoteId);
    router.refresh();
  }

  async function onRecommend(p: QuoteItemProduct) {
    await setRecommendedProduct(p.id, quoteItemId, quoteId);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-700">
        <ShoppingBag className="h-4 w-4 text-ink-400" />
        Opciones de producto para el cliente
      </div>

      {/* Opciones existentes */}
      {products.length > 0 && (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`flex gap-3 rounded-lg border p-2 ${
                p.is_recommended ? "border-brand-400 bg-brand-50/40" : "border-ink-200 bg-white"
              }`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-ink-50">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-ink-300">
                    <ImageOff className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">{p.name}</p>
                {p.brand && <p className="text-xs text-ink-400">{p.brand}</p>}
                <p className="text-sm font-semibold text-brand-700">{formatCurrency(p.price)}</p>
                {p.reference && <p className="truncate text-[10px] text-ink-400">{p.reference}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => onRecommend(p)}
                    className={`inline-flex items-center gap-1 text-xs ${
                      p.is_recommended ? "text-brand-600" : "text-ink-400 hover:text-brand-600"
                    }`}
                    title="Marcar como recomendada"
                  >
                    <Star className={`h-3.5 w-3.5 ${p.is_recommended ? "fill-brand-400" : ""}`} />
                    {p.is_recommended ? "Recomendada" : "Recomendar"}
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <AddOptionForm
          quoteId={quoteId}
          quoteItemId={quoteItemId}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" /> Añadir opción de producto
        </button>
      )}
    </div>
  );
}

function AddOptionForm({
  quoteId,
  quoteItemId,
  onDone,
  onCancel,
}: {
  quoteId: string;
  quoteItemId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ItemProductInput>({
    name: "",
    brand: "",
    price: 0,
    reference: "",
    description: "",
    image_url: null,
    product_id: null,
  });
  const [saveBank, setSaveBank] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bankOpen, setBankOpen] = useState(false);
  const [bankResults, setBankResults] = useState<Product[]>([]);
  const [bankLoading, setBankLoading] = useState(false);

  function set<K extends keyof ItemProductInput>(key: K, value: ItemProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function runSearch(term: string) {
    setBankLoading(true);
    setBankResults(await searchProducts(term));
    setBankLoading(false);
  }

  function pick(p: Product) {
    setForm({
      name: p.name,
      brand: p.brand ?? "",
      price: p.price,
      reference: p.reference ?? "",
      description: p.description ?? "",
      image_url: p.image_url,
      product_id: p.id,
    });
    setBankOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await addItemProduct(
      quoteId,
      quoteItemId,
      { ...form, price: Number(form.price) || 0 },
      saveBank,
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {/* Selector del banco de productos */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => {
            setBankOpen((v) => !v);
            if (!bankOpen && bankResults.length === 0) runSearch("");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          <ShoppingBag className="h-3.5 w-3.5" /> Elegir del banco de productos
        </button>
        {bankOpen && (
          <div className="mt-2 rounded-lg border border-ink-200 bg-white p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Buscar producto (ej. grifo, inodoro…)"
                className={`${inputClass} pl-8`}
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto">
              {bankLoading ? (
                <p className="py-3 text-center text-xs text-ink-400">Buscando…</p>
              ) : bankResults.length === 0 ? (
                <p className="py-3 text-center text-xs text-ink-400">Sin resultados.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {bankResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => pick(p)}
                        className="flex w-full items-center gap-2 px-1 py-1.5 text-left hover:bg-brand-50"
                      >
                        <span className="h-8 w-8 shrink-0 overflow-hidden rounded bg-ink-50">
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink-800">{p.name}</span>
                        <span className="shrink-0 text-xs text-ink-500">{formatCurrency(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-medium text-ink-500">Fotografía</span>
        <ImageUpload value={form.image_url ?? null} onChange={(url) => set("image_url", url)} size={72} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Nombre *</span>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Marca</span>
          <input className={inputClass} value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Precio (€)</span>
          <input
            type="number"
            step="0.01"
            className={`${inputClass} text-right`}
            value={form.price ?? 0}
            onChange={(e) => set("price", e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Referencia proveedor</span>
          <input className={inputClass} value={form.reference ?? ""} onChange={(e) => set("reference", e.target.value)} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Descripción breve</span>
          <input className={inputClass} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={saveBank}
            onChange={(e) => setSaveBank(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Guardar también en el banco de productos
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
            Añadir opción
          </button>
        </div>
      </div>
    </form>
  );
}
