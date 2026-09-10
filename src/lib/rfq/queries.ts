import { createClient } from "@/lib/supabase/server";
import type { Rfq } from "./types";

/** Peticiones de oferta de un proveedor (con sus archivos). */
export async function getSupplierRfqs(supplierId: string): Promise<Rfq[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfqs")
    .select("*, project:projects(id, name, code), files:rfq_files(*)")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  return (data as Rfq[]) ?? [];
}

/** Una petición de oferta completa. */
export async function getRfq(id: string): Promise<Rfq | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfqs")
    .select(
      "*, supplier:suppliers(id, name, email), project:projects(id, name, code), files:rfq_files(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const rfq = data as Rfq;
  rfq.files = (rfq.files ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  return rfq;
}

/**
 * Peticiones enviadas que esperan respuesta (para las alertas de seguimiento).
 * Ordenadas por fecha de seguimiento (las vencidas primero).
 */
export async function getPendingFollowUps(): Promise<Rfq[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfqs")
    .select("*, supplier:suppliers(id, name, email), project:projects(id, name, code)")
    .eq("status", "enviada")
    .order("follow_up_date", { ascending: true, nullsFirst: false });
  return (data as Rfq[]) ?? [];
}
