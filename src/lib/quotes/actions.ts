"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "./types";
import type { PriceItem } from "./bank-types";
import { parseQuoteWorkbook } from "./import";

/** Busca partidas en el banco de precios (para el selector del editor). */
export async function searchPriceItems(term: string): Promise<PriceItem[]> {
  const supabase = await createClient();
  let query = supabase.from("price_items").select("*").order("name").limit(30);
  if (term.trim()) query = query.ilike("name", `%${term.trim()}%`);
  const { data } = await query;
  return (data as PriceItem[]) ?? [];
}

/**
 * Guarda (o actualiza) una partida en el banco de precios.
 * Si ya existe una con el mismo nombre, la actualiza; si no, la crea.
 */
export async function saveToBank(input: {
  category?: string | null;
  code?: string | null;
  name: string;
  description?: string | null;
  unit?: string | null;
  cost_labor?: number;
  cost_materials?: number;
  cost_other?: number;
  margin_pct?: number;
  est_hours?: number | null;
  est_workers?: number | null;
}): Promise<Result & { created?: boolean }> {
  if (!input.name?.trim()) return { ok: false, error: "La partida no tiene nombre." };
  const supabase = await createClient();

  const row = {
    category: input.category ?? null,
    code: input.code ?? null,
    name: input.name.trim(),
    description: input.description ?? null,
    unit: input.unit ?? "ud",
    cost_labor: input.cost_labor ?? 0,
    cost_materials: input.cost_materials ?? 0,
    cost_other: input.cost_other ?? 0,
    margin_pct: input.margin_pct ?? 0,
    est_hours: input.est_hours ?? null,
    est_workers: input.est_workers ?? null,
  };

  const { data: existing } = await supabase
    .from("price_items")
    .select("id")
    .ilike("name", input.name.trim())
    .limit(1);

  let error;
  let created = false;
  if (existing && existing.length > 0) {
    ({ error } = await supabase.from("price_items").update(row).eq("id", existing[0].id));
  } else {
    ({ error } = await supabase.from("price_items").insert(row));
    created = true;
  }
  if (error) return { ok: false, error: error.message };
  revalidatePath("/banco-precios");
  return { ok: true, created };
}

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

// ---------------------------------------------------------------
// PRESUPUESTO
// ---------------------------------------------------------------
export type QuoteInput = {
  title?: string | null;
  customer_id?: string | null;
  work_address?: string | null;
  status?: QuoteStatus;
  issue_date?: string | null;
  valid_until?: string | null;
  tax_rate?: number | null;
  notes?: string | null;
};

export async function createQuote(input: QuoteInput): Promise<Result> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true });
  const code = `PRES-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("quotes")
    .insert(clean({ ...input, code }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/presupuestos");
  return { ok: true, id: data.id };
}

/**
 * Importa un presupuesto completo desde un Excel exportado por la app
 * (capítulos + partidas). Crea el presupuesto, sus capítulos y sus partidas.
 */
export async function importQuoteFromExcel(
  formData: FormData,
): Promise<
  Result & { chapters?: number; items?: number; products?: number; totalSale?: number }
> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }
  const rawTitle = (formData.get("title") as string | null)?.trim();
  const title = rawTitle || file.name.replace(/\.(xls|xlsx|xlsm)$/i, "");
  const customer_id = ((formData.get("customer_id") as string | null) || "").trim() || null;

  let parsed;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    parsed = parseQuoteWorkbook(buf);
  } catch (e) {
    return {
      ok: false,
      error: "No se pudo leer el Excel: " + (e instanceof Error ? e.message : String(e)),
    };
  }
  if (parsed.chapters.length === 0) {
    return { ok: false, error: "No se encontraron capítulos ni partidas en el Excel." };
  }

  const supabase = await createClient();

  // Número de presupuesto.
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true });
  const code = `PRES-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .insert(
      clean({
        code,
        title,
        customer_id,
        status: "borrador",
        tax_rate: 21,
        issue_date: new Date().toISOString().slice(0, 10),
        notes: `Importado desde Excel (${file.name}).`,
      }),
    )
    .select("id")
    .single();
  if (qErr) return { ok: false, error: qErr.message };
  const quoteId = quote.id as string;

  // Capítulos (inserción en bloque).
  const chapterRows = parsed.chapters.map((c, i) => ({
    quote_id: quoteId,
    name: c.name || `Capítulo ${i + 1}`,
    code: c.code,
    position: i,
  }));
  const { data: chIns, error: chErr } = await supabase
    .from("quote_chapters")
    .insert(chapterRows)
    .select("id, position");
  if (chErr) {
    await supabase.from("quotes").delete().eq("id", quoteId);
    return { ok: false, error: chErr.message };
  }
  const chapterIdByPos = new Map<number, string>();
  for (const row of chIns ?? []) {
    chapterIdByPos.set(row.position as number, row.id as string);
  }

  // Partidas (inserción en bloque).
  const itemRows: Record<string, unknown>[] = [];
  parsed.chapters.forEach((c, ci) => {
    const chapterId = chapterIdByPos.get(ci);
    if (!chapterId) return;
    c.items.forEach((it, ii) => {
      itemRows.push({
        quote_id: quoteId,
        chapter_id: chapterId,
        code: it.code,
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        cost_labor: it.cost_labor,
        cost_materials: it.cost_materials,
        cost_other: it.cost_other,
        margin_pct: it.margin_pct,
        notes: it.notes,
        position: ii,
      });
    });
  });

  let productCount = 0;
  if (itemRows.length > 0) {
    const { data: itIns, error: itErr } = await supabase
      .from("quote_items")
      .insert(itemRows)
      .select("id, chapter_id, position");
    if (itErr) {
      await supabase.from("quotes").delete().eq("id", quoteId);
      return { ok: false, error: itErr.message };
    }
    // Índice de partidas creadas por (capítulo, posición) para asignar productos.
    const itemIdByKey = new Map<string, string>();
    for (const row of itIns ?? []) {
      itemIdByKey.set(`${row.chapter_id}|${row.position}`, row.id as string);
    }

    // Opciones de producto por partida (filas "Producto" del Excel).
    const productRows: Record<string, unknown>[] = [];
    parsed.chapters.forEach((c, ci) => {
      const chapterId = chapterIdByPos.get(ci);
      if (!chapterId) return;
      c.items.forEach((it, ii) => {
        if (!it.products || it.products.length === 0) return;
        const itemId = itemIdByKey.get(`${chapterId}|${ii}`);
        if (!itemId) return;
        it.products.forEach((p, pi) => {
          productRows.push({
            quote_item_id: itemId,
            product_id: null,
            name: p.name,
            brand: null,
            description: p.description,
            cost: p.cost,
            margin_pct: p.margin_pct,
            price: p.price,
            reference: null,
            image_url: null,
            is_recommended: pi === 0, // el producto incluido queda recomendado
            position: pi,
          });
        });
      });
    });
    if (productRows.length > 0) {
      const { error: prErr } = await supabase
        .from("quote_item_products")
        .insert(productRows);
      // Si fallara, no abortamos el presupuesto: las partidas ya son correctas.
      if (!prErr) productCount = productRows.length;
    }
  }

  revalidatePath("/presupuestos");
  return {
    ok: true,
    id: quoteId,
    chapters: parsed.chapters.length,
    items: itemRows.length,
    products: productCount,
    totalSale: parsed.totalSale,
  };
}

export async function updateQuote(id: string, input: QuoteInput): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = clean({ ...input });
  // Fechas automáticas según estado.
  if (input.status === "enviado") patch.sent_date = new Date().toISOString().slice(0, 10);
  if (input.status === "aceptado")
    patch.accepted_date = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("quotes").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  return { ok: true, id };
}

export async function deleteQuote(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/presupuestos");
  return { ok: true };
}

// ---------------------------------------------------------------
// CAPÍTULOS
// ---------------------------------------------------------------
export async function addChapter(
  quoteId: string,
  name: string,
  code?: string,
): Promise<Result> {
  if (!name.trim()) return { ok: false, error: "El nombre del capítulo es obligatorio." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("quote_chapters")
    .select("id", { count: "exact", head: true })
    .eq("quote_id", quoteId);
  const { data, error } = await supabase
    .from("quote_chapters")
    .insert(clean({ quote_id: quoteId, name, code: code ?? null, position: count ?? 0 }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true, id: data.id };
}

export async function updateChapter(
  id: string,
  quoteId: string,
  patch: { name?: string; code?: string | null },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_chapters").update(clean(patch)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true, id };
}

export async function deleteChapter(id: string, quoteId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_chapters").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true };
}

// ---------------------------------------------------------------
// PARTIDAS
// ---------------------------------------------------------------
export type ItemInput = {
  code?: string | null;
  description: string;
  unit?: string | null;
  quantity?: number;
  cost_labor?: number;
  cost_materials?: number;
  cost_other?: number;
  margin_pct?: number;
  est_hours?: number | null;
  est_workers?: number | null;
  notes?: string | null;
};

export async function addItem(
  quoteId: string,
  chapterId: string,
  input: ItemInput,
): Promise<Result> {
  if (!input.description?.trim())
    return { ok: false, error: "La descripción de la partida es obligatoria." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("quote_items")
    .select("id", { count: "exact", head: true })
    .eq("chapter_id", chapterId);
  const { data, error } = await supabase
    .from("quote_items")
    .insert(
      clean({
        quote_id: quoteId,
        chapter_id: chapterId,
        code: input.code ?? null,
        description: input.description,
        unit: input.unit ?? "ud",
        quantity: input.quantity ?? 1,
        cost_labor: input.cost_labor ?? 0,
        cost_materials: input.cost_materials ?? 0,
        cost_other: input.cost_other ?? 0,
        margin_pct: input.margin_pct ?? 0,
        est_hours: input.est_hours ?? null,
        est_workers: input.est_workers ?? null,
        notes: input.notes ?? null,
        position: count ?? 0,
      }),
    )
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true, id: data.id };
}

export async function updateItem(
  id: string,
  quoteId: string,
  input: ItemInput,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_items").update(clean({ ...input })).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true, id };
}

export async function deleteItem(id: string, quoteId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true };
}
