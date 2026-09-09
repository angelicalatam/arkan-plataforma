import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrder } from "./types";

/** Lista de órdenes de compra (con proveedor, obra y líneas para totales). */
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(
      "*, supplier:suppliers(id, name), project:projects(id, name, code), items:purchase_order_items(quantity, unit_price)",
    )
    .order("created_at", { ascending: false });
  return (data as PurchaseOrder[]) ?? [];
}

/** Una orden de compra completa (proveedor con todos sus datos + líneas ordenadas). */
export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(
      "*, supplier:suppliers(*), project:projects(id, name, code), items:purchase_order_items(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const order = data as PurchaseOrder;
  order.items = (order.items ?? []).sort((a, b) => a.position - b.position);
  return order;
}
