"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "./types";

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

export async function deletePurchaseOrder(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ordenes-compra");
  return { ok: true };
}
