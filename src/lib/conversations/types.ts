/** Conversaciones con proveedores y su historial de notas. */

export type ConversationStatus = "abierta" | "cerrada";

export type ConversationNote = {
  id: string;
  conversation_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null; email: string | null } | null;
};

export type SupplierConversation = {
  id: string;
  supplier_id: string;
  project_id: string | null;
  subject: string;
  status: ConversationStatus;
  last_activity_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string } | null;
  project?: { id: string; name: string | null } | null;
  notes?: ConversationNote[];
  /** Nº de notas (viene de un count agregado). */
  notes_count?: number;
};

/** Nombre visible del autor de una nota. */
export function authorName(note: ConversationNote): string {
  return note.author?.full_name || note.author?.email || "Usuario";
}
