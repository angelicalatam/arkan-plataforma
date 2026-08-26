"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OPERATION_STORAGE_BUCKET, type DocType } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function revalidateOperation(supplierId: string, operationId: string, projectId?: string) {
  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath(`/proveedores/${supplierId}/operaciones/${operationId}`);
  if (projectId) revalidatePath(`/obras/${projectId}`);
}

// ---------------------------------------------------------------
// OPERACIÓN
// ---------------------------------------------------------------
export async function createOperation(
  supplierId: string,
  input: { project_id: string; title?: string | null; amount?: number | null },
): Promise<Result> {
  if (!input.project_id) return { ok: false, error: "Debes seleccionar una obra." };
  const supabase = await createClient();

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("supplier_operations")
    .select("id", { count: "exact", head: true })
    .ilike("reference", `PED-${year}-%`);
  const reference = `PED-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("supplier_operations")
    .insert({
      reference,
      supplier_id: supplierId,
      project_id: input.project_id,
      title: input.title || null,
      amount: input.amount ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await revalidateOperation(supplierId, data.id, input.project_id);
  return { ok: true, id: data.id };
}

export async function deleteOperation(id: string, supplierId: string): Promise<Result> {
  const supabase = await createClient();
  // Limpiar archivos de Storage antes de borrar la operación.
  const { data: docs } = await supabase
    .from("operation_documents")
    .select("path")
    .eq("operation_id", id);
  const paths = (docs ?? []).map((d: { path: string }) => d.path).filter(Boolean);
  if (paths.length > 0) await supabase.storage.from(OPERATION_STORAGE_BUCKET).remove(paths);

  const { error } = await supabase.from("supplier_operations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  return { ok: true };
}

// ---------------------------------------------------------------
// DOCUMENTOS (una ranura por tipo; subir = crear o reemplazar)
// ---------------------------------------------------------------
export async function upsertDocument(
  operationId: string,
  supplierId: string,
  docType: DocType,
  input: {
    name: string;
    url: string;
    path: string;
    mime_type?: string | null;
    size?: number | null;
    doc_date?: string | null;
  },
): Promise<Result> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("operation_documents")
    .select("id, path")
    .eq("operation_id", operationId)
    .eq("doc_type", docType)
    .maybeSingle();

  const values = {
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
    doc_date: input.doc_date ?? null,
  };

  let error;
  if (existing) {
    // Reemplazo: borrar el archivo anterior si cambió.
    if (existing.path && existing.path !== input.path) {
      await supabase.storage.from(OPERATION_STORAGE_BUCKET).remove([existing.path]);
    }
    ({ error } = await supabase.from("operation_documents").update(values).eq("id", existing.id));
  } else {
    ({ error } = await supabase
      .from("operation_documents")
      .insert({ operation_id: operationId, doc_type: docType, ...values }));
  }
  if (error) return { ok: false, error: error.message };

  const { data: op } = await supabase
    .from("supplier_operations")
    .select("project_id")
    .eq("id", operationId)
    .maybeSingle();
  await revalidateOperation(supplierId, operationId, op?.project_id);
  return { ok: true };
}

export async function deleteDocument(
  id: string,
  operationId: string,
  supplierId: string,
  path: string,
): Promise<Result> {
  const supabase = await createClient();
  if (path) await supabase.storage.from(OPERATION_STORAGE_BUCKET).remove([path]);
  const { error } = await supabase.from("operation_documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  const { data: op } = await supabase
    .from("supplier_operations")
    .select("project_id")
    .eq("id", operationId)
    .maybeSingle();
  await revalidateOperation(supplierId, operationId, op?.project_id);
  return { ok: true };
}
