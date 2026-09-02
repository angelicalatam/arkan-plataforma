"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

export type PurchaseInput = {
  supplier_id?: string | null;
  project_id?: string | null;
  project_item_id?: string | null;
  material: string;
  quantity?: number;
  unit?: string | null;
  unit_price?: number;
  tax_rate?: number;
  status?: PurchaseStatus;
  order_date?: string | null;
  expected_date?: string | null;
  received_date?: string | null;
  invoice_ref?: string | null;
  notes?: string | null;
};

export async function createPurchase(input: PurchaseInput): Promise<Result> {
  if (!input.material?.trim()) return { ok: false, error: "El material es obligatorio." };
  const supabase = await createClient();

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .ilike("code", `COMP-${year}-%`);
  const code = `COMP-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("purchases")
    .insert(clean({ ...input, code }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/compras");
  if (input.project_id) revalidatePath(`/obras/${input.project_id}`);
  return { ok: true, id: data.id };
}

export async function updatePurchase(id: string, input: PurchaseInput): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("purchases").update(clean({ ...input })).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/compras");
  revalidatePath(`/compras/${id}`);
  if (input.project_id) revalidatePath(`/obras/${input.project_id}`);
  return { ok: true, id };
}

export async function deletePurchase(id: string, projectId?: string | null): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("purchases").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/compras");
  if (projectId) revalidatePath(`/obras/${projectId}`);
  return { ok: true };
}

/** Partidas de una obra, para el selector de compra (se carga al elegir obra). */
export async function searchProjectItems(
  projectId: string,
): Promise<{ id: string; code: string | null; description: string }[]> {
  if (!projectId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_items")
    .select("id, code, description")
    .eq("project_id", projectId)
    .order("position");
  return (data ?? []) as { id: string; code: string | null; description: string }[];
}
