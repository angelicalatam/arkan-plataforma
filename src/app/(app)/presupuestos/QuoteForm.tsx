"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createQuote, updateQuote, type QuoteInput } from "@/lib/quotes/actions";
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from "@/lib/quotes/types";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

type Props = {
  customers: { id: string; name: string }[];
  quote?: Quote;
};

export function QuoteForm({ customers, quote }: Props) {
  const router = useRouter();
  const editing = Boolean(quote);

  const [form, setForm] = useState<QuoteInput>({
    title: quote?.title ?? "",
    customer_id: quote?.customer_id ?? "",
    work_address: quote?.work_address ?? "",
    status: (quote?.status as QuoteStatus) ?? "borrador",
    issue_date: quote?.issue_date ?? new Date().toISOString().slice(0, 10),
    valid_until: quote?.valid_until ?? "",
    tax_rate: quote?.tax_rate ?? 21,
    notes: quote?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = editing
      ? await updateQuote(quote!.id, form)
      : await createQuote(form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/presupuestos/${res.id ?? quote!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormSection title="Datos del presupuesto">
        <Field label="Título" full>
          <input
            className={inputClass}
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ej. Reforma integral vivienda C/ Mayor 3"
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
        <Field label="Estado">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => set("status", e.target.value as QuoteStatus)}
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dirección de obra" full>
          <input
            className={inputClass}
            value={form.work_address ?? ""}
            onChange={(e) => set("work_address", e.target.value)}
          />
        </Field>
        <Field label="Fecha">
          <input
            type="date"
            className={inputClass}
            value={form.issue_date ?? ""}
            onChange={(e) => set("issue_date", e.target.value)}
          />
        </Field>
        <Field label="Válido hasta">
          <input
            type="date"
            className={inputClass}
            value={form.valid_until ?? ""}
            onChange={(e) => set("valid_until", e.target.value)}
          />
        </Field>
        <Field label="IVA (%)">
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={form.tax_rate ?? 21}
            onChange={(e) =>
              set("tax_rate", e.target.value === "" ? null : Number(e.target.value))
            }
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
          {editing ? "Guardar cambios" : "Crear presupuesto"}
        </button>
      </div>
    </form>
  );
}
