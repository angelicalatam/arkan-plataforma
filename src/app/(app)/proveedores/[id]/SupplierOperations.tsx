"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Plus, Loader2, X, FolderOpen } from "lucide-react";
import { createOperation } from "@/lib/operations/actions";
import type { SupplierOperation } from "@/lib/operations/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { OperationsTable } from "@/components/operations/OperationsTable";
import { inputClass } from "@/components/ui/Form";

type ProjectOption = { id: string; name: string | null; code: string | null };

export function SupplierOperations({
  supplierId,
  operations,
  projectOptions,
}: {
  supplierId: string;
  operations: SupplierOperation[];
  projectOptions: ProjectOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Debes seleccionar una obra.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createOperation(supplierId, {
      project_id: projectId,
      title: title || null,
      amount: amount === "" ? null : Number(amount),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/proveedores/${supplierId}/operaciones/${res.id}` as Route);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Documentación"
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Nueva operación
            </button>
          ) : undefined
        }
      />

      {adding && (
        <form onSubmit={onCreate} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {projectOptions.length === 0 ? (
            <p className="text-sm text-amber-700">
              Primero necesitas crear una obra (cada operación se vincula a una obra).
            </p>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-500">Obra *</span>
                <select
                  className={inputClass}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">— Selecciona una obra —</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} · ` : ""}
                      {p.name || "Obra sin nombre"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Concepto (opcional, ej. Vigas laminadas)"
                />
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Importe € (opcional)"
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setProjectId("");
                setTitle("");
                setAmount("");
                setError(null);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || projectOptions.length === 0}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
              Crear operación
            </button>
          </div>
        </form>
      )}

      <OperationsTable operations={operations} show="obra" />
    </Card>
  );
}
