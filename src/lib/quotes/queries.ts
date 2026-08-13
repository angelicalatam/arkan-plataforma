import { createClient } from "@/lib/supabase/server";
import type { Quote, QuoteChapter } from "./types";

/** Lista de presupuestos con cliente y partidas (para calcular totales). */
export async function getQuotes(): Promise<Quote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select(
      "*, customer:customers(id, name), chapters:quote_chapters(items:quote_items(quantity,cost_labor,cost_materials,cost_other,margin_pct))",
    )
    .order("created_at", { ascending: false });
  return (data as Quote[]) ?? [];
}

/** Un presupuesto completo (capítulos y partidas ordenados). */
export async function getQuote(id: string): Promise<Quote | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select(
      "*, customer:customers(id, name), chapters:quote_chapters(*, items:quote_items(*, products:quote_item_products(*)))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const quote = data as Quote;

  // Ordenar capítulos y partidas por posición.
  quote.chapters = (quote.chapters ?? []).sort(
    (a: QuoteChapter, b: QuoteChapter) => a.position - b.position,
  );
  for (const ch of quote.chapters) {
    ch.items = (ch.items ?? []).sort((a, b) => a.position - b.position);
    for (const it of ch.items) {
      if (it.products) it.products.sort((a, b) => a.position - b.position);
    }
  }
  return quote;
}

/** Lista ligera de clientes para selects. */
export async function getCustomerOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name")
    .order("name", { ascending: true });
  return data ?? [];
}
