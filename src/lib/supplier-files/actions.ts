"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPPLIER_FILE_BUCKET } from "./types";

type Result = { ok: true } | { ok: false; error: string };

/** Registra en la ficha un archivo ya subido a Storage. */
export async function addSupplierFile(
  supplierId: string,
  input: {
    title?: string | null;
    name: string;
    url: string;
    path: string;
    mime_type?: string | null;
    size?: number | null;
  },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("supplier_files").insert({
    supplier_id: supplierId,
    title: input.title ?? null,
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  return { ok: true };
}

export async function deleteSupplierFile(
  id: string,
  supplierId: string,
  path: string,
): Promise<Result> {
  const supabase = await createClient();
  if (path) await supabase.storage.from(SUPPLIER_FILE_BUCKET).remove([path]);
  const { error } = await supabase.from("supplier_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  return { ok: true };
}
