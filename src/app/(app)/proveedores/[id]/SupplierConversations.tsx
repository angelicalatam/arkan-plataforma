"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { MessageSquare, Plus, Loader2, ChevronRight, HardHat, X } from "lucide-react";
import { createConversation } from "@/lib/conversations/actions";
import type { SupplierConversation } from "@/lib/conversations/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { inputClass } from "@/components/ui/Form";

type ProjectOption = { id: string; name: string | null; code: string | null };

export function SupplierConversations({
  supplierId,
  conversations,
  projectOptions,
}: {
  supplierId: string;
  conversations: SupplierConversation[];
  projectOptions: ProjectOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [subject, setSubject] = useState("");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      setError("El asunto es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createConversation(supplierId, {
      subject,
      project_id: projectId || null,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/proveedores/${supplierId}/conversaciones/${res.id}` as Route);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Conversaciones"
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Nueva conversación
            </button>
          ) : undefined
        }
      />

      {adding && (
        <form onSubmit={onCreate} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <input
            autoFocus
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto (ej. Cotización vigas laminadas)"
          />
          <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Sin obra vinculada —</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra sin nombre"}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setSubject("");
                setProjectId("");
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear
            </button>
          </div>
        </form>
      )}

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <MessageSquare className="h-8 w-8 text-ink-300" />
          <p className="mt-2 text-sm text-ink-400">
            Aún no hay conversaciones. Crea una para empezar a registrar el seguimiento.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/proveedores/${supplierId}/conversaciones/${c.id}` as Route}
                className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{c.subject}</span>
                    {c.status === "cerrada" && <Badge tone="ink">Cerrada</Badge>}
                    {c.project && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                        <HardHat className="h-3 w-3" />
                        {c.project.name || "Obra"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {c.notes_count ?? 0} nota{(c.notes_count ?? 0) === 1 ? "" : "s"} · Última
                    actividad: {formatDateTime(c.last_activity_at)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
