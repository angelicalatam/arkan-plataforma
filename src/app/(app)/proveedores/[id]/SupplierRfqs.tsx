"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Plus, Loader2, X, FileUp, ChevronRight, Paperclip } from "lucide-react";
import { createRfq } from "@/lib/rfq/actions";
import { rfqStatusInfo, followUpState, type Rfq } from "@/lib/rfq/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";
import { formatDate } from "@/lib/format";

type ProjectOption = { id: string; name: string | null; code: string | null };

export function SupplierRfqs({
  supplierId,
  rfqs,
  projectOptions,
}: {
  supplierId: string;
  rfqs: Rfq[];
  projectOptions: ProjectOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [subject, setSubject] = useState("");
  const [projectId, setProjectId] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Indica el asunto de la petición.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createRfq(supplierId, {
      subject,
      project_id: projectId || null,
      follow_up_date: followUp || null,
      message: message || null,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/proveedores/${supplierId}/peticiones/${res.id}` as Route);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Peticiones de oferta"
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Nueva petición
            </button>
          ) : undefined
        }
      />

      {adding && (
        <form onSubmit={onCreate} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">Asunto *</span>
            <input
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. Oferta de carpintería de aluminio — Obra Cantoner"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-500">Obra (opcional)</span>
              <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">— Sin obra —</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} · ` : ""}
                    {p.name || "Obra"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-500">Recordar seguimiento el (opcional)</span>
              <input type="date" className={inputClass} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">Nota interna (opcional)</span>
            <textarea rows={2} className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Crear y adjuntar archivos
            </button>
          </div>
        </form>
      )}

      {rfqs.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-ink-400">
          Sin peticiones de oferta. Crea una para adjuntar la petición y los planos y enviarlos por correo.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {rfqs.map((r) => {
            const si = rfqStatusInfo(r.status);
            const fu = followUpState(r);
            const fileCount = r.files?.length ?? 0;
            return (
              <li key={r.id}>
                <Link
                  href={`/proveedores/${supplierId}/peticiones/${r.id}` as Route}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-brand-700">{r.code}</span>
                      <span className="font-medium text-ink-900">{r.subject}</span>
                      <Badge tone={si.tone}>{si.label}</Badge>
                      {fu === "vencido" && <Badge tone="red">Seguimiento vencido</Badge>}
                      {fu === "hoy" && <Badge tone="amber">Seguimiento hoy</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {r.project && <>Obra: {r.project.code || r.project.name} · </>}
                      {fileCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {fileCount} archivo{fileCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {r.follow_up_date && r.status === "enviada" && (
                        <> · Seguimiento: {formatDate(r.follow_up_date)}</>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
