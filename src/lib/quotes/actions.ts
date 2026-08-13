"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "./types";
import type { PriceItem } from "./bank-types";

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
