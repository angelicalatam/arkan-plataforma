"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ConversationStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

// ---------------------------------------------------------------
// CONVERSACIONES
// ---------------------------------------------------------------
export async function createConversation(
  supplierId: string,
  input: { subject: string; project_id?: string | null },
): Promise<Result> {
  if (!input.subject?.trim()) return { ok: false, error: "El asunto es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_conversations")
    .insert({
      supplier_id: supplierId,
      subject: input.subject.trim(),
      project_id: input.project_id || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  if (input.project_id) revalidatePath(`/obras/${input.project_id}`);
  return { ok: true, id: data.id };
}

export async function updateConversation(
  id: string,
  supplierId: string,
  input: { subject?: string; project_id?: string | null; status?: ConversationStatus },
): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.subject !== undefined) {
    if (!input.subject.trim()) return { ok: false, error: "El asunto es obligatorio." };
    patch.subject = input.subject.trim();
  }
  if (input.project_id !== undefined) patch.project_id = input.project_id || null;
  if (input.status !== undefined) patch.status = input.status;
  const { error } = await supabase.from("supplier_conversations").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath(`/proveedores/${supplierId}/conversaciones/${id}`);
  return { ok: true, id };
}

export async function deleteConversation(id: string, supplierId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("supplier_conversations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  return { ok: true };
}

// ---------------------------------------------------------------
// NOTAS
// ---------------------------------------------------------------
async function touchConversation(conversationId: string) {
  const supabase = await createClient();
  await supabase
    .from("supplier_conversations")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", conversationId);
}

async function revalidateConversation(conversationId: string, supplierId: string) {
  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath(`/proveedores/${supplierId}/conversaciones/${conversationId}`);
  // Refrescar también la obra vinculada, si la hay.
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_conversations")
    .select("project_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (data?.project_id) revalidatePath(`/obras/${data.project_id}`);
}

export async function addNote(
  conversationId: string,
  supplierId: string,
  content: string,
): Promise<Result> {
  if (!content?.trim()) return { ok: false, error: "La nota no puede estar vacía." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversation_notes")
    .insert({ conversation_id: conversationId, content: content.trim() });
  if (error) return { ok: false, error: error.message };
  await touchConversation(conversationId);
  await revalidateConversation(conversationId, supplierId);
  return { ok: true };
}

export async function updateNote(
  id: string,
  conversationId: string,
  supplierId: string,
  content: string,
): Promise<Result> {
  if (!content?.trim()) return { ok: false, error: "La nota no puede estar vacía." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversation_notes")
    .update({ content: content.trim() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await revalidateConversation(conversationId, supplierId);
  return { ok: true };
}

export async function deleteNote(
  id: string,
  conversationId: string,
  supplierId: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("conversation_notes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await revalidateConversation(conversationId, supplierId);
  return { ok: true };
}
