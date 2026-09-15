"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, Package } from "lucide-react";
import { addMaterialRequest, setRequestStatus, deleteMaterialRequest } from "@/lib/materials/actions";
import { REQUEST_STATUSES, requestStatusInfo, type MaterialRequest, type RequestStatus } from "@/lib/materials/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";

type MatOption = { id: string; name: string; unit: string | null; reference_price: number; supplier_id: string | null };
type SupOption = { id: string; name: string };

export function MaterialNeeds({
  projectId,
  requests,
  materials,
  suppliers,
}: {
  projectId: string;
  requests: MaterialRequest[];
  materials: MatOption[];
  suppliers: SupOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("ud");
  const [supplierId, setSupplierId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [status, setStatus] = useState<RequestStatus>("por_pedir");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickMaterial(id: string) {
    setMaterialId(id);
    const m = materials.find((x) => x.id === id);
    if (m) {
      setName(m.name);
      if (m.unit) setUnit(m.unit);
      if (m.supplier_id) setSupplierId(m.supplier_id);
    }
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Indica el material.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await addMaterialRequest({
      project_id: projectId,
      material_id: materialId || null,
      name,
      quantity: Number(qty) || 0,
      unit,
      status,
      supplier_id: supplierId || null,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setName("");
    setQty("1");
    setUnit("ud");
    setSupplierId("");
    setMaterialId("");
    setStatus("por_pedir");
    setAdding(false);
    router.refresh();
  }

  async function onStatus(r: MaterialRequest, s: RequestStatus) {
    await setRequestStatus(r.id, projectId, s);
    router.refresh();
  }

  async function onDelete(r: MaterialRequest) {
    if (!window.confirm(`¿Eliminar "${r.name}" de la lista de materiales?`)) return;
    await deleteMaterialRequest(r.id, projectId);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Materiales necesarios"
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Añadir material
            </button>
          ) : undefined
        }
      />

      {adding && (
        <form onSubmit={onAdd} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {materials.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Elegir del catálogo (opcional)</span>
              <select className={inputClass} value={materialId} onChange={(e) => onPickMaterial(e.target.value)}>
                <option value="">— Escribir a mano —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Material *</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sacos de cemento" />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Proveedor (opcional)</span>
              <select className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">— Sin proveedor —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Cantidad</span>
              <input type="number" step="0.001" min="0" className={`${inputClass} text-right`} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Unidad</span>
              <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Estado</span>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)}>
                {REQUEST_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Añadir
            </button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-ink-400">
          Sin materiales en la lista. Añade lo que hace falta para esta obra.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
                <th className="px-4 py-2 font-semibold">Material</th>
                <th className="px-4 py-2 text-right font-semibold">Cant.</th>
                <th className="px-4 py-2 font-semibold">Proveedor</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const si = requestStatusInfo(r.status);
                return (
                  <tr key={r.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                    <td className="px-4 py-2 text-ink-800">{r.name}</td>
                    <td className="px-4 py-2 text-right text-ink-600">
                      {r.quantity} {r.unit}
                    </td>
                    <td className="px-4 py-2 text-ink-600">{r.supplier?.name || "—"}</td>
                    <td className="px-4 py-2">
                      <select
                        value={r.status}
                        onChange={(e) => onStatus(r, e.target.value as RequestStatus)}
                        className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700"
                        title="Cambiar estado"
                      >
                        {REQUEST_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <span className="ml-2 hidden sm:inline-block align-middle">
                        <Badge tone={si.tone}>{si.label}</Badge>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => onDelete(r)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
