/** Pedidos a proveedor generados a partir de una orden de compra. */

import type { Supplier } from "@/lib/crm/types";

export type OrderRequestItem = {
  id: string;
  request_id: string;
  description: string;
  quantity: number;
  unit: string | null;
  observations: string | null;
  reference_price: number;
  position: number;
};

export type OrderRequest = {
  id: string;
  code: string | null;
  order_id: string | null;
  supplier_id: string | null;
  project_id: string | null;
  delivery_address: string | null;
  general_notes: string | null;
  created_at: string;
  supplier?: Supplier | { id: string; name: string } | null;
  project?: { id: string; name: string | null; code: string | null } | null;
  items?: OrderRequestItem[];
};

/** Nota estándar de solicitud de confirmación al proveedor (pie del documento). */
export const CONFIRM_NOTE =
  "Rogamos confirmen disponibilidad, precio y plazo de entrega de los materiales solicitados. " +
  "Quedamos a la espera de su respuesta. Gracias.";
