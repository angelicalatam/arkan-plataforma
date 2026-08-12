"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createCustomer, updateCustomer, type CustomerInput } from "@/lib/crm/actions";
import type { Customer, CrmStage, CustomerType } from "@/lib/crm/types";
import { CUSTOMER_TYPES } from "@/lib/crm/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

type Props = {
  stages: CrmStage[];
  customer?: Customer;
};

export function CustomerForm({ stages, customer }: Props) {
  const router = useRouter();
  const editing = Boolean(customer);

  const [form, setForm] = useState<CustomerInput>({
    name: customer?.name ?? "",
    type: (customer?.type as CustomerType) ?? "particular",
    tax_id: customer?.tax_id ?? "",
    phone: customer?.phone ?? "",
    whatsapp: customer?.whatsapp ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    postal_code: customer?.postal_code ?? "",
    province: customer?.province ?? "",
    contact_person: customer?.contact_person ?? "",
    contact_role: customer?.contact_role ?? "",
    lead_source: customer?.lead_source ?? "",
    stage_id: customer?.stage_id ?? stages[0]?.id ?? null,
    potential_value: customer?.potential_value ?? null,
    notes: customer?.notes ?? "",
    next_followup: customer?.next_followup ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    const payload: CustomerInput = {
      ...form,
      potential_value:
        form.potential_value === null || (form.potential_value as unknown) === ""
          ? null
          : Number(form.potential_value),
    };
    const res = editing
      ? await updateCustomer(customer!.id, payload)
      : await createCustomer(payload);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/clientes/${res.id ?? customer!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormSection title="Datos generales">
        <Field label="Nombre / Empresa" required full>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej. María López / Construcciones ABC S.L."
          />
        </Field>
        <Field label="Tipo de cliente">
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => set("type", e.target.value as CustomerType)}
          >
            {CUSTOMER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="CIF / NIF">
          <input
            className={inputClass}
            value={form.tax_id ?? ""}
            onChange={(e) => set("tax_id", e.target.value)}
          />
        </Field>
        <Field label="Persona de contacto">
          <input
            className={inputClass}
            value={form.contact_person ?? ""}
            onChange={(e) => set("contact_person", e.target.value)}
          />
        </Field>
        <Field label="Cargo">
          <input
            className={inputClass}
            value={form.contact_role ?? ""}
            onChange={(e) => set("contact_role", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Contacto">
        <Field label="Teléfono">
          <input
            className={inputClass}
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="WhatsApp">
          <input
            className={inputClass}
            value={form.whatsapp ?? ""}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </Field>
        <Field label="Email" full>
          <input
            type="email"
            className={inputClass}
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Dirección">
        <Field label="Dirección" full>
          <input
            className={inputClass}
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="Ciudad">
          <input
            className={inputClass}
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Código postal">
          <input
            className={inputClass}
            value={form.postal_code ?? ""}
            onChange={(e) => set("postal_code", e.target.value)}
          />
        </Field>
        <Field label="Provincia">
          <input
            className={inputClass}
            value={form.province ?? ""}
            onChange={(e) => set("province", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Información comercial">
        <Field label="Etapa del pipeline">
          <select
            className={inputClass}
            value={form.stage_id ?? ""}
            onChange={(e) => set("stage_id", e.target.value)}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fuente del lead">
          <input
            className={inputClass}
            value={form.lead_source ?? ""}
            onChange={(e) => set("lead_source", e.target.value)}
            placeholder="Ej. Recomendación, Web, Google…"
          />
        </Field>
        <Field label="Valor potencial (€)">
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={form.potential_value ?? ""}
            onChange={(e) =>
              set("potential_value", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>
        <Field label="Próximo seguimiento">
          <input
            type="date"
            className={inputClass}
            value={form.next_followup ?? ""}
            onChange={(e) => set("next_followup", e.target.value)}
          />
        </Field>
        <Field label="Notas" full>
          <textarea
            rows={3}
            className={inputClass}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </FormSection>

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
          {editing ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}
