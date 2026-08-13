import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";

/** Lista de productos del banco (con búsqueda/categoría opcional). */
export async function getProducts(opts?: { q?: string; category?: string }): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("category").order("name");
  if (opts?.category && opts.category !== "todas") query = query.eq("category", opts.category);
  if (opts?.q) query = query.ilike("name", `%${opts.q}%`);
  const { data } = await query.limit(2000);
  return (data as Product[]) ?? [];
}

/** Categorías distintas del banco de productos. */
export async function getProductCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category");
  const set = new Set<string>();
  (data ?? []).forEach((r: { category: string | null }) => r.category && set.add(r.category));
  return Array.from(set).sort();
}
