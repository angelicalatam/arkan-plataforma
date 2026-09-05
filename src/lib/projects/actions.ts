"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { itemTotals } from "@/lib/quotes/types";
import type { ItemStatus, ProjectStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

// ---------------------------------------------------------------
// CONVERTIR PRESUPUESTO EN OBRA (Fase 4)
// ---------------------------------------------------------------
export async function convertQuoteToProject(quoteId: string): Promise<Result> {
  const supabase = await createClient();

  // ¿Ya existe una obra para este presupuesto? No duplicar.
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("quote_id", quoteId)
    .limit(1);
  if (existing && existing.length > 0) return { ok: true, id: existing[0].id };

  // Cargar el presupuesto completo.
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, chapters:quote_chapters(*, items:quote_items(*))")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return { ok: false, error: "No se encontró el presupuesto." };

  // Importe contratado = suma de la venta de las partidas.
  const allItems = (quote.chapters ?? []).flatMap(
    (c: { items?: unknown[] }) => c.items ?? [],
  ) as Parameters<typeof itemTotals>[0][];
  const contractValue = allItems.reduce((sum, it) => sum + itemTotals(it).lineSale, 0);

  // Numeración OBRA-000N.
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });
  const code = `OBRA-${String((count ?? 0) + 1).padStart(4, "0")}`;

  // Crear la obra.
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert(
      clean({
        code,
        name: quote.title ?? `Obra de ${code}`,
        customer_id: quote.customer_id,
        quote_id: quoteId,
        address: quote.work_address,
        contract_value: Math.round(contractValue * 100) / 100,
        status: "preparacion",
      }),
    )
    .select("id")
    .single();
  if (pErr) return { ok: false, error: pErr.message };
  const projectId = project.id;

  // Copiar capítulos y partidas.
  const chapters = (quote.chapters ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position,
  );
  for (const ch of chapters) {
    const { data: newCh, error: chErr } = await supabase
      .from("project_chapters")
      .insert({
        project_id: projectId,
        code: ch.code,
        name: ch.name,
        position: ch.position,
      })
      .select("id")
      .single();
    if (chErr) return { ok: false, error: chErr.message };

    const items = (ch.items ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position,
    );
    if (items.length > 0) {
      const rows = items.map(
        (it: {
          code: string | null;
          description: string;
          unit: string | null;
          quantity: number;
          cost_labor: number;
          cost_materials: number;
          cost_other: number;
          margin_pct: number;
          est_hours: number | null;
          est_workers: number | null;
          position: number;
        }) => ({
          project_id: projectId,
          chapter_id: newCh.id,
          code: it.code,
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          cost_labor: it.cost_labor,
          cost_materials: it.cost_materials,
          cost_other: it.cost_other,
          margin_pct: it.margin_pct,
          est_hours: it.est_hours,
          est_workers: it.est_workers,
          position: it.position,
        }),
      );
      const { error: itErr } = await supabase.from("project_items").insert(rows);
      if (itErr) return { ok: false, error: itErr.message };
    }
  }

  // Marcar el presupuesto como aceptado.
  await supabase
    .from("quotes")
    .update({ status: "aceptado", accepted_date: new Date().toISOString().slice(0, 10) })
    .eq("id", quoteId);

  revalidatePath("/obras");
  revalidatePath(`/presupuestos/${quoteId}`);
  return { ok: true, id: projectId };
}

// ---------------------------------------------------------------
// OBRA
// ---------------------------------------------------------------
export type ProjectInput = {
  name?: string | null;
  customer_id?: string | null;
  address?: string | null;
  status?: ProjectStatus;
  start_planned?: string | null;
  end_planned?: string | null;
  start_real?: string | null;
  end_real?: string | null;
  contract_value?: number | null;
  notes?: string | null;
};

export async function createProject(input: ProjectInput): Promise<Result> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });
  const code = `OBRA-${String((count ?? 0) + 1).padStart(4, "0")}`;
  const { data, error } = await supabase
    .from("projects")
    .insert(clean({ ...input, code, name: input.name || code }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/obras");
  return { ok: true, id: data.id };
}

export async function updateProject(id: string, input: ProjectInput): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = clean({ ...input });
  if (input.status === "en_ejecucion") patch.start_real ??= new Date().toISOString().slice(0, 10);
  if (input.status === "finalizada") patch.end_real ??= new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/obras");
  revalidatePath(`/obras/${id}`);
  return { ok: true, id };
}

export async function deleteProject(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/obras");
  return { ok: true };
}

export async function updateItemSchedule(
  itemId: string,
  projectId: string,
  input: { planned_start?: string | null; planned_end?: string | null },
): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.planned_start !== undefined)
    patch.planned_start = input.planned_start === "" ? null : input.planned_start;
  if (input.planned_end !== undefined)
    patch.planned_end = input.planned_end === "" ? null : input.planned_end;
  const { error } = await supabase.from("project_items").update(patch).eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/obras/${projectId}`);
  return { ok: true };
}

/** Borra las fechas manuales de todas las partidas → vuelven al reparto automático. */
export async function resetProjectSchedule(projectId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_items")
    .update({ planned_start: null, planned_end: null })
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/obras/${projectId}`);
  return { ok: true };
}

export async function updateItemProgress(
  itemId: string,
  projectId: string,
  input: { pct_done?: number; item_status?: ItemStatus; notes?: string | null },
): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.pct_done !== undefined)
    patch.pct_done = Math.max(0, Math.min(100, Number(input.pct_done) || 0));
  if (input.item_status !== undefined) patch.item_status = input.item_status;
  if (input.notes !== undefined) patch.notes = input.notes === "" ? null : input.notes;
  const { error } = await supabase.from("project_items").update(patch).eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/obras/${projectId}`);
  return { ok: true };
}
