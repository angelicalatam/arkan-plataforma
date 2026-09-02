"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import {
  createPurchase,
  updatePurchase,
  searchProjectItems,
  type PurchaseInput,
} from "@/lib/purchases/actions";
import {
  PURCHASE_STATUSES,
  purchaseTotals,
  type Purchase,
  type PurchaseStatus,
} from "@/lib/purchases/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";
import { formatCurrency } from "@/lib/format";

type Option = { id: string; name: string | null; code?: string | null };

export function PurchaseForm({
  suppliers,
  projects,
  purchase,
}: {
  suppliers: { id: string; name: string }[];
  projects: Option[];
  purchase?: Purchase;
}) {
  const router = useRouter();
  const editing = Boolean(purchase);

  const [form, setForm] = useState<PurchaseInput>({
    supplier_id: purchase?.supplier_id ?? "",
    project_id: purchase?.project_id ?? "",
    project_item_id: purchase?.project_item_id ?? "",
    material: purchase?.material ?? "",
    quantity: purchase?.quantity ?? 1,
    unit: purchase?.unit ?? "ud",
    unit_price: purchase?.unit_price ?? 0,
    tax_rate: purchase?.tax_rate ?? 21,
    status: (purchase?.status as PurchaseStatus) ?? "pendiente",
    order_date: purchase?.order_date ?? "",
    expected_date: purchase?.expected_date ?? "",
    received_date: purchase?.received_date ?? "",
    invoice_ref: purchase?.invoice_ref ?? "",
    notes: purchase?.notes ?? "",
  });
  const [items, setItems] = useState<{ id: string; code: string | null; description: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PurchaseInput>(key: K, value: PurchaseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Cargar partidas de la obra seleccionada.
  useEffect(() => {
    const pid = form.project_id;
    if (!pid) {
      setItems([]);
      return;
    }
    let active = true;
    searchProjectItems(pid).then((res) => {
      if (active) setItems(res);
    });
    return () => {
      active = false;
    };
  }, [form.project_id]);

  const totals = purchaseTotals({
    quantity: Number(form.quantity) || 0,
    unit_price: Number(form.unit_price) || 0,
    tax_rate: Number(form.tax_rate) || 0,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.material?.trim()) {
      setError("El material es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload: PurchaseInput = {
      ...form,
      quantity: Number(form.quantity) || 0,
      unit_price: Number(form.unit_price) || 0,
      tax_rate: Number(form.tax_rate) || 0,
    };
    const res = editing
      ? await updatePurchase(purchase!.id, payload)
      : await createPurchase(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/compras");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormSection title="Material y relación">
        <Field label="Material / concepto" required full>
          <input
            className={inputClass}
            value={form.material}
            onChange={(e) => set("material", e.target.value)}
            placeholder="Ej. Vigas laminadas GL24"
          />
        </Field>
        <Field label="Proveedor">
          <select className={inputClass} value={form.supplier_id ?? ""} onChange={(e) => set("supplier_id", e.target.value)}>
            <option value="">— Sin proveedor —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Obra">
          <select
            className={inputClass}
            value={form.project_id ?? ""}
            onChange={(e) => {
              set("project_id", e.target.value);
              set("project_item_id", "");
            }}
          >
            <option value="">— Sin obra —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Partida (de la obra)" full>
          <select
            className={inputClass}
            value={form.project_item_id ?? ""}
            onChange={(e) => set("project_item_id", e.target.value)}
            disabled={!form.project_id || items.length === 0}
          >
            <option value="">
              {!form.project_id
                ? "— Elige una obra primero —"
                : items.length === 0
                  ? "— Esta obra no tiene partidas —"
                  : "— Sin partida concreta —"}
            </option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.code ? `${it.code} · ` : ""}
                {it.description}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Cantidad y precio">
        <Field label="Cantidad">
          <input type="number" step="0.001" className={inputClass} value={form.quantity ?? 0} onChange={(e) => set("quantity", Number(e.target.value))} />
        </Field>
        <Field label="Unidad">
          <input className={inputClass} value={form.unit ?? ""} onChange={(e) => set("unit", e.target.value)} />
        </Field>
        <Field label="Precio unitario (€)">
          <input type="number" step="0.01" className={inputClass} value={form.unit_price ?? 0} onChange={(e) => set("unit_price", Number(e.target.value))} />
        </Field>
        <Field label="IVA (%)">
          <input type="number" step="0.01" className={inputClass} value={form.tax_rate ?? 21} onChange={(e) => set("tax_rate", Number(e.target.value))} />
        </Field>
      </FormSection>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-ink-200 bg-white p-4 text-sm">
        <span className="text-ink-500">Subtotal: <strong className="text-ink-800">{formatCurrency(totals.subtotal)}</strong></span>
        <span className="text-ink-500">IVA: <strong className="text-ink-800">{formatCurrency(totals.tax)}</strong></span>
        <span className="text-base text-ink-900">Total: <strong className="text-brand-700">{formatCurrency(totals.total)}</strong></span>
      </div>

      <FormSection title="Estado y seguimiento">
        <Field label="Estado">
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as PurchaseStatus)}>
            {PURCHASE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nº de factura / referencia">
          <input className={inputClass} value={form.invoice_ref ?? ""} onChange={(e) => set("invoice_ref", e.target.value)} />
        </Field>
        <Field label="Fecha de pedido">
          <input type="date" className={inputClass} value={form.order_date ?? ""} onChange={(e) => set("order_date", e.target.value)} />
        </Field>
        <Field label="Entrega prevista">
          <input type="date" className={inputClass} value={form.expected_date ?? ""} onChange={(e) => set("expected_date", e.target.value)} />
        </Field>
        <Field label="Entrega real">
          <input type="date" className={inputClass} value={form.received_date ?? ""} onChange={(e) => set("received_date", e.target.value)} />
        </Field>
        <Field label="Notas" full>
          <textarea rows={2} className={inputClass} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear compra"}
        </button>
      </div>
    </form>
  );
}
