"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseQuoteWorkbook } from "@/lib/quotes/import";
import type { RequestStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

// ---------------------------------------------------------------
// CATÁLOGO
// ---------------------------------------------------------------
export type MaterialInput = {
  name: string;
  category?: string | null;
  unit?: string | null;
  reference_price?: number;
  supplier_id?: string | null;
  reference?: string | null;
  notes?: string | null;
  active?: boolean;
  pack_unit?: string | null;
  pack_quantity?: number | null;
  pieces_per_pack?: number | null;
  piece_unit?: string | null;
  image_url?: string | null;
  tax_rate?: number | null;
  description?: string | null;
  product_url?: string | null;
};

export async function createMaterial(input: MaterialInput): Promise<Result> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre del material es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .insert(clean({ ...input, name: input.name.trim() }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/materiales/catalogo");
  return { ok: true, id: data.id };
}

export async function updateMaterial(id: string, input: MaterialInput): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").update(clean({ ...input })).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/materiales/catalogo");
  return { ok: true, id };
}

export async function deleteMaterial(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/materiales/catalogo");
  return { ok: true };
}

// ---------------------------------------------------------------
// NECESIDADES POR OBRA
// ---------------------------------------------------------------
export type MaterialRequestInput = {
  project_id: string;
  material_id?: string | null;
  name: string;
  quantity?: number;
  unit?: string | null;
  status?: RequestStatus;
  supplier_id?: string | null;
  notes?: string | null;
};

function revalidateReq(projectId: string) {
  revalidatePath("/materiales");
  revalidatePath(`/obras/${projectId}`);
}

export async function addMaterialRequest(input: MaterialRequestInput): Promise<Result> {
  if (!input.project_id) return { ok: false, error: "Falta la obra." };
  if (!input.name?.trim()) return { ok: false, error: "Indica el material." };
  const supabase = await createClient();
  const { error } = await supabase.from("material_requests").insert(
    clean({
      project_id: input.project_id,
      material_id: input.material_id || null,
      name: input.name.trim(),
      quantity: input.quantity ?? 1,
      unit: input.unit || "ud",
      status: input.status ?? "por_pedir",
      supplier_id: input.supplier_id || null,
      notes: input.notes ?? null,
    }),
  );
  if (error) return { ok: false, error: error.message };
  revalidateReq(input.project_id);
  return { ok: true };
}

export async function updateMaterialRequest(
  id: string,
  projectId: string,
  input: Partial<MaterialRequestInput>,
): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.quantity !== undefined) patch.quantity = Number(input.quantity) || 0;
  if (input.unit !== undefined) patch.unit = input.unit || "ud";
  if (input.status !== undefined) patch.status = input.status;
  if (input.supplier_id !== undefined) patch.supplier_id = input.supplier_id || null;
  if (input.notes !== undefined) patch.notes = input.notes || null;
  const { error } = await supabase.from("material_requests").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateReq(projectId);
  return { ok: true };
}

export async function setRequestStatus(
  id: string,
  projectId: string,
  status: RequestStatus,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("material_requests").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateReq(projectId);
  return { ok: true };
}

export async function deleteMaterialRequest(id: string, projectId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("material_requests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateReq(projectId);
  return { ok: true };
}

/**
 * Trae a "Materiales necesarios" todos los productos del Excel importado
 * (azulejo, mampara, sanitario…). Empareja por nombre para no duplicar:
 * añade solo los productos que no estén ya en la lista de la obra.
 */
export async function importProductsFromExcel(
  projectId: string,
  formData: FormData,
): Promise<Result & { added?: number; skipped?: number }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }
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

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("material_requests")
    .select("name")
    .eq("project_id", projectId);
  const have = new Set(
    (existing ?? []).map((r) => String((r as { name: string | null }).name ?? "").trim().toLowerCase()),
  );

  const rows: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const ch of parsed.chapters) {
    for (const it of ch.items) {
      // Solo las partidas que tienen producto en el Excel.
      if (!it.products || it.products.length === 0) continue;
      // El material se nombra con la PARTIDA (ej. "Instalación de mampara").
      const nm = (it.description ?? "").trim();
      if (!nm) continue;
      const key = nm.toLowerCase();
      if (have.has(key)) {
        skipped++;
        continue;
      }
      have.add(key);
      rows.push({
        project_id: projectId,
        name: nm,
        quantity: it.quantity || 1,
        unit: it.unit || "ud",
        status: "por_pedir",
        notes: null,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("material_requests").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/materiales");
  revalidatePath(`/obras/${projectId}`);
  return { ok: true, added: rows.length, skipped };
}
