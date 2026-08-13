"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, ShoppingBag, ImageOff } from "lucide-react";
import type { Product } from "@/lib/products/types";
import { deleteProduct } from "@/lib/products/actions";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import { ProductForm } from "./ProductForm";

export function ProductsView({ products }: { products: Product[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("todas");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "todas" && p.category !== category) return false;
      if (!term) return true;
      return [p.name, p.brand, p.reference, p.category].filter(Boolean).some((v) =>
        (v as string).toLowerCase().includes(term),
      );
    });
  }, [products, q, category]);

  async function onDelete(p: Product) {
    if (!window.confirm(`¿Eliminar el producto "${p.name}"?`)) return;
    await deleteProduct(p.id);
    router.refresh();
  }

  return (
    <div>
      {/* Formulario (alta/edición) */}
      {editing && (
        <div className="mb-5">
          <ProductForm
            product={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Barra de acciones */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto, marca, referencia…"
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
        {!editing && (
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="El banco de productos está vacío"
          description="Añade productos con su foto y precio, o importa tus Excel desde Supabase."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm"
              >
                <div className="relative aspect-square bg-ink-50">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-ink-300">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(p)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 shadow hover:text-brand-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 shadow hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  {p.category && (
                    <div className="mb-1">
                      <Badge tone="ink">{p.category}</Badge>
                    </div>
                  )}
                  <p className="line-clamp-2 text-sm font-medium text-ink-800">{p.name}</p>
                  {p.brand && <p className="mt-0.5 text-xs text-ink-400">{p.brand}</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-brand-700">{formatCurrency(p.price)}</span>
                    {p.reference && (
                      <span className="truncate text-[10px] text-ink-400" title={p.reference}>
                        {p.reference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="mt-6 text-center text-sm text-ink-400">
              No hay productos que coincidan con la búsqueda.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-400">
            {filtered.length} de {products.length} producto{products.length === 1 ? "" : "s"}
          </p>
        </>
      )}
    </div>
  );
}
