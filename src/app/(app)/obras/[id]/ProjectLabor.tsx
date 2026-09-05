"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, Clock } from "lucide-react";
import { addTimeEntry, deleteTimeEntry } from "@/lib/team/actions";
import { entryCost, laborCost, totalHours, type TimeEntry } from "@/lib/team/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatCurrency, formatDate } from "@/lib/format";

type EmployeeOption = { id: string; name: string; hourly_cost: number };
type ItemOption = { id: string; code: string | null; description: string };

export function ProjectLabor({
  projectId,
  entries,
  employees,
  items,
}: {
  projectId: string;
  entries: TimeEntry[];
  employees: EmployeeOption[];
  items: ItemOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [hourlyCost, setHourlyCost] = useState(0);
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState(0);
  const [itemId, setItemId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = laborCost(entries);
  const hoursTotal = totalHours(entries);

  function onSelectEmployee(id: string) {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setHourlyCost(emp.hourly_cost);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || Number(hours) <= 0) {
      setError("Indica las horas trabajadas.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await addTimeEntry(projectId, {
      employee_id: employeeId || null,
      project_item_id: itemId || null,
      work_date: workDate,
      hours: Number(hours),
      hourly_cost: Number(hourlyCost) || 0,
      notes: notes || null,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEmployeeId("");
    setHourlyCost(0);
    setHours(0);
    setItemId("");
    setNotes("");
    setAdding(false);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("¿Eliminar este registro de horas?")) return;
    await deleteTimeEntry(id, projectId);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Mano de obra / Horas"
        action={
          !adding ? (
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

      {adding && (
        <form onSubmit={onSubmit} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {employees.length === 0 && (
            <p className="text-xs text-amber-700">
              Consejo: añade personas en “Equipo” para elegirlas aquí (o registra las horas sin
              persona indicando el coste/hora a mano).
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Persona</span>
              <select className={inputClass} value={employeeId} onChange={(e) => onSelectEmployee(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Partida (opcional)</span>
              <select className={inputClass} value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={items.length === 0}>
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
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Fecha</span>
              <input type="date" className={inputClass} value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Horas</span>
              <input type="number" step="0.25" className={`${inputClass} text-right`} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Coste/hora (€)</span>
              <input type="number" step="0.01" className={`${inputClass} text-right`} value={hourlyCost} onChange={(e) => setHourlyCost(Number(e.target.value))} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Nota (opcional)</span>
              <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>
          <div className="rounded-md bg-white px-3 py-1.5 text-xs text-ink-600">
            Coste de este registro:{" "}
            <strong className="text-brand-700">
              {formatCurrency((Number(hours) || 0) * (Number(hourlyCost) || 0))}
            </strong>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Guardar horas
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
                <th className="px-4 py-2 font-semibold">Persona</th>
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
                    {en.employee?.name || "Sin asignar"}
                    {en.item && <span className="block text-xs text-ink-400">{en.item.description}</span>}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-600">{en.hours}</td>
                  <td className="px-4 py-2 text-right font-medium text-ink-800">{formatCurrency(entryCost(en))}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => onDelete(en.id)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
