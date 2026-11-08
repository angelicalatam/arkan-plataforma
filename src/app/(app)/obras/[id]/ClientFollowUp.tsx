"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, MessageCircle } from "lucide-react";
import { addProjectClientNote, deleteProjectClientNote } from "@/lib/projects/actions";
import type { ProjectClientNote } from "@/lib/projects/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatDate } from "@/lib/format";

export function ClientFollowUp({
  projectId,
  notes,
  customerName,
}: {
  projectId: string;
  notes: ProjectClientNote[];
  customerName?: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    const res = await addProjectClientNote(projectId, { content, note_date: noteDate });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("¿Eliminar esta nota de seguimiento?")) return;
    await deleteProjectClientNote(id, projectId);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={`Seguimiento con el cliente${customerName ? ` · ${customerName}` : ""} (${notes.length})`}
      />

      <form onSubmit={onAdd} className="space-y-2 border-b border-ink-100 p-4">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <textarea
          rows={2}
          className={inputClass}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Anota una llamada, visita, acuerdo o recordatorio con el cliente…"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Fecha
            <input type="date" className={inputClass} value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
          </label>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir nota
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <MessageCircle className="h-8 w-8 text-ink-300" />
          <p className="mt-2 text-sm text-ink-400">
            Sin seguimientos con el cliente todavía. Añade el primero arriba.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-ink-800">{n.content}</p>
                <p className="mt-0.5 text-xs text-ink-400">{formatDate(n.note_date)}</p>
              </div>
              <button
                onClick={() => onDelete(n.id)}
                className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
