"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Check, X, User } from "lucide-react";
import { updateNote, deleteNote } from "@/lib/conversations/actions";
import { authorName, type ConversationNote } from "@/lib/conversations/types";
import { formatDateTime } from "@/lib/format";
import { inputClass } from "@/components/ui/Form";

export function NoteItem({
  note,
  conversationId,
  supplierId,
}: {
  note: ConversationNote;
  conversationId: string;
  supplierId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edited = note.updated_at && note.updated_at !== note.created_at;

  async function onSave() {
    if (!content.trim()) {
      setError("La nota no puede estar vacía.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await updateNote(note.id, conversationId, supplierId, content);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function onDelete() {
    if (!window.confirm("¿Estás segura de que quieres eliminar esta nota?")) return;
    setLoading(true);
    const res = await deleteNote(note.id, conversationId, supplierId);
    if (!res.ok) {
      setLoading(false);
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <li className="relative border-l-2 border-ink-100 pl-4">
      <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">{formatDateTime(note.created_at)}</span>
          <span className="mx-1.5">·</span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {authorName(note)}
          </span>
          {edited && <span className="ml-1.5 italic text-ink-400">(editada)</span>}
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={loading}
              className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-1.5 space-y-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <textarea
            autoFocus
            rows={3}
            className={inputClass}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setContent(note.content);
                setError(null);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{note.content}</p>
      )}
    </li>
  );
}
