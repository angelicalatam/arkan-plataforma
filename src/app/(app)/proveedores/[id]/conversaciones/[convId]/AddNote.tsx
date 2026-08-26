"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check, X } from "lucide-react";
import { addNote } from "@/lib/conversations/actions";
import { inputClass } from "@/components/ui/Form";

export function AddNote({
  conversationId,
  supplierId,
}: {
  conversationId: string;
  supplierId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("La nota no puede estar vacía.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await addNote(conversationId, supplierId, content);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setContent("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> Añadir nota
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <textarea
        autoFocus
        rows={3}
        className={inputClass}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe aquí la nota de la gestión…"
      />
      <p className="text-xs text-ink-400">La fecha y la hora se guardan automáticamente.</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setContent("");
            setError(null);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
        >
          <X className="h-4 w-4" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Guardar nota
        </button>
      </div>
    </form>
  );
}
