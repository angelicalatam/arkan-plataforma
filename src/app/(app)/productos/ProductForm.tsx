"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { createProduct, updateProduct, type ProductInput } from "@/lib/products/actions";
import type { Product } from "@/lib/products/types";
import { inputClass, Field } from "@/components/ui/Form";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function ProductForm({
  product,
  onDone,
  onCancel,
}: {
  product?: Product;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(product);
  const [form, setForm] = useState<ProductInput>({
    name: product?.name ?? "",
    category: product?.category ?? "",
    brand: product?.brand ?? "",
    price: product?.price ?? 0,
    reference: product?.reference ?? "",
    description: product?.description ?? "",
    image_url: product?.image_url ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = { ...form, price: Number(form.price) || 0 };
    const res = editing
      ? await updateProduct(product!.id, payload)
      : await createProduct(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 shadow-sm"
    >
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Fotografía</span>
        <ImageUpload value={form.image_url ?? null} onChange={(url) => set("image_url", url)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre del producto" required full>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Categoría">
          <input
            className={inputClass}
            value={form.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Ej. Grifos, Sanitarios…"
          />
        </Field>
        <Field label="Marca">
          <input className={inputClass} value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} />
        </Field>
        <Field label="Precio (€)">
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={form.price ?? 0}
            onChange={(e) => set("price", e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
        <Field label="Referencia del proveedor">
          <input
            className={inputClass}
            value={form.reference ?? ""}
            onChange={(e) => set("reference", e.target.value)}
          />
        </Field>
        <Field label="Descripción" full>
          <textarea
            rows={2}
            className={inputClass}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-2">
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
