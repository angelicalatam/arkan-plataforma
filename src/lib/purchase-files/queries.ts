import { createClient } from "@/lib/supabase/server";
import type { PurchaseFile } from "./types";

/** Documentos adjuntos de una compra (orden de compra y comprobante de pago). */
export async function getPurchaseFiles(purchaseId: string): Promise<PurchaseFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_files")
    .select("*")
    .eq("purchase_id", purchaseId)
    .order("created_at", { ascending: false });
  return (data as PurchaseFile[]) ?? [];
}
