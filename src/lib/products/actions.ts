"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

// ---------------------------------------------------------------
// BANCO DE PRODUCTOS
// ---------------------------------------------------------------
export type ProductInput = {
  category?: string | null;
  name: string;
  brand?: string | null;
  description?: string | null;
  price?: number | null;
  reference?: string | null;
  supplier_id?: string | null;
  image_url?: string | null;
};

export async function createProduct(input: ProductInput): Promise<Result> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(clean(input))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/productos");
  return { ok: true, id: data.id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update(clean(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/productos");
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/productos");
  return { ok: true };
}

/** Búsqueda de productos para el selector (dentro de una partida). */
export async function searchProducts(term: string): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("name").limit(30);
  if (term.trim()) query = query.ilike("name", `%${term.trim()}%`);
  const { data } = await query;
  return (data as Product[]) ?? [];
}

// ---------------------------------------------------------------
// OPCIONES DE PRODUCTO EN UNA PARTIDA
// ---------------------------------------------------------------
export type ItemProductInput = {
  product_id?: string | null;
  name: string;
  brand?: string | null;
  description?: string | null;
  price?: number | null;
  reference?: string | null;
  image_url?: string | null;
  is_recommended?: boolean;
};

export async function addItemProduct(
  quoteId: string,
  quoteItemId: string,
  input: ItemProductInput,
  alsoBank = false,
): Promise<Result> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre del producto es obligatorio." };
  const supabase = await createClient();

  const { count } = await supabase
    .from("quote_item_products")
    .select("id", { count: "exact", head: true })
    .eq("quote_item_id", quoteItemId);

  const { data, error } = await supabase
    .from("quote_item_products")
    .insert(
      clean({
        quote_item_id: quoteItemId,
        product_id: input.product_id ?? null,
        name: input.name,
        brand: input.brand ?? null,
        description: input.description ?? null,
        price: input.price ?? 0,
        reference: input.reference ?? null,
        image_url: input.image_url ?? null,
        is_recommended: input.is_recommended ?? false,
        position: count ?? 0,
      }),
    )
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (alsoBank && !input.product_id) {
    // Guardar en el banco de productos (si no venía ya de él y no existe por nombre).
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .ilike("name", input.name.trim())
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("products").insert(
        clean({
          name: input.name,
          brand: input.brand ?? null,
          description: input.description ?? null,
          price: input.price ?? 0,
          reference: input.reference ?? null,
          image_url: input.image_url ?? null,
        }),
      );
      revalidatePath("/productos");
    }
  }

  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true, id: data.id };
}

export async function deleteItemProduct(id: string, quoteId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_item_products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true };
}

/** Marca una opción como recomendada (y desmarca las demás de la misma partida). */
export async function setRecommendedProduct(
  id: string,
  quoteItemId: string,
  quoteId: string,
): Promise<Result> {
  const supabase = await createClient();
  await supabase
    .from("quote_item_products")
    .update({ is_recommended: false })
    .eq("quote_item_id", quoteItemId);
  const { error } = await supabase
    .from("quote_item_products")
    .update({ is_recommended: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true };
}
