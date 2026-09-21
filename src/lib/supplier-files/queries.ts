import { createClient } from "@/lib/supabase/server";
import type { SupplierFile } from "./types";

/** Catálogos y documentos de un proveedor. */
export async function getSupplierFiles(supplierId: string): Promise<SupplierFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_files")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  return (data as SupplierFile[]) ?? [];
}
