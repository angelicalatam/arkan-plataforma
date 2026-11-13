"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export type OrderRequestLineInput = {
  description: string;
  quantity: number;
  unit: string | null;
  observations: string | null;
};

export type OrderRequestInput = {
  supplier_id?: string | null;
  project_id?: string | null;
  delivery_address?: string | null;
  general_notes?: string | null;
};

function itemRows(requestId: string, lines: OrderRequestLineInput[]) {
  return lines
    .filter((l) => (l.description ?? "").trim() !== "")
    .map((l, i) => ({
      request_id: requestId,
      description: l.description.trim(),
      quantity: Number(l.quantity) || 0,
      unit: l.unit || "ud",
      observations: (l.observations ?? "").trim() || null,
      position: i,
    }));
}

/**
 * Genera un pedido a proveedor a partir de una orden de compra:
 * copia proveedor, obra, dirección de entrega y todas las líneas de la
 * orden (descripción, cantidad, unidad). NO modifica la orden original.
 */
export async function createOrderRequestFromOrder(orderId: string): Promise<Result> {
  const supabase = await createClient();

  const { data: order, error: oe } = await supabase
    .from("purchase_orders")
    .select(
      "id, supplier_id, project_id, delivery_address, items:purchase_order_items(description, quantity, unit, position)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (oe) return { ok: false, error: oe.message };
  if (!order) return { ok: false, error: "No se encontró la orden de compra." };

  // Numeración PED-AAAA-NNN (por año).
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("order_requests")
    .select("id", { count: "exact", head: true })
    .ilike("code", `PED-${year}-%`);
  const code = `PED-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: req, error: re } = await supabase
    .from("order_requests")
    .insert({
      code,
      order_id: order.id,
      supplier_id: order.supplier_id ?? null,
      project_id: order.project_id ?? null,
      delivery_address: order.delivery_address ?? null,
      general_notes: null,
    })
    .select("id")
    .single();
  if (re) return { ok: false, error: re.message };
  const requestId = req.id as string;

  const srcItems = ((order.items ?? []) as {
    description: string;
    quantity: number;
    unit: string | null;
    position: number;
  }[])
    .slice()
    .sort((a, b) => a.position - b.position);

  const rows = itemRows(
    requestId,
    srcItems.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      observations: null,
    })),
  );
  if (rows.length > 0) {
    const { error: le } = await supabase.from("order_request_items").insert(rows);
    if (le) {
      await supabase.from("order_requests").delete().eq("id", requestId);
      return { ok: false, error: le.message };
    }
  }

  revalidatePath(`/ordenes-compra/${orderId}`);
  return { ok: true, id: requestId };
}

/** Guarda los cambios del pedido (datos + líneas). No toca la orden original. */
export async function updateOrderRequest(
  id: string,
  orderId: string | null,
  input: OrderRequestInput,
  lines: OrderRequestLineInput[],
): Promise<Result> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("order_requests")
    .update({
      supplier_id: input.supplier_id || null,
      project_id: input.project_id || null,
      delivery_address: input.delivery_address || null,
      general_notes: input.general_notes || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("order_request_items").delete().eq("request_id", id);
  const rows = itemRows(id, lines);
  if (rows.length > 0) {
    const { error: le } = await supabase.from("order_request_items").insert(rows);
    if (le) return { ok: false, error: le.message };
  }

  if (orderId) revalidatePath(`/ordenes-compra/${orderId}`);
  revalidatePath(`/ordenes-compra/${orderId ?? ""}/pedidos/${id}`);
  return { ok: true, id };
}

export async function deleteOrderRequest(id: string, orderId: string | null): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("order_requests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (orderId) revalidatePath(`/ordenes-compra/${orderId}`);
  return { ok: true };
}
