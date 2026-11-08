"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PURCHASE_FILE_BUCKET, type PurchaseFileKind } from "./types";

type Result = { ok: true } | { ok: false; error: string };

/** Registra en la compra un archivo ya subido a Storage. */
export async function addPurchaseFile(
  purchaseId: string,
  input: {
    kind?: PurchaseFileKind;
    title?: string | null;
    name: string;
    url: string;
    path: string;
    mime_type?: string | null;
    size?: number | null;
  },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_files").insert({
    purchase_id: purchaseId,
    kind: input.kind ?? "orden_compra",
    title: input.title ?? null,
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/compras/${purchaseId}/editar`);
  return { ok: true };
}

export async function deletePurchaseFile(
  id: string,
  purchaseId: string,
  path: string,
): Promise<Result> {
  const supabase = await createClient();
  if (path) await supabase.storage.from(PURCHASE_FILE_BUCKET).remove([path]);
  const { error } = await supabase.from("purchase_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/compras/${purchaseId}/editar`);
  return { ok: true };
}
