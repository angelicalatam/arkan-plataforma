import { createClient } from "@/lib/supabase/server";
import type { SupplierConversation, ConversationNote } from "./types";

type CountRow = { count: number };
function readCount(v: unknown): number {
  if (Array.isArray(v) && v.length > 0 && typeof (v[0] as CountRow).count === "number") {
    return (v[0] as CountRow).count;
  }
  return 0;
}

/** Conversaciones de un proveedor (con obra y nº de notas), última actividad primero. */
export async function getSupplierConversations(
  supplierId: string,
): Promise<SupplierConversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_conversations")
    .select("*, project:projects(id, name), notes:conversation_notes(count)")
    .eq("supplier_id", supplierId)
    .order("last_activity_at", { ascending: false });

  return (data ?? []).map((c) => ({
    ...(c as SupplierConversation),
    notes_count: readCount((c as { notes?: unknown }).notes),
  }));
}

/** Conversaciones vinculadas a una obra (con proveedor y nº de notas). */
export async function getProjectConversations(
  projectId: string,
): Promise<SupplierConversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_conversations")
    .select("*, supplier:suppliers(id, name), notes:conversation_notes(count)")
    .eq("project_id", projectId)
    .order("last_activity_at", { ascending: false });

  return (data ?? []).map((c) => ({
    ...(c as SupplierConversation),
    notes_count: readCount((c as { notes?: unknown }).notes),
  }));
}

/** Una conversación completa con su historial de notas (recientes primero). */
export async function getConversation(id: string): Promise<SupplierConversation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_conversations")
    .select(
      "*, supplier:suppliers(id, name), project:projects(id, name), notes:conversation_notes(*, author:profiles(full_name, email))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const conv = data as SupplierConversation;
  conv.notes = (conv.notes ?? []).sort(
    (a: ConversationNote, b: ConversationNote) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return conv;
}
