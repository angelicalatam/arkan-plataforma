/** Compras / materiales (Fase 6). */

export type PurchaseStatus =
  | "pendiente"
  | "solicitado"
  | "pedido"
  | "en_transito"
  | "recibido"
  | "parcial"
  | "cancelado";

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export const PURCHASE_STATUSES: { value: PurchaseStatus; label: string; tone: Tone }[] = [
  { value: "pendiente", label: "Pendiente", tone: "ink" },
  { value: "solicitado", label: "Solicitado", tone: "blue" },
  { value: "pedido", label: "Pedido", tone: "brand" },
  { value: "en_transito", label: "En tránsito", tone: "amber" },
  { value: "parcial", label: "Parcialmente recibido", tone: "amber" },
  { value: "recibido", label: "Recibido", tone: "green" },
  { value: "cancelado", label: "Cancelado", tone: "red" },
];

export function purchaseStatusInfo(status: string) {
  return PURCHASE_STATUSES.find((s) => s.value === status) ?? PURCHASE_STATUSES[0];
}

export type Purchase = {
  id: string;
  code: string | null;
  supplier_id: string | null;
  project_id: string | null;
  project_item_id: string | null;
  material: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  tax_rate: number;
  status: PurchaseStatus;
  order_date: string | null;
  expected_date: string | null;
  received_date: string | null;
  invoice_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string } | null;
  project?: { id: string; name: string | null; code: string | null } | null;
  item?: { id: string; description: string } | null;
};

export type PurchaseTotals = { subtotal: number; tax: number; total: number };

export function purchaseTotals(p: {
  quantity: number;
  unit_price: number;
  tax_rate: number;
}): PurchaseTotals {
  const subtotal = (Number(p.quantity) || 0) * (Number(p.unit_price) || 0);
  const tax = subtotal * ((Number(p.tax_rate) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

/** Suma de subtotales (coste sin IVA) de una lista de compras. */
export function purchasesCost(purchases: { quantity: number; unit_price: number }[]): number {
  return purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unit_price) || 0), 0);
}
