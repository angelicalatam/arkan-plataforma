"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendRfqEmail } from "@/lib/email/actions";
import { PETICION_BUCKET, type RfqFileKind, type RfqStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

function revalidate(supplierId: string, rfqId?: string) {
  revalidatePath(`/proveedores/${supplierId}`);
  if (rfqId) revalidatePath(`/proveedores/${supplierId}/peticiones/${rfqId}`);
  revalidatePath("/dashboard");
}

export type RfqInput = {
  project_id?: string | null;
  subject: string;
  message?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  status?: RfqStatus;
};

export async function createRfq(supplierId: string, input: RfqInput): Promise<Result> {
  if (!input.subject?.trim()) return { ok: false, error: "Indica el asunto de la petición." };
  const supabase = await createClient();

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("rfqs")
    .select("id", { count: "exact", head: true })
    .ilike("code", `PET-${year}-%`);
  const code = `PET-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("rfqs")
    .insert(clean({ ...input, code, supplier_id: supplierId, status: input.status ?? "borrador" }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidate(supplierId, data.id);
  return { ok: true, id: data.id };
}

export async function updateRfq(
  id: string,
  supplierId: string,
  input: RfqInput,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("rfqs").update(clean({ ...input })).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(supplierId, id);
  return { ok: true, id };
}

export async function setFollowUpDate(
  id: string,
  supplierId: string,
  date: string | null,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rfqs")
    .update({ follow_up_date: date || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(supplierId, id);
  return { ok: true };
}

export async function markRfqReceived(id: string, supplierId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rfqs")
    .update({ status: "recibida", response_at: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(supplierId, id);
  return { ok: true };
}

export async function deleteRfq(id: string, supplierId: string): Promise<Result> {
  const supabase = await createClient();
  const { data: files } = await supabase.from("rfq_files").select("path").eq("rfq_id", id);
  const paths = (files ?? []).map((f: { path: string }) => f.path).filter(Boolean);
  if (paths.length > 0) await supabase.storage.from(PETICION_BUCKET).remove(paths);
  const { error } = await supabase.from("rfqs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------------------------------------------------------------
// ARCHIVOS
// ---------------------------------------------------------------
export async function addRfqFile(
  rfqId: string,
  supplierId: string,
  input: {
    kind: RfqFileKind;
    name: string;
    url: string;
    path: string;
    mime_type?: string | null;
    size?: number | null;
  },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("rfq_files").insert({
    rfq_id: rfqId,
    kind: input.kind,
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidate(supplierId, rfqId);
  return { ok: true };
}

export async function deleteRfqFile(
  id: string,
  rfqId: string,
  supplierId: string,
  path: string,
): Promise<Result> {
  const supabase = await createClient();
  if (path) await supabase.storage.from(PETICION_BUCKET).remove([path]);
  const { error } = await supabase.from("rfq_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(supplierId, rfqId);
  return { ok: true };
}

// ---------------------------------------------------------------
// ENVÍO POR CORREO
// ---------------------------------------------------------------
export async function sendRfq(
  id: string,
  supplierId: string,
  input: { to: string[]; subject: string; message: string; fileIds: string[] },
): Promise<Result> {
  const supabase = await createClient();

  // Archivos seleccionados para adjuntar.
  let attachments: { filename: string; url: string }[] = [];
  if (input.fileIds.length > 0) {
    const { data: files } = await supabase
      .from("rfq_files")
      .select("id, name, url")
      .eq("rfq_id", id)
      .in("id", input.fileIds);
    attachments = (files ?? []).map((f: { name: string; url: string }) => ({
      filename: f.name,
      url: f.url,
    }));
  }

  const res = await sendRfqEmail({
    to: input.to,
    subject: input.subject,
    message: input.message,
    attachments,
  });
  if (!res.ok) return res;

  // Marcar como enviada y poner una fecha de seguimiento por defecto (+7 días)
  // si aún no tiene una.
  const { data: current } = await supabase
    .from("rfqs")
    .select("follow_up_date")
    .eq("id", id)
    .maybeSingle();
  const patch: Record<string, unknown> = {
    status: "enviada",
    sent_at: new Date().toISOString(),
  };
  if (!current?.follow_up_date) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    patch.follow_up_date = d.toISOString().slice(0, 10);
  }
  await supabase.from("rfqs").update(patch).eq("id", id);

  revalidate(supplierId, id);
  return { ok: true };
}
