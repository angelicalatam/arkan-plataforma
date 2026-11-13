"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Loader2, Save, Plus, Trash2, Printer, Mail } from "lucide-react";
import {
  updateOrderRequest,
  deleteOrderRequest,
  type OrderRequestLineInput,
} from "@/lib/order-requests/actions";
import { CONFIRM_NOTE, type OrderRequest } from "@/lib/order-requests/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

/** Unidades de medida más habituales en reformas. */
const UNITS = [
  "ud", "m", "m²", "m³", "ml", "cm", "kg", "t", "l", "h", "día",
  "palet", "caja", "saco", "bidón", "rollo", "juego", "par", "global",
];

type Line = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  referencePrice: string;
  observations: string;
};

/** Texto a número: acepta coma o punto; vacío = 0. */
function num(v: string): number {
  const n = Number((v || "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

let counter = 0;
const newLine = (): Line => ({
  key: `r${counter++}`,
  description: "",
  quantity: "1",
  unit: "ud",
  referencePrice: "",
  observations: "",
});

export function OrderRequestForm({
  request,
  orderId,
  suppliers,
  supplierEmail,
}: {
  request: OrderRequest;
  orderId: string;
  suppliers: { id: string; name: string }[];
  supplierEmail: string;
}) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState(request.supplier_id ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(request.delivery_address ?? "");
  const [generalNotes, setGeneralNotes] = useState(request.general_notes ?? "");
  const [lines, setLines] = useState<Line[]>(
    request.items && request.items.length > 0
      ? request.items.map((it) => ({
          key: it.id,
          description: it.description,
          quantity: String(it.quantity ?? ""),
          unit: it.unit ?? "ud",
          referencePrice: it.reference_price ? String(it.reference_price) : "",
          observations: it.observations ?? "",
        }))
      : [newLine()],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);

  function touched() {
    setSaved(false);
  }
  function setLine(key: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    touched();
  }
  function addLine() {
    setLines((ls) => [...ls, newLine()]);
    touched();
  }
  function removeLine(key: string) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
    touched();
  }

  async function onSave() {
    if (!lines.some((l) => l.description.trim())) {
      setError("Añade al menos un material.");
      return;
    }
    setLoading(true);
    setError(null);
    const cleanLines: OrderRequestLineInput[] = lines.map((l) => ({
      description: l.description,
      quantity: num(l.quantity),
      unit: l.unit || "ud",
      observations: l.observations,
      reference_price: num(l.referencePrice),
    }));
    const res = await updateOrderRequest(
      request.id,
      orderId,
      {
        supplier_id: supplierId || null,
        project_id: request.project_id ?? null,
        delivery_address: deliveryAddress,
        general_notes: generalNotes,
      },
      cleanLines,
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("¿Eliminar este pedido? No afecta a la orden de compra.")) return;
    setLoading(true);
    const res = await deleteOrderRequest(request.id, orderId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/ordenes-compra/${orderId}` as Route);
    router.refresh();
  }

  function onPrepareEmail() {
    const subject = `Pedido de materiales ${request.code ?? ""} — ARKAN Reformas`.trim();
    const bodyLines = [
      "Buen día,",
      "",
      "Le escribe Angelica de ARKAN REFORMAS, S.L.",
      "Adjuntamos el pedido de materiales (documento PDF) para su gestión.",
      "",
      CONFIRM_NOTE,
      "",
      "Un cordial saludo,",
      "Angelica",
      "ARKAN REFORMAS, S.L.",
    ];
    const href =
      `mailto:${encodeURIComponent(supplierEmail)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = href;
  }

  const printHref = `/ordenes-compra/${orderId}/pedidos/${request.id}/imprimir` as Route;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Acciones principales */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onSave}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
        <a
          href={saved ? printHref : undefined}
          onClick={(e) => {
            if (!saved) {
              e.preventDefault();
              setError("Guarda los cambios antes de imprimir el PDF.");
            }
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 ${saved ? "" : "cursor-not-allowed opacity-60"}`}
        >
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </a>
        <button
          type="button"
          onClick={onPrepareEmail}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          <Mail className="h-4 w-4" />
          Preparar correo
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar pedido
          </button>
        </div>
      </div>
      {!saved && (
        <p className="text-xs text-amber-600">
          Tienes cambios sin guardar. Pulsa <strong>Guardar</strong> antes de imprimir el PDF.
        </p>
      )}

      <FormSection title="Datos del pedido">
        <Field label="Proveedor destinatario">
          <select
            className={inputClass}
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              touched();
            }}
          >
            <option value="">— Elige un proveedor —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dirección de entrega" full>
          <input
            className={inputClass}
            value={deliveryAddress}
            onChange={(e) => {
              setDeliveryAddress(e.target.value);
              touched();
            }}
            placeholder="Dónde debe entregar el proveedor"
          />
        </Field>
      </FormSection>

      <FormSection title="Materiales a solicitar">
        <div className="col-span-full space-y-2">
          <p className="text-xs text-ink-500">
            <strong>Precio ref.</strong> es el precio máximo (traído de la orden) al que el proveedor
            puede cotizar. Aparece en el PDF para orientar su oferta.
          </p>
          {/* Cabecera (escritorio) */}
          <div className="hidden gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500 sm:grid sm:grid-cols-[2rem_1fr_4.5rem_3.5rem_6rem_1fr_2rem]">
            <span>N.º</span>
            <span>Descripción</span>
            <span className="text-right">Cantidad</span>
            <span>Unidad</span>
            <span className="text-right">Precio ref.</span>
            <span>Observaciones</span>
            <span />
          </div>

          {lines.map((l, i) => (
            <div
              key={l.key}
              className="grid grid-cols-1 gap-2 rounded-lg border border-ink-100 bg-white p-2 sm:grid-cols-[2rem_1fr_4.5rem_3.5rem_6rem_1fr_2rem] sm:items-center sm:border-0 sm:p-0"
            >
              <span className="text-sm font-medium text-ink-400 sm:text-center">{i + 1}</span>
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
                value={l.referencePrice}
                onChange={(e) => setLine(l.key, { referencePrice: e.target.value })}
                placeholder="Precio máx."
                title="Precio de referencia (máximo al que puede cotizar el proveedor)"
              />
              <input
                className={inputClass}
                value={l.observations}
                onChange={(e) => setLine(l.key, { observations: e.target.value })}
                placeholder="Observaciones (opcional)"
              />
              <button
                type="button"
                onClick={() => removeLine(l.key)}
                className="justify-self-end rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                title="Quitar material"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> Añadir material
          </button>
        </div>
      </FormSection>

      <FormSection title="Observaciones generales">
        <Field label="Observaciones (aparecen al final del documento)" full>
          <textarea
            rows={3}
            className={inputClass}
            value={generalNotes}
            onChange={(e) => {
              setGeneralNotes(e.target.value);
              touched();
            }}
            placeholder="Indicaciones generales para el proveedor (opcional)"
          />
        </Field>
      </FormSection>
    </div>
  );
}
