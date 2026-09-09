/** Órdenes de compra (pedido a proveedor con varias líneas). */

import type { Supplier } from "@/lib/crm/types";

export type OrderStatus =
  | "borrador"
  | "enviada"
  | "confirmada"
  | "recibida"
  | "cancelada";

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: Tone }[] = [
  { value: "borrador", label: "Borrador", tone: "ink" },
  { value: "enviada", label: "Enviada", tone: "blue" },
  { value: "confirmada", label: "Confirmada", tone: "brand" },
  { value: "recibida", label: "Recibida", tone: "green" },
  { value: "cancelada", label: "Cancelada", tone: "red" },
];

export function orderStatusInfo(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
}

export type PurchaseOrderItem = {
  id: string;
  order_id: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  position: number;
};

export type PurchaseOrder = {
  id: string;
  code: string | null;
  supplier_id: string | null;
  project_id: string | null;
  status: OrderStatus;
  order_date: string | null;
  expected_date: string | null;
  delivery_address: string | null;
  payment_terms: string | null;
  tax_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | { id: string; name: string } | null;
  project?: { id: string; name: string | null; code: string | null } | null;
  items?: PurchaseOrderItem[];
};

export type OrderTotals = { subtotal: number; tax: number; total: number };

export function lineSubtotal(it: { quantity: number; unit_price: number }): number {
  return (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
}

export function orderTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate = 21,
): OrderTotals {
  const subtotal = items.reduce((s, it) => s + lineSubtotal(it), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}
