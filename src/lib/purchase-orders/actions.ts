"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseQuoteWorkbook } from "@/lib/quotes/import";
import type { OrderStatus, OrderItemStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

export type OrderLineInput = {
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  status?: OrderItemStatus;
};

export type OrderInput = {
  supplier_id?: string | null;
  project_id?: string | null;
  status?: OrderStatus;
  order_date?: string | null;
  expected_date?: string | null;
  delivery_address?: string | null;
  payment_terms?: string | null;
  tax_rate?: number | null;
  notes?: string | null;
};

function lineRows(orderId: string, lines: OrderLineInput[]) {
  return lines
    .filter((l) => (l.description ?? "").trim() !== "")
    .map((l, i) => ({
      order_id: orderId,
      description: l.description.trim(),
      quantity: Number(l.quantity) || 0,
      unit: l.unit || "ud",
      unit_price: Number(l.unit_price) || 0,
      status: l.status ?? "pendiente",
      position: i,
    }));
}

export async function createPurchaseOrder(
  input: OrderInput,
  lines: OrderLineInput[],
): Promise<Result> {
  const supabase = await createClient();

  // Numeración OC-AAAA-NNN (por año).
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("purchase_orders")
    .select("id", { count: "exact", head: true })
    .ilike("code", `OC-${year}-%`);
  const code = `OC-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert(clean({ ...input, code }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  const orderId = data.id as string;

  const rows = lineRows(orderId, lines);
  if (rows.length > 0) {
    const { error: le } = await supabase.from("purchase_order_items").insert(rows);
    if (le) {
      await supabase.from("purchase_orders").delete().eq("id", orderId);
      return { ok: false, error: le.message };
    }
  }

  revalidatePath("/ordenes-compra");
  return { ok: true, id: orderId };
}

export async function updatePurchaseOrder(
  id: string,
  input: OrderInput,
  lines: OrderLineInput[],
): Promise<Result> {
  const supabase = await createClient();

  const { error } = await supabase.from("purchase_orders").update(clean({ ...input })).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Reemplazar las líneas.
  await supabase.from("purchase_order_items").delete().eq("order_id", id);
  const rows = lineRows(id, lines);
  if (rows.length > 0) {
    const { error: le } = await supabase.from("purchase_order_items").insert(rows);
    if (le) return { ok: false, error: le.message };
  }

  revalidatePath("/ordenes-compra");
  revalidatePath(`/ordenes-compra/${id}`);
  return { ok: true, id };
}

/**
 * Lee un Excel (el export de la app) y devuelve las líneas de material
 * para rellenar una orden de compra: una línea por PARTIDA que tenga
 * producto, nombrada con la partida, cantidad/unidad del Excel y el
 * precio/ud = coste de los productos de esa partida (editable después).
 * NO guarda nada: solo devuelve las líneas para añadirlas al formulario.
 */
export async function parseOrderLinesFromExcel(
  formData: FormData,
): Promise<{ ok: true; lines: OrderLineInput[] } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }
  let parsed;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    parsed = parseQuoteWorkbook(buf);
  } catch (e) {
    return {
      ok: false,
      error: "No se pudo leer el Excel: " + (e instanceof Error ? e.message : String(e)),
    };
  }

  const lines: OrderLineInput[] = [];
  for (const ch of parsed.chapters) {
    for (const it of ch.items) {
      // Solo partidas con producto en el Excel.
      if (!it.products || it.products.length === 0) continue;
      const nm = (it.description ?? "").trim();
      if (!nm) continue;
      lines.push({
        description: nm,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || "ud",
        unit_price: Number(it.cost_products) || 0,
      });
    }
  }

  if (lines.length === 0) {
    return { ok: false, error: "El Excel no tiene partidas con producto para traer." };
  }
  return { ok: true, lines };
}

/** Cambia el estado de seguimiento de UNA línea (pendiente/comprado/transito/llegado). */
export async function setOrderItemStatus(
  itemId: string,
  orderId: string,
  status: OrderItemStatus,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_order_items")
    .update({ status })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/ordenes-compra/${orderId}`);
  return { ok: true };
}

export async function deletePurchaseOrder(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ordenes-compra");
  return { ok: true };
}
