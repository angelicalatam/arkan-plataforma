"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Bell, Check, X, StickyNote } from "lucide-react";
import { addItemNote, updateItemNote, deleteItemNote } from "@/lib/projects/actions";
import { reminderState, type ProjectItemNote } from "@/lib/projects/types";
import { inputClass } from "@/components/ui/Form";
import { formatDate } from "@/lib/format";

export function ItemNotes({
  projectId,
  itemId,
  notes,
}: {
  projectId: string;
  itemId: string;
  notes: ProjectItemNote[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const [remindOn, setRemindOn] = useState("");
  const [loading, setLoading] = useState(false);

  const sorted = [...notes].sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await addItemNote(itemId, projectId, { content, remind_on: remindOn || null });
    setLoading(false);
    setContent("");
    setRemindOn("");
    setAdding(false);
    router.refresh();
  }

  async function onToggleDone(n: ProjectItemNote) {
    await updateItemNote(n.id, projectId, { done: !n.done });
    router.refresh();
  }

  async function onDelete(n: ProjectItemNote) {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    await deleteItemNote(n.id, projectId);
    router.refresh();
  }

  return (
    <div className="mt-2 rounded-lg border border-ink-100 bg-ink-50/50 p-3">
      {sorted.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {sorted.map((n) => {
            const rs = reminderState(n);
            return (
              <li
                key={n.id}
                className={`flex items-start gap-2 rounded-md border bg-white p-2 text-sm ${
                  rs === "vencido"
                    ? "border-red-200"
                    : rs === "hoy"
                      ? "border-amber-200"
                      : "border-ink-100"
                }`}
              >
                <button
                  onClick={() => onToggleDone(n)}
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                    n.done ? "border-green-500 bg-green-500 text-white" : "border-ink-300 text-transparent hover:border-brand-400"
                  }`}
                  title={n.done ? "Marcar como pendiente" : "Marcar como hecha"}
                >
                  <Check className="h-3 w-3" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`whitespace-pre-wrap ${n.done ? "text-ink-400 line-through" : "text-ink-800"}`}>
                    {n.content}
                  </p>
                  {n.remind_on && (
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 text-[11px] ${
                        rs === "vencido"
                          ? "text-red-600"
                          : rs === "hoy"
                            ? "text-amber-600"
                            : "text-ink-400"
                      }`}
                    >
                      <Bell className="h-3 w-3" />
                      Recordatorio: {formatDate(n.remind_on)}
                      {rs === "vencido" && " · vencido"}
                      {rs === "hoy" && " · hoy"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onDelete(n)}
                  className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <form onSubmit={onAdd} className="space-y-2">
          <textarea
            autoFocus
            rows={2}
            className={inputClass}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nota interna o recordatorio…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-ink-500">
              <Bell className="h-3.5 w-3.5" /> Recordar el:
              <input
                type="date"
                className={`${inputClass} w-auto`}
                value={remindOn}
                onChange={(e) => setRemindOn(e.target.value)}
              />
            </label>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setContent("");
                  setRemindOn("");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar nota
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" /> Añadir nota / recordatorio
        </button>
      )}
    </div>
  );
}

export function ItemNotesToggle({ count, onClick, open }: { count: number; onClick: () => void; open: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium ${
        open || count > 0 ? "text-brand-600 hover:bg-brand-50" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700"
      }`}
      title="Notas y recordatorios"
    >
      <StickyNote className="h-3.5 w-3.5" />
      {count > 0 ? count : ""}
    </button>
  );
}
