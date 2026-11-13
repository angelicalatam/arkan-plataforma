import { createClient } from "@/lib/supabase/server";
import type { OrderRequest } from "./types";

/** Un pedido a proveedor completo (proveedor con todos sus datos + líneas ordenadas). */
export async function getOrderRequest(id: string): Promise<OrderRequest | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_requests")
    .select(
      "*, supplier:suppliers(*), project:projects(id, name, code), items:order_request_items(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const req = data as OrderRequest;
  req.items = (req.items ?? []).sort((a, b) => a.position - b.position);
  return req;
}

/** Pedidos generados a partir de una orden (historial, recientes primero). */
export async function getOrderRequestsByOrder(orderId: string): Promise<OrderRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_requests")
    .select("*, supplier:suppliers(id, name), items:order_request_items(id)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  return (data as OrderRequest[]) ?? [];
}
