import { createClient } from "@/lib/supabase/server";
import type { Document } from "./types";

/** Todos los documentos de la biblioteca (con su obra). */
export async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*, project:projects(id, name, code)")
    .order("created_at", { ascending: false });
  return (data as Document[]) ?? [];
}
