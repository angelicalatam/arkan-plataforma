"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, Clock, Pencil, Save } from "lucide-react";
import { addTimeEntry, updateTimeEntry, deleteTimeEntry } from "@/lib/team/actions";
import { entryCost, laborCost, totalHours, type TimeEntry } from "@/lib/team/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";
import { formatCurrency, formatDate } from "@/lib/format";

type EmployeeOption = { id: string; name: string; hourly_cost: number };
type SupplierOption = { id: string; name: string };
type ItemOption = { id: string; code: string | null; description: string };

// Cada línea = una partida trabajada ese día por la misma persona/proveedor.
type LaborLine = { itemId: string; hours: string; notes: string };
const emptyLine = (): LaborLine => ({ itemId: "", hours: "", notes: "" });

// "who" codifica si es trabajador (emp:ID) o proveedor (sup:ID).
function parseWho(v: string): { employee_id: string | null; supplier_id: string | null } {
  if (v.startsWith("emp:")) return { employee_id: v.slice(4), supplier_id: null };
  if (v.startsWith("sup:")) return { employee_id: null, supplier_id: v.slice(4) };
  return { employee_id: null, supplier_id: null };
}

export function ProjectLabor({
  projectId,
  entries,
  employees,
  suppliers,
  items,
}: {
  projectId: string;
  entries: TimeEntry[];
  employees: EmployeeOption[];
  suppliers: SupplierOption[];
  items: ItemOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [who, setWho] = useState("");
  // Coste/hora se guarda como texto para no forzar un "0" delante.
  const [hourlyCost, setHourlyCost] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LaborLine[]>([emptyLine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edición de un registro existente.
  const [editId, setEditId] = useState<string | null>(null);
  const [eWho, setEWho] = useState("");
  const [eCost, setECost] = useState("");
  const [eDate, setEDate] = useState("");
  const [eItem, setEItem] = useState("");
  const [eHours, setEHours] = useState("");
  const [eNotes, setENotes] = useState("");

  const cost = laborCost(entries);
  const hoursTotal = totalHours(entries);

  const rate = Number(hourlyCost) || 0;
  const previewHours = lines.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
  const previewCost = previewHours * rate;

  function onSelectWho(v: string) {
    setWho(v);
    if (v.startsWith("emp:")) {
      const emp = employees.find((e) => e.id === v.slice(4));
      if (emp) setHourlyCost(emp.hourly_cost ? String(emp.hourly_cost) : "");
    }
  }

  function updateLine(index: number, patch: Partial<LaborLine>) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, emptyLine()]);
  }
  function removeLine(index: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== index)));
  }

  function resetAdd() {
    setWho("");
    setHourlyCost("");
    setLines([emptyLine()]);
    setAdding(false);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = lines.filter((l) => (Number(l.hours) || 0) > 0);
    if (valid.length === 0) {
      setError("Indica las horas en al menos una partida.");
      return;
    }
    setLoading(true);
    setError(null);
    const { employee_id, supplier_id } = parseWho(who);
    for (const l of valid) {
      const res = await addTimeEntry(projectId, {
        employee_id,
        supplier_id,
        project_item_id: l.itemId || null,
        work_date: workDate,
        hours: Number(l.hours),
        hourly_cost: rate,
        notes: l.notes || null,
      });
      if (!res.ok) {
        setLoading(false);
        setError(res.error);
        return;
      }
    }
    setLoading(false);
    resetAdd();
    router.refresh();
  }

  function startEdit(en: TimeEntry) {
    setAdding(false);
    setError(null);
    setEditId(en.id);
    setEWho(en.employee_id ? `emp:${en.employee_id}` : en.supplier_id ? `sup:${en.supplier_id}` : "");
    setECost(en.hourly_cost ? String(en.hourly_cost) : "");
    setEDate(en.work_date);
    setEItem(en.project_item_id ?? "");
    setEHours(en.hours ? String(en.hours) : "");
    setENotes(en.notes ?? "");
  }

  function onSelectEWho(v: string) {
    setEWho(v);
    if (v.startsWith("emp:")) {
      const emp = employees.find((e) => e.id === v.slice(4));
      if (emp) setECost(emp.hourly_cost ? String(emp.hourly_cost) : "");
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    if ((Number(eHours) || 0) <= 0) {
      setError("Indica las horas de este registro.");
      return;
    }
    setLoading(true);
    setError(null);
    const { employee_id, supplier_id } = parseWho(eWho);
    const res = await updateTimeEntry(editId, projectId, {
      employee_id,
      supplier_id,
      project_item_id: eItem || null,
      work_date: eDate,
      hours: Number(eHours),
      hourly_cost: Number(eCost) || 0,
      notes: eNotes || null,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditId(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("¿Eliminar este registro de horas?")) return;
    await deleteTimeEntry(id, projectId);
    router.refresh();
  }

  // Selector de persona/proveedor reutilizable (alta y edición).
  function WhoSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Sin asignar —</option>
        {employees.length > 0 && (
          <optgroup label="Nuestro equipo">
            {employees.map((emp) => (
              <option key={emp.id} value={`emp:${emp.id}`}>
                {emp.name}
              </option>
            ))}
          </optgroup>
        )}
        {suppliers.length > 0 && (
          <optgroup label="Proveedores (outsourcing)">
            {suppliers.map((s) => (
              <option key={s.id} value={`sup:${s.id}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Mano de obra / Horas"
        action={
          !adding && !editId ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Añadir horas
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-ink-100 px-4 py-2.5 text-sm text-ink-600">
        <span>
          Total horas: <strong className="text-ink-900">{hoursTotal}</strong>
        </span>
        <span>
          Coste real de mano de obra:{" "}
          <strong className="text-ink-900">{formatCurrency(cost)}</strong>
        </span>
      </div>

      {/* Alta (varias partidas de una vez) */}
      {adding && (
        <form onSubmit={onSubmit} className="space-y-3 border-b border-ink-100 bg-brand-50/40 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Persona o proveedor</span>
              <WhoSelect value={who} onChange={onSelectWho} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Fecha</span>
              <input type="date" className={inputClass} value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Coste/hora (€)</span>
              <input type="number" step="0.01" min="0" inputMode="decimal" className={`${inputClass} text-right`} value={hourlyCost} onChange={(e) => setHourlyCost(e.target.value)} placeholder="0,00" />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Partidas trabajadas ese día
            </p>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-ink-100 bg-white p-2 sm:grid-cols-[1fr_7rem_1fr_auto] sm:items-end">
                <label>
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Partida</span>
                  <select className={inputClass} value={line.itemId} onChange={(e) => updateLine(i, { itemId: e.target.value })} disabled={items.length === 0}>
                    <option value="">— Sin partida —</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.code ? `${it.code} · ` : ""}
                        {it.description}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Horas</span>
                  <input type="number" step="0.25" min="0" inputMode="decimal" className={`${inputClass} text-right`} value={line.hours} onChange={(e) => updateLine(i, { hours: e.target.value })} placeholder="0" />
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Nota (opcional)</span>
                  <input className={inputClass} value={line.notes} onChange={(e) => updateLine(i, { notes: e.target.value })} />
                </label>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink-400"
                  title="Quitar esta partida"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
              <Plus className="h-4 w-4" /> Añadir otra partida
            </button>
          </div>

          <div className="rounded-md bg-white px-3 py-1.5 text-xs text-ink-600">
            {previewHours} h · Coste total de este registro:{" "}
            <strong className="text-brand-700">{formatCurrency(previewCost)}</strong>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetAdd} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Guardar horas
            </button>
          </div>
        </form>
      )}

      {/* Edición de un registro */}
      {editId && (
        <form onSubmit={onUpdate} className="space-y-3 border-b border-ink-100 bg-amber-50/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Editar registro</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Persona o proveedor</span>
              <WhoSelect value={eWho} onChange={onSelectEWho} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Fecha</span>
              <input type="date" className={inputClass} value={eDate} onChange={(e) => setEDate(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Coste/hora (€)</span>
              <input type="number" step="0.01" min="0" inputMode="decimal" className={`${inputClass} text-right`} value={eCost} onChange={(e) => setECost(e.target.value)} placeholder="0,00" />
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Partida</span>
              <select className={inputClass} value={eItem} onChange={(e) => setEItem(e.target.value)} disabled={items.length === 0}>
                <option value="">— Sin partida —</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.code ? `${it.code} · ` : ""}
                    {it.description}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Horas</span>
              <input type="number" step="0.25" min="0" inputMode="decimal" className={`${inputClass} text-right`} value={eHours} onChange={(e) => setEHours(e.target.value)} placeholder="0" />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Nota (opcional)</span>
              <input className={inputClass} value={eNotes} onChange={(e) => setENotes(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditId(null); setError(null); }} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-ink-400">
          Sin horas registradas para esta obra.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold">Persona / proveedor</th>
                <th className="px-4 py-2 text-right font-semibold">Horas</th>
                <th className="px-4 py-2 text-right font-semibold">Coste</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((en) => (
                <tr key={en.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-2 text-ink-600">{formatDate(en.work_date)}</td>
                  <td className="px-4 py-2 text-ink-800">
                    <span className="inline-flex items-center gap-1.5">
                      {en.employee?.name || en.supplier?.name || "Sin asignar"}
                      {en.supplier && <Badge tone="blue">Proveedor</Badge>}
                    </span>
                    {en.item && <span className="block text-xs text-ink-400">{en.item.description}</span>}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-600">{en.hours}</td>
                  <td className="px-4 py-2 text-right font-medium text-ink-800">{formatCurrency(entryCost(en))}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => startEdit(en)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDelete(en.id)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
