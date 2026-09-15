"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, Package, HardHat } from "lucide-react";
import { addMaterialRequest, setRequestStatus, deleteMaterialRequest } from "@/lib/materials/actions";
import { REQUEST_STATUSES, requestStatusInfo, type MaterialRequest, type RequestStatus } from "@/lib/materials/types";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";

type Option = { id: string; name: string | null; code?: string | null };
type MatOption = { id: string; name: string; unit: string | null; reference_price: number; supplier_id: string | null };
type SupOption = { id: string; name: string };
type Filter = "todas" | RequestStatus;

export function MaterialsOverview({
  requests,
  projects,
  materials,
  suppliers,
}: {
  requests: MaterialRequest[];
  projects: Option[];
  materials: MatOption[];
  suppliers: SupOption[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("por_pedir");

  // Alta rápida.
  const [adding, setAdding] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("ud");
  const [supplierId, setSupplierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { todas: requests.length, por_pedir: 0, pedido: 0, recibido: 0, cancelado: 0 } as Record<string, number>;
    for (const r of requests) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [requests]);

  const filtered = useMemo(
    () => (filter === "todas" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  // Agrupar por obra.
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; projectId: string; items: MaterialRequest[] }>();
    for (const r of filtered) {
      const key = r.project_id;
      const label = r.project?.code || r.project?.name || "Obra";
      if (!map.has(key)) map.set(key, { label, projectId: key, items: [] });
      map.get(key)!.items.push(r);
    }
    return Array.from(map.values());
  }, [filtered]);

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
    if (!projectId) {
      setError("Elige la obra.");
      return;
    }
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
      supplier_id: supplierId || null,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMaterialId("");
    setName("");
    setQty("1");
    setUnit("ud");
    setSupplierId("");
    setAdding(false);
    router.refresh();
  }

  async function onStatus(r: MaterialRequest, s: RequestStatus) {
    await setRequestStatus(r.id, r.project_id, s);
    router.refresh();
  }

  async function onDelete(r: MaterialRequest) {
    if (!window.confirm(`¿Eliminar "${r.name}"?`)) return;
    await deleteMaterialRequest(r.id, r.project_id);
    router.refresh();
  }

  const tabs: { key: Filter; label: string; n: number }[] = [
    { key: "por_pedir", label: "Por pedir", n: counts.por_pedir },
    { key: "pedido", label: "Pedidos", n: counts.pedido },
    { key: "recibido", label: "Recibidos", n: counts.recibido },
    { key: "todas", label: "Todos", n: counts.todas },
  ];

  return (
    <div>
      {/* Alta rápida */}
      <div className="mb-4">
        {adding ? (
          <form onSubmit={onAdd} className="rounded-xl border border-ink-200 bg-white p-4">
            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[11px] font-medium text-ink-500">Obra *</span>
                <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">— Elige una obra —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} · ` : ""}
                      {p.name || "Obra"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-medium text-ink-500">Del catálogo (opcional)</span>
                <select className={inputClass} value={materialId} onChange={(e) => onPickMaterial(e.target.value)}>
                  <option value="">— Escribir a mano —</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-[11px] font-medium text-ink-500">Material *</span>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sacos de cemento" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label>
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Cant.</span>
                  <input type="number" step="0.001" min="0" className={`${inputClass} text-right`} value={qty} onChange={(e) => setQty(e.target.value)} />
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Ud.</span>
                  <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} />
                </label>
                <div />
              </div>
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
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(false)} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
                <X className="h-4 w-4" /> Cancelar
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                Añadir a la obra
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Añadir material a una obra
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-3 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === t.key ? "bg-brand-600 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${filter === t.key ? "text-white/80" : "text-ink-400"}`}>{t.n}</span>
          </button>
        ))}
      </div>

      {/* Lista agrupada por obra */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white px-6 py-10 text-center text-sm text-ink-400">
          No hay materiales en esta vista.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.projectId} className="overflow-hidden rounded-xl border border-ink-200 bg-white">
              <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-4 py-2">
                <HardHat className="h-4 w-4 text-ink-400" />
                <Link href={`/obras/${g.projectId}` as Route} className="text-sm font-semibold text-ink-800 hover:text-brand-700">
                  {g.label}
                </Link>
                <span className="text-xs text-ink-400">({g.items.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <tbody>
                    {g.items.map((r) => {
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
                            >
                              {REQUEST_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <span className="ml-2 hidden align-middle sm:inline-block">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
