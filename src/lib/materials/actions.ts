"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
