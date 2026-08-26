"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createProject, updateProject, type ProjectInput } from "@/lib/projects/actions";
import type { Project } from "@/lib/projects/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

export function ProjectForm({
  project,
  customers,
}: {
  project?: Project;
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const editing = Boolean(project);
  const [form, setForm] = useState<ProjectInput>({
    name: project?.name ?? "",
    customer_id: project?.customer_id ?? "",
    address: project?.address ?? "",
    start_planned: project?.start_planned ?? "",
    end_planned: project?.end_planned ?? "",
    start_real: project?.start_real ?? "",
    end_real: project?.end_real ?? "",
    contract_value: project?.contract_value ?? 0,
    notes: project?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = { ...form, contract_value: Number(form.contract_value) || 0 };
    const res = editing
      ? await updateProject(project!.id, payload)
      : await createProject(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/obras/${res.id ?? project!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormSection title="Datos de la obra">
        <Field label="Nombre de la obra" full>
          <input
            className={inputClass}
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej. Reforma vivienda Calle Mayor 3"
          />
        </Field>
        <Field label="Cliente">
          <select
            className={inputClass}
            value={form.customer_id ?? ""}
            onChange={(e) => set("customer_id", e.target.value)}
          >
            <option value="">— Sin cliente —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Importe contratado (€)">
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={form.contract_value ?? 0}
            onChange={(e) => set("contract_value", e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
        <Field label="Dirección de la obra" full>
          <input className={inputClass} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Inicio previsto">
          <input type="date" className={inputClass} value={form.start_planned ?? ""} onChange={(e) => set("start_planned", e.target.value)} />
        </Field>
        <Field label="Fin previsto">
          <input type="date" className={inputClass} value={form.end_planned ?? ""} onChange={(e) => set("end_planned", e.target.value)} />
        </Field>
        <Field label="Inicio real">
          <input type="date" className={inputClass} value={form.start_real ?? ""} onChange={(e) => set("start_real", e.target.value)} />
        </Field>
        <Field label="Fin real">
          <input type="date" className={inputClass} value={form.end_real ?? ""} onChange={(e) => set("end_real", e.target.value)} />
        </Field>
        <Field label="Notas" full>
          <textarea rows={3} className={inputClass} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </FormSection>

      {!editing && (
        <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-800">
          💡 Consejo: si esta obra viene de un presupuesto aceptado, es mejor usar
          “Convertir en obra” desde el presupuesto — así se copian los capítulos y partidas
          automáticamente.
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear obra"}
        </button>
      </div>
    </form>
  );
}
