import { createClient } from "@/lib/supabase/server";
import type { Purchase } from "./types";

const SELECT =
  "*, supplier:suppliers(id, name), project:projects(id, name, code), item:project_items(id, description)";

/** Lista de todas las compras. */
export async function getPurchases(): Promise<Purchase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select(SELECT)
    .order("created_at", { ascending: false });
  return (data as Purchase[]) ?? [];
}

/** Una compra por id. */
export async function getPurchase(id: string): Promise<Purchase | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("purchases").select(SELECT).eq("id", id).maybeSingle();
  return (data as Purchase) ?? null;
}

/** Compras de una obra. */
export async function getProjectPurchases(projectId: string): Promise<Purchase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as Purchase[]) ?? [];
}
