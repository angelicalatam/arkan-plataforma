"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, StickyNote } from "lucide-react";
import { addEmployeeNote, deleteEmployeeNote } from "@/lib/team/actions";
import type { EmployeeNote } from "@/lib/team/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

export function EmployeeNotes({
  employeeId,
  notes,
}: {
  employeeId: string;
  notes: EmployeeNote[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await addEmployeeNote(employeeId, content);
    setLoading(false);
    setContent("");
    setAdding(false);
    router.refresh();
  }

  async function onDelete(n: EmployeeNote) {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    await deleteEmployeeNote(n.id, employeeId);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={`Notas internas (${notes.length})`}
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Añadir nota
            </button>
          ) : undefined
        }
      />

      {adding && (
        <form onSubmit={onAdd} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          <textarea autoFocus rows={2} className={inputClass} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nota interna…" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="submit" disabled={loading || !content.trim()} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
              Guardar nota
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-ink-400">Sin notas internas.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-ink-800">{n.content}</p>
                <p className="mt-0.5 text-xs text-ink-400">{formatDateTime(n.created_at)}</p>
              </div>
              <button onClick={() => onDelete(n)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
