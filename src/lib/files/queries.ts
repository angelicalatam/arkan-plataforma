import { createClient } from "@/lib/supabase/server";
import type { CustomerFile } from "./types";

/** Archivos de un cliente (fotos, vídeos, planos). */
export async function getCustomerFiles(customerId: string): Promise<CustomerFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_files")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data as CustomerFile[]) ?? [];
}
