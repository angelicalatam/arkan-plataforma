"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2, FileSpreadsheet } from "lucide-react";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  parseOrderLinesFromExcel,
  type OrderInput,
  type OrderLineInput,
} from "@/lib/purchase-orders/actions";
import {
  ORDER_STATUSES,
  ORDER_ITEM_STATUSES,
  orderTotals,
  type PurchaseOrder,
  type OrderStatus,
  type OrderItemStatus,
} from "@/lib/purchase-orders/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";
import { formatCurrency } from "@/lib/format";

type Option = { id: string; name: string | null; code?: string | null; address?: string | null };
type Line = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  status: OrderItemStatus;
};

/** Texto a número: acepta coma o punto como decimal; vacío = 0. */
function num(v: string): number {
  const n = Number((v || "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

/** Unidades de medida más habituales en reformas. */
const UNITS = [
  "ud", "m", "m²", "m³", "ml", "cm", "kg", "t", "l", "h", "día",
  "palet", "caja", "saco", "bidón", "rollo", "juego", "par", "global",
];

let counter = 0;
const newLine = (): Line => ({
  key: `l${counter++}`,
  description: "",
  quantity: "1",
  unit: "ud",
  unit_price: "",
  status: "pendiente",
});

export function OrderForm({
  suppliers,
  projects,
  order,
}: {
  suppliers: { id: string; name: string }[];
  projects: Option[];
  order?: PurchaseOrder;
}) {
  const router = useRouter();
  const editing = Boolean(order);

  const [form, setForm] = useState<OrderInput>({
    supplier_id: order?.supplier_id ?? "",
    project_id: order?.project_id ?? "",
    status: (order?.status as OrderStatus) ?? "borrador",
    order_date: order?.order_date ?? new Date().toISOString().slice(0, 10),
    expected_date: order?.expected_date ?? "",
    delivery_address: order?.delivery_address ?? "",
    payment_terms: order?.payment_terms ?? "",
    tax_rate: order?.tax_rate ?? 21,
    notes: order?.notes ?? "",
  });

  const [lines, setLines] = useState<Line[]>(
    order?.items && order.items.length > 0
      ? order.items.map((it) => ({
          key: it.id,
          description: it.description,
          quantity: String(it.quantity ?? ""),
          unit: it.unit ?? "ud",
          unit_price: String(it.unit_price ?? ""),
          status: (it.status as OrderItemStatus) ?? "pendiente",
        }))
      : [newLine()],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Importar líneas desde el Excel.
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await parseOrderLinesFromExcel(fd);
    setImporting(false);
    if (!res.ok) {
      setImportMsg(res.error);
      return;
    }
    const imported: Line[] = res.lines.map((l) => ({
      key: `l${counter++}`,
      description: l.description,
      quantity: String(l.quantity ?? ""),
      unit: l.unit || "ud",
      unit_price: l.unit_price ? String(l.unit_price) : "",
      status: "pendiente",
    }));
    // Conserva las líneas que ya tengan descripción y añade las nuevas.
    setLines((ls) => {
      const kept = ls.filter((l) => l.description.trim());
      const next = [...kept, ...imported];
      return next.length > 0 ? next : [newLine()];
    });
    setImportMsg(`Se añadieron ${imported.length} línea(s) del Excel.`);
  }

  function set<K extends keyof OrderInput>(key: K, value: OrderInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Al elegir obra: guarda la obra y trae su dirección como dirección de entrega. */
  function onProjectChange(projectId: string) {
    const addr = projects.find((p) => p.id === projectId)?.address?.trim() ?? "";
    setForm((f) => ({
      ...f,
      project_id: projectId,
      // Rellena la dirección si está vacía o si la anterior venía de otra obra.
      delivery_address: addr || f.delivery_address || "",
    }));
  }

  function setLine(key: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, newLine()]);
  }
  function removeLine(key: string) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  }

  const totals = orderTotals(
    lines.map((l) => ({ quantity: num(l.quantity), unit_price: num(l.unit_price) })),
    Number(form.tax_rate) || 0,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplier_id) {
      setError("Elige el proveedor de la orden.");
      return;
    }
    if (!lines.some((l) => l.description.trim())) {
      setError("Añade al menos una línea de material.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload: OrderInput = { ...form, tax_rate: Number(form.tax_rate) || 0 };
    const cleanLines: OrderLineInput[] = lines.map((l) => ({
      description: l.description,
      quantity: num(l.quantity),
      unit: l.unit || "ud",
      unit_price: num(l.unit_price),
      status: l.status,
    }));
    const res = editing
      ? await updatePurchaseOrder(order!.id, payload, cleanLines)
      : await createPurchaseOrder(payload, cleanLines);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/ordenes-compra/${res.id ?? order!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <FormSection title="Datos de la orden">
        <Field label="Proveedor" required>
          <select className={inputClass} value={form.supplier_id ?? ""} onChange={(e) => set("supplier_id", e.target.value)}>
            <option value="">— Elige un proveedor —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Obra (opcional)">
          <select className={inputClass} value={form.project_id ?? ""} onChange={(e) => onProjectChange(e.target.value)}>
            <option value="">— Sin obra —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de la orden">
          <input type="date" className={inputClass} value={form.order_date ?? ""} onChange={(e) => set("order_date", e.target.value)} />
        </Field>
        <Field label="Entrega prevista">
          <input type="date" className={inputClass} value={form.expected_date ?? ""} onChange={(e) => set("expected_date", e.target.value)} />
        </Field>
        <Field label="Estado">
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="IVA (%)">
          <input type="number" step="0.01" className={inputClass} value={form.tax_rate ?? 21} onChange={(e) => set("tax_rate", e.target.value === "" ? null : Number(e.target.value))} />
        </Field>
        <Field label="Dirección de entrega" full>
          <input className={inputClass} value={form.delivery_address ?? ""} onChange={(e) => set("delivery_address", e.target.value)} placeholder="Dónde debe entregar el proveedor" />
          <p className="mt-1 text-[11px] text-ink-400">Al elegir una obra se rellena con su dirección. Puedes cambiarla.</p>
        </Field>
        <Field label="Condiciones de pago" full>
          <input className={inputClass} value={form.payment_terms ?? ""} onChange={(e) => set("payment_terms", e.target.value)} placeholder="Ej. 30 días fecha factura" />
        </Field>
      </FormSection>

      <FormSection title="Líneas de material">
        <div className="col-span-full space-y-2">
          {/* Importar desde Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={onImportFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Traer productos del Excel
            </button>
            {importMsg && <span className="text-xs text-ink-500">{importMsg}</span>}
          </div>
          <p className="text-[11px] text-ink-400">
            Añade una línea por cada partida con producto del Excel (nombre, cantidad y precio del coste; puedes editarlos).
          </p>

          {/* Cabecera (escritorio) */}
          <div className="hidden gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500 sm:grid sm:grid-cols-[1fr_4.5rem_3.5rem_6rem_6rem_9rem_2rem]">
            <span>Descripción</span>
            <span className="text-right">Cantidad</span>
            <span>Unidad</span>
            <span className="text-right">Precio/ud</span>
            <span className="text-right">Importe</span>
            <span>Estado</span>
            <span />
          </div>

          {lines.map((l) => {
            const sub = num(l.quantity) * num(l.unit_price);
            return (
              <div key={l.key} className="grid grid-cols-1 gap-2 rounded-lg border border-ink-100 bg-white p-2 sm:grid-cols-[1fr_4.5rem_3.5rem_6rem_6rem_9rem_2rem] sm:items-center sm:border-0 sm:p-0">
                <input
                  className={inputClass}
                  value={l.description}
                  onChange={(e) => setLine(l.key, { description: e.target.value })}
                  placeholder="Material / concepto"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${inputClass} text-right`}
                  value={l.quantity}
                  onChange={(e) => setLine(l.key, { quantity: e.target.value })}
                  placeholder="0"
                />
                <select
                  className={inputClass}
                  value={l.unit || "ud"}
                  onChange={(e) => setLine(l.key, { unit: e.target.value })}
                >
                  {l.unit && !UNITS.includes(l.unit) && <option value={l.unit}>{l.unit}</option>}
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${inputClass} text-right`}
                  value={l.unit_price}
                  onChange={(e) => setLine(l.key, { unit_price: e.target.value })}
                  placeholder="0,00"
                />
                <span className="text-right text-sm font-medium text-ink-800">{formatCurrency(sub)}</span>
                <select
                  className={inputClass}
                  value={l.status}
                  onChange={(e) => setLine(l.key, { status: e.target.value as OrderItemStatus })}
                  title="Estado del producto"
                >
                  {ORDER_ITEM_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeLine(l.key)}
                  className="justify-self-end rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  title="Quitar línea"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> Añadir línea
          </button>
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 rounded-xl border border-ink-200 bg-white p-4 text-sm">
        <span className="text-ink-500">Subtotal: <strong className="text-ink-800">{formatCurrency(totals.subtotal)}</strong></span>
        <span className="text-ink-500">IVA: <strong className="text-ink-800">{formatCurrency(totals.tax)}</strong></span>
        <span className="text-base text-ink-900">Total: <strong className="text-brand-700">{formatCurrency(totals.total)}</strong></span>
      </div>

      <FormSection title="Notas">
        <Field label="Notas / observaciones" full>
          <textarea rows={3} className={inputClass} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear orden"}
        </button>
      </div>
    </form>
  );
}
