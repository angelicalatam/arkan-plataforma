"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, TriangleAlert } from "lucide-react";
import { addWarning, deleteWarning } from "@/lib/team/actions";
import {
  WARNING_SEVERITIES,
  warningSeverityInfo,
  type EmployeeWarning,
  type WarningSeverity,
} from "@/lib/team/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";
import { formatDate } from "@/lib/format";

export function EmployeeWarnings({
  employeeId,
  warnings,
}: {
  employeeId: string;
  warnings: EmployeeWarning[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [severity, setSeverity] = useState<WarningSeverity>("leve");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    await addWarning(employeeId, { warn_date: date, severity, reason, notes: notes || null });
    setLoading(false);
    setReason("");
    setNotes("");
    setSeverity("leve");
    setAdding(false);
    router.refresh();
  }

  async function onDelete(w: EmployeeWarning) {
    if (!window.confirm("¿Eliminar este llamado de atención?")) return;
    await deleteWarning(w.id, employeeId);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={`Llamados de atención (${warnings.length})`}
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Añadir
            </button>
          ) : undefined
        }
      />

      {adding && (
        <form onSubmit={onAdd} className="space-y-2 border-b border-ink-100 bg-brand-50/40 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Fecha</span>
              <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Gravedad</span>
              <select className={inputClass} value={severity} onChange={(e) => setSeverity(e.target.value as WarningSeverity)}>
                {WARNING_SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Motivo *</span>
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Retraso reiterado" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Detalle (opcional)</span>
            <textarea rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="submit" disabled={loading || !reason.trim()} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TriangleAlert className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </form>
      )}

      {warnings.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-ink-400">Sin llamados de atención.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {warnings.map((w) => {
            const si = warningSeverityInfo(w.severity);
            return (
              <li key={w.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{w.reason}</span>
                    <Badge tone={si.tone}>{si.label}</Badge>
                    <span className="text-xs text-ink-400">{formatDate(w.warn_date)}</span>
                  </div>
                  {w.notes && <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-600">{w.notes}</p>}
                </div>
                <button onClick={() => onDelete(w)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
