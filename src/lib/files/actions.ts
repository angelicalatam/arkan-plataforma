"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FILE_BUCKET, type FileCategory } from "./types";

type Result = { ok: true } | { ok: false; error: string };

/** Registra en la ficha un archivo ya subido a Storage. */
export async function addCustomerFile(
  customerId: string,
  input: {
    category: FileCategory;
    name: string;
    url: string;
    path: string;
    mime_type?: string | null;
    size?: number | null;
  },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("customer_files").insert({
    customer_id: customerId,
    category: input.category,
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clientes/${customerId}`);
  return { ok: true };
}

/** Borra un archivo del cliente (de Storage y de la base de datos). */
export async function deleteCustomerFile(
  id: string,
  customerId: string,
  path: string,
): Promise<Result> {
  const supabase = await createClient();
  await supabase.storage.from(FILE_BUCKET).remove([path]);
  const { error } = await supabase.from("customer_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clientes/${customerId}`);
  return { ok: true };
}
