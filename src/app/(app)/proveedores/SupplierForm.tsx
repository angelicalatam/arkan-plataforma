"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createSupplier, updateSupplier, type SupplierInput } from "@/lib/crm/actions";
import type { Supplier } from "@/lib/crm/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

const RATING_FIELDS: { key: keyof SupplierInput; label: string }[] = [
  { key: "rating_price", label: "Precio" },
  { key: "rating_quality", label: "Calidad" },
  { key: "rating_delivery", label: "Plazo de entrega" },
  { key: "rating_reliability", label: "Fiabilidad" },
  { key: "rating_service", label: "Atención" },
];

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const editing = Boolean(supplier);

  const [form, setForm] = useState<SupplierInput>({
    name: supplier?.name ?? "",
    legal_name: supplier?.legal_name ?? "",
    tax_id: supplier?.tax_id ?? "",
    contact_person: supplier?.contact_person ?? "",
    phone: supplier?.phone ?? "",
    whatsapp: supplier?.whatsapp ?? "",
    email: supplier?.email ?? "",
    website: supplier?.website ?? "",
    address: supplier?.address ?? "",
    city: supplier?.city ?? "",
    postal_code: supplier?.postal_code ?? "",
    province: supplier?.province ?? "",
    category: supplier?.category ?? "",
    subcategory: supplier?.subcategory ?? "",
    products_services: supplier?.products_services ?? "",
    payment_terms: supplier?.payment_terms ?? "",
    payment_method: supplier?.payment_method ?? "",
    delivery_time: supplier?.delivery_time ?? "",
    service_zone: supplier?.service_zone ?? "",
    notes: supplier?.notes ?? "",
    rating_price: supplier?.rating_price ?? 0,
    rating_quality: supplier?.rating_quality ?? 0,
    rating_delivery: supplier?.rating_delivery ?? 0,
    rating_reliability: supplier?.rating_reliability ?? 0,
    rating_service: supplier?.rating_service ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("El nombre comercial es obligatorio.");
      return;
    }
    setLoading(true);

    const ratings = RATING_FIELDS.map((r) => Number(form[r.key] ?? 0)).filter((n) => n > 0);
    const overall =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    const payload: SupplierInput = { ...form, rating_overall: overall };
    const res = editing
      ? await updateSupplier(supplier!.id, payload)
      : await createSupplier(payload);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/proveedores/${res.id ?? supplier!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormSection title="Datos generales">
        <Field label="Nombre comercial" required full>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Razón social">
          <input
            className={inputClass}
            value={form.legal_name ?? ""}
            onChange={(e) => set("legal_name", e.target.value)}
          />
        </Field>
        <Field label="CIF / NIF">
          <input
            className={inputClass}
            value={form.tax_id ?? ""}
            onChange={(e) => set("tax_id", e.target.value)}
          />
        </Field>
        <Field label="Persona de contacto">
          <input
            className={inputClass}
            value={form.contact_person ?? ""}
            onChange={(e) => set("contact_person", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Contacto">
        <Field label="Teléfono">
          <input
            className={inputClass}
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="WhatsApp">
          <input
            className={inputClass}
            value={form.whatsapp ?? ""}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Web">
          <input
            className={inputClass}
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Dirección">
        <Field label="Dirección" full>
          <input
            className={inputClass}
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="Ciudad">
          <input
            className={inputClass}
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Código postal">
          <input
            className={inputClass}
            value={form.postal_code ?? ""}
            onChange={(e) => set("postal_code", e.target.value)}
          />
        </Field>
        <Field label="Provincia">
          <input
            className={inputClass}
            value={form.province ?? ""}
            onChange={(e) => set("province", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Servicio y condiciones">
        <Field label="Categoría">
          <input
            className={inputClass}
            value={form.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Ej. Fontanería, Electricidad, Materiales…"
          />
        </Field>
        <Field label="Subcategoría">
          <input
            className={inputClass}
            value={form.subcategory ?? ""}
            onChange={(e) => set("subcategory", e.target.value)}
          />
        </Field>
        <Field label="Productos / servicios" full>
          <textarea
            rows={2}
            className={inputClass}
            value={form.products_services ?? ""}
            onChange={(e) => set("products_services", e.target.value)}
          />
        </Field>
        <Field label="Condiciones de pago">
          <input
            className={inputClass}
            value={form.payment_terms ?? ""}
            onChange={(e) => set("payment_terms", e.target.value)}
            placeholder="Ej. 30 días"
          />
        </Field>
        <Field label="Forma de pago">
          <input
            className={inputClass}
            value={form.payment_method ?? ""}
            onChange={(e) => set("payment_method", e.target.value)}
            placeholder="Ej. Transferencia"
          />
        </Field>
        <Field label="Plazo de entrega">
          <input
            className={inputClass}
            value={form.delivery_time ?? ""}
            onChange={(e) => set("delivery_time", e.target.value)}
          />
        </Field>
        <Field label="Zona de servicio">
          <input
            className={inputClass}
            value={form.service_zone ?? ""}
            onChange={(e) => set("service_zone", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Evaluación (1 a 5)">
        {RATING_FIELDS.map((r) => (
          <Field key={String(r.key)} label={r.label}>
            <select
              className={inputClass}
              value={Number(form[r.key] ?? 0)}
              onChange={(e) => set(r.key, Number(e.target.value) as SupplierInput[typeof r.key])}
            >
              <option value={0}>Sin valorar</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ⭐
                </option>
              ))}
            </select>
          </Field>
        ))}
      </FormSection>

      <FormSection title="Observaciones">
        <Field label="Notas internas" full>
          <textarea
            rows={3}
            className={inputClass}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear proveedor"}
        </button>
      </div>
    </form>
  );
}
