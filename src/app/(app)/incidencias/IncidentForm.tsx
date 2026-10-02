"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createIncident, updateIncident, type IncidentInput } from "@/lib/incidents/actions";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/lib/incidents/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

type Option = { id: string; name: string | null; code?: string | null };

export function IncidentForm({
  projects,
  suppliers,
  employees,
  incident,
}: {
  projects: Option[];
  suppliers: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  incident?: Incident;
}) {
  const router = useRouter();
  const editing = Boolean(incident);

  const [form, setForm] = useState<IncidentInput>({
    title: incident?.title ?? "",
    description: incident?.description ?? "",
    project_id: incident?.project_id ?? "",
    supplier_id: incident?.supplier_id ?? "",
    assignee_id: incident?.assignee_id ?? "",
    severity: (incident?.severity as IncidentSeverity) ?? "media",
    status: (incident?.status as IncidentStatus) ?? "abierta",
    incident_date: incident?.incident_date ?? new Date().toISOString().slice(0, 10),
    corrective_action: incident?.corrective_action ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof IncidentInput>(key: K, value: IncidentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) {
      setError("La incidencia necesita un título.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = editing ? await updateIncident(incident!.id, form) : await createIncident(form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(editing ? `/incidencias/${incident!.id}` : "/incidencias");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <FormSection title="Datos de la incidencia">
        <Field label="Título" required full>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej. Fuga de agua en baño 2" />
        </Field>
        <Field label="Obra">
          <select className={inputClass} value={form.project_id ?? ""} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">— Sin obra —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gravedad">
          <select className={inputClass} value={form.severity} onChange={(e) => set("severity", e.target.value as IncidentSeverity)}>
            {INCIDENT_SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as IncidentStatus)}>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" className={inputClass} value={form.incident_date ?? ""} onChange={(e) => set("incident_date", e.target.value)} />
        </Field>
        <Field label="Responsable">
          <select className={inputClass} value={form.assignee_id ?? ""} onChange={(e) => set("assignee_id", e.target.value)}>
            <option value="">— Sin asignar —</option>
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {em.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Proveedor implicado (opcional)">
          <select className={inputClass} value={form.supplier_id ?? ""} onChange={(e) => set("supplier_id", e.target.value)}>
            <option value="">— Ninguno —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción" full>
          <textarea rows={3} className={inputClass} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Qué ha pasado, dónde, cómo se detectó…" />
        </Field>
        <Field label="Acción correctiva" full>
          <textarea rows={3} className={inputClass} value={form.corrective_action ?? ""} onChange={(e) => set("corrective_action", e.target.value)} placeholder="Qué se hizo o se hará para resolverla" />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear incidencia"}
        </button>
      </div>
    </form>
  );
}
