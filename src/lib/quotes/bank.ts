import { createClient } from "@/lib/supabase/server";
import type { PriceItem, PriceMaterial } from "./bank-types";

/** Partidas del banco de precios (con búsqueda y filtro opcional). */
export async function getPriceItems(opts?: {
  q?: string;
  category?: string;
}): Promise<PriceItem[]> {
  const supabase = await createClient();
  let query = supabase.from("price_items").select("*").order("category").order("name");
  if (opts?.category && opts.category !== "todas") query = query.eq("category", opts.category);
  if (opts?.q) query = query.ilike("name", `%${opts.q}%`);
  const { data } = await query.limit(1000);
  return (data as PriceItem[]) ?? [];
}

/** Materiales del banco de precios. */
export async function getPriceMaterials(opts?: { q?: string }): Promise<PriceMaterial[]> {
  const supabase = await createClient();
  let query = supabase.from("price_materials").select("*").order("name");
  if (opts?.q) query = query.ilike("name", `%${opts.q}%`);
  const { data } = await query.limit(2000);
  return (data as PriceMaterial[]) ?? [];
}

/** Categorías distintas de las partidas del banco. */
export async function getBankCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("price_items").select("category");
  const set = new Set<string>();
  (data ?? []).forEach((r: { category: string | null }) => r.category && set.add(r.category));
  return Array.from(set).sort();
}
