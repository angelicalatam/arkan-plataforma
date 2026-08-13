import type { QuoteItemProduct } from "@/lib/products/types";

/** Tipos y cálculos de presupuestos (Fase 3). */

export type QuoteStatus =
  | "borrador"
  | "en_preparacion"
  | "enviado"
  | "en_negociacion"
  | "aceptado"
  | "rechazado"
  | "cancelado"
  | "expirado";

export const QUOTE_STATUSES: {
  value: QuoteStatus;
  label: string;
  tone: "ink" | "amber" | "blue" | "brand" | "green" | "red";
}[] = [
  { value: "borrador", label: "Borrador", tone: "ink" },
  { value: "en_preparacion", label: "En preparación", tone: "amber" },
  { value: "enviado", label: "Enviado", tone: "blue" },
  { value: "en_negociacion", label: "En negociación", tone: "brand" },
  { value: "aceptado", label: "Aceptado", tone: "green" },
  { value: "rechazado", label: "Rechazado", tone: "red" },
  { value: "cancelado", label: "Cancelado", tone: "ink" },
  { value: "expirado", label: "Expirado", tone: "red" },
];

export function statusInfo(status: string) {
  return QUOTE_STATUSES.find((s) => s.value === status) ?? QUOTE_STATUSES[0];
}

export type QuoteItem = {
  id: string;
  quote_id: string;
  chapter_id: string;
  code: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  cost_labor: number;
  cost_materials: number;
  cost_other: number;
  margin_pct: number;
  est_hours: number | null;
  est_workers: number | null;
  position: number;
  notes: string | null;
  products?: QuoteItemProduct[];
};

export type QuoteChapter = {
  id: string;
  quote_id: string;
  code: string | null;
  name: string;
  position: number;
  items?: QuoteItem[];
};

export type Quote = {
  id: string;
  code: string | null;
  title: string | null;
  customer_id: string | null;
  work_address: string | null;
  status: QuoteStatus;
  issue_date: string | null;
  sent_date: string | null;
  accepted_date: string | null;
  valid_until: string | null;
  responsible_id: string | null;
  tax_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: { id: string; name: string } | null;
  chapters?: QuoteChapter[];
};

// ---------------------------------------------------------------
// Cálculos automáticos (sección 9)
// ---------------------------------------------------------------
export type ItemTotals = {
  unitCost: number; // coste unitario
  saleUnit: number; // precio de venta unitario
  lineCost: number; // coste total de la partida
  lineSale: number; // importe (venta) de la partida
  marginEur: number;
  marginPct: number;
};

export function itemTotals(item: {
  quantity: number;
  cost_labor: number;
  cost_materials: number;
  cost_other: number;
  margin_pct: number;
}): ItemTotals {
  const unitCost =
    Number(item.cost_labor) + Number(item.cost_materials) + Number(item.cost_other);
  const qty = Number(item.quantity) || 0;
  const margin = Number(item.margin_pct) || 0;
  const saleUnit = unitCost * (1 + margin / 100);
  const lineCost = unitCost * qty;
  const lineSale = saleUnit * qty;
  const marginEur = lineSale - lineCost;
  const marginPct = lineCost > 0 ? (marginEur / lineCost) * 100 : margin;
  return { unitCost, saleUnit, lineCost, lineSale, marginEur, marginPct };
}

export type QuoteTotals = {
  cost: number;
  sale: number;
  marginEur: number;
  marginPct: number;
  tax: number;
  total: number; // venta + IVA
  itemCount: number;
};

export function quoteTotals(
  items: {
    quantity: number;
    cost_labor: number;
    cost_materials: number;
    cost_other: number;
    margin_pct: number;
  }[],
  taxRate = 21,
): QuoteTotals {
  let cost = 0;
  let sale = 0;
  for (const it of items) {
    const t = itemTotals(it);
    cost += t.lineCost;
    sale += t.lineSale;
  }
  const marginEur = sale - cost;
  const marginPct = cost > 0 ? (marginEur / cost) * 100 : 0;
  const tax = sale * (Number(taxRate) / 100);
  return {
    cost,
    sale,
    marginEur,
    marginPct,
    tax,
    total: sale + tax,
    itemCount: items.length,
  };
}
