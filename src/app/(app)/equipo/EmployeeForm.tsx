"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createEmployee, updateEmployee, type EmployeeInput } from "@/lib/team/actions";
import { RELATION_TYPES, type Employee, type RelationType } from "@/lib/team/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

export function EmployeeForm({ employee }: { employee?: Employee }) {
  const router = useRouter();
  const editing = Boolean(employee);
  const [form, setForm] = useState<EmployeeInput>({
    name: employee?.name ?? "",
    role: employee?.role ?? "",
    specialty: employee?.specialty ?? "",
    relationship: (employee?.relationship as RelationType) ?? "empleado",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    hourly_cost: employee?.hourly_cost ?? 0,
    active: employee?.active ?? true,
    notes: employee?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = { ...form, hourly_cost: Number(form.hourly_cost) || 0 };
    const res = editing
      ? await updateEmployee(employee!.id, payload)
      : await createEmployee(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/equipo");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <FormSection title="Datos de la persona">
        <Field label="Nombre" required full>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Rol">
          <input className={inputClass} value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="Ej. Oficial, Peón" />
        </Field>
        <Field label="Especialidad">
          <input className={inputClass} value={form.specialty ?? ""} onChange={(e) => set("specialty", e.target.value)} placeholder="Ej. Fontanería" />
        </Field>
        <Field label="Tipo de relación">
          <select className={inputClass} value={form.relationship} onChange={(e) => set("relationship", e.target.value as RelationType)}>
            {RELATION_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Coste por hora (€)">
          <input type="number" step="0.01" className={inputClass} value={form.hourly_cost ?? 0} onChange={(e) => set("hourly_cost", e.target.value === "" ? 0 : Number(e.target.value))} />
        </Field>
        <Field label="Teléfono">
          <input className={inputClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Notas" full>
          <textarea rows={2} className={inputClass} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <Field label="Estado" full>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Activo (disponible para asignar horas)
          </label>
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear"}
        </button>
      </div>
    </form>
  );
}
