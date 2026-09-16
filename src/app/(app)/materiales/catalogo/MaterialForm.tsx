"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { createMaterial, updateMaterial, type MaterialInput } from "@/lib/materials/actions";
import { materialPrices, withTax, type Material } from "@/lib/materials/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { formatCurrency } from "@/lib/format";

const CATEGORIES = [
  "Albañilería",
  "Demoliciones",
  "Pladur / Yeso laminado",
  "Escayola / Falsos techos",
  "Fontanería",
  "Saneamiento",
  "Electricidad",
  "Iluminación",
  "Climatización / Calefacción",
  "Carpintería de madera",
  "Carpintería de aluminio / PVC",
  "Cerrajería / Metalistería",
  "Vidriería",
  "Pintura",
  "Alicatado / Solado",
  "Cerámica / Porcelánico",
  "Piedra / Mármol",
  "Aislamiento",
  "Impermeabilización",
  "Cubiertas",
  "Fachadas",
  "Áridos / Cementos / Morteros",
  "Hormigón",
  "Sanitarios",
  "Griferías",
  "Mobiliario de cocina",
  "Electrodomésticos",
  "Ferretería / Tornillería",
  "Herramientas",
  "Adhesivos / Selladores",
  "Seguridad / EPIs",
  "Jardinería / Exterior",
  "Otros",
];

const PACK_FORMATS = [
  "palet",
  "caja",
  "saco",
  "bidón",
  "bote",
  "lata",
  "cartucho",
  "rollo",
  "plancha",
  "panel",
  "tubo",
  "bolsa",
  "fardo",
  "atado",
  "pack",
  "juego",
  "contenedor",
  "big bag",
];

const UNITS = [
  "ud",
  "m",
  "m²",
  "m³",
  "ml",
  "cm",
  "mm",
  "kg",
  "g",
  "t",
  "l",
  "h",
  "día",
  "palet",
  "caja",
  "saco",
  "bidón",
  "bote",
  "lata",
  "cartucho",
  "rollo",
  "plancha",
  "panel",
  "tubo",
  "bolsa",
  "juego",
  "par",
  "global",
];

export function MaterialForm({
  suppliers,
  material,
}: {
  suppliers: { id: string; name: string }[];
  material?: Material;
}) {
  const router = useRouter();
  const editing = Boolean(material);

  const [form, setForm] = useState<MaterialInput>({
    name: material?.name ?? "",
    category: material?.category ?? "",
    unit: material?.unit ?? "ud",
    supplier_id: material?.supplier_id ?? "",
    reference: material?.reference ?? "",
    notes: material?.notes ?? "",
    active: material?.active ?? true,
    pack_unit: material?.pack_unit ?? "",
    piece_unit: material?.piece_unit ?? "",
    description: material?.description ?? "",
    image_url: material?.image_url ?? null,
    product_url: material?.product_url ?? "",
  });
  const [price, setPrice] = useState(
    material?.reference_price != null && material.reference_price !== 0 ? String(material.reference_price) : "",
  );
  const [packQty, setPackQty] = useState(material?.pack_quantity != null ? String(material.pack_quantity) : "");
  const [pieces, setPieces] = useState(material?.pieces_per_pack != null ? String(material.pieces_per_pack) : "");
  const [tax, setTax] = useState(material?.tax_rate != null ? String(material.tax_rate) : "21");

  const taxRate = Number(tax) || 0;
  const prices = materialPrices({
    reference_price: Number(price) || 0,
    pack_quantity: Number(packQty) || 0,
    pieces_per_pack: Number(pieces) || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof MaterialInput>(key: K, value: MaterialInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("El nombre del material es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = {
      ...form,
      reference_price: Number(price) || 0,
      pack_quantity: packQty === "" ? null : Number(packQty),
      pieces_per_pack: pieces === "" ? null : Number(pieces),
      tax_rate: Number(tax) || 0,
    };
    const res = editing ? await updateMaterial(material!.id, payload) : await createMaterial(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/materiales/catalogo");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <FormSection title="Datos del material">
        <Field label="Foto del material" full>
          <ImageUpload value={form.image_url ?? null} onChange={(url) => set("image_url", url)} size={96} />
        </Field>
        <Field label="Nombre" required full>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Placa de pladur 15 mm" />
        </Field>
        <Field label="Descripción breve" full>
          <textarea rows={2} className={inputClass} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Ej. Panot hidráulico 20x20, acabado gris, uso exterior" />
        </Field>
        <Field label="Categoría">
          <SelectWithOther value={form.category ?? ""} onChange={(v) => set("category", v)} options={CATEGORIES} />
        </Field>
        <Field label="Unidad">
          <SelectWithOther value={form.unit ?? ""} onChange={(v) => set("unit", v)} options={UNITS} />
        </Field>
        <Field label="Precio de referencia (€)">
          <input type="number" step="0.01" min="0" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Proveedor habitual">
          <select className={inputClass} value={form.supplier_id ?? ""} onChange={(e) => set("supplier_id", e.target.value)}>
            <option value="">— Sin proveedor —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Referencia del proveedor">
          <input className={inputClass} value={form.reference ?? ""} onChange={(e) => set("reference", e.target.value)} />
        </Field>
        <Field label="Enlace al producto (web del proveedor)" full>
          <div className="flex gap-2">
            <input
              type="url"
              className={inputClass}
              value={form.product_url ?? ""}
              onChange={(e) => set("product_url", e.target.value)}
              placeholder="https://www.proveedor.com/producto…"
            />
            {form.product_url && (
              <a
                href={form.product_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-brand-700 hover:bg-ink-50"
              >
                <ExternalLink className="h-4 w-4" /> Abrir
              </a>
            )}
          </div>
        </Field>
        <Field label="Notas" full>
          <textarea rows={2} className={inputClass} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <Field label="Estado" full>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Activo (disponible para elegir en obras y compras)
          </label>
        </Field>
      </FormSection>

      <FormSection title="Presentación y precios (opcional)">
        <Field label="Formato / envase">
          <SelectWithOther value={form.pack_unit ?? ""} onChange={(v) => set("pack_unit", v)} options={PACK_FORMATS} />
        </Field>
        <Field label={`Unidades de compra por formato (${form.unit || "ud"})`}>
          <input type="number" step="0.001" min="0" className={inputClass} value={packQty} onChange={(e) => setPackQty(e.target.value)} placeholder="Ej. 23" />
        </Field>
        <Field label="Unidad de pieza">
          <SelectWithOther value={form.piece_unit ?? ""} onChange={(v) => set("piece_unit", v)} options={UNITS} />
        </Field>
        <Field label="Piezas por formato">
          <input type="number" step="0.001" min="0" className={inputClass} value={pieces} onChange={(e) => setPieces(e.target.value)} placeholder="Ej. 575" />
        </Field>
        <Field label="IVA (%)">
          <input type="number" step="0.01" min="0" className={inputClass} value={tax} onChange={(e) => setTax(e.target.value)} placeholder="21" />
        </Field>

        <div className="col-span-full overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Precios calculados</p>
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-400">
                <th className="pb-1 font-semibold"></th>
                <th className="pb-1 text-right font-semibold">Sin IVA</th>
                <th className="pb-1 text-right font-semibold">Con IVA ({taxRate}%)</th>
              </tr>
            </thead>
            <tbody className="text-ink-700">
              <PriceRow label={`Por ${form.unit || "ud"}`} base={prices.perUnit} taxRate={taxRate} />
              {prices.perPack != null && (
                <PriceRow
                  label={`Por ${form.pack_unit || "formato"}${packQty ? ` (${packQty} ${form.unit || "ud"})` : ""}`}
                  base={prices.perPack}
                  taxRate={taxRate}
                  highlight
                />
              )}
              {prices.perPiece != null && (
                <PriceRow label={`Por ${form.piece_unit || "pieza"}`} base={prices.perPiece} taxRate={taxRate} />
              )}
            </tbody>
          </table>
          {form.pack_unit && packQty && pieces && (
            <p className="mt-2 text-xs text-ink-400">
              1 {form.pack_unit} = {packQty} {form.unit || "ud"} = {pieces} {form.piece_unit || "piezas"}
            </p>
          )}
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear material"}
        </button>
      </div>
    </form>
  );
}

/** Desplegable con una opción "Otra…" que permite escribir un valor libre. */
function SelectWithOther({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [other, setOther] = useState(value !== "" && !options.includes(value));

  if (other) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el valor…"
        />
        <button
          type="button"
          onClick={() => {
            setOther(false);
            onChange("");
          }}
          className="shrink-0 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-600 hover:bg-ink-50"
          title="Volver a la lista"
        >
          Lista
        </button>
      </div>
    );
  }

  return (
    <select
      className={inputClass}
      value={options.includes(value) ? value : ""}
      onChange={(e) => {
        if (e.target.value === "__otra__") {
          setOther(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
    >
      <option value="">— Elegir —</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value="__otra__">Otra… (escribir)</option>
    </select>
  );
}

function PriceRow({
  label,
  base,
  taxRate,
  highlight,
}: {
  label: string;
  base: number;
  taxRate: number;
  highlight?: boolean;
}) {
  const withIva = withTax(base, taxRate) ?? base;
  return (
    <tr className="border-t border-ink-200/60">
      <td className="py-1 pr-3">{label}</td>
      <td className="py-1 text-right">{formatCurrency(base)}</td>
      <td className={`py-1 text-right font-semibold ${highlight ? "text-brand-700" : "text-ink-900"}`}>
        {formatCurrency(withIva)}
      </td>
    </tr>
  );
}
