"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { importQuoteFromExcel } from "@/lib/quotes/actions";
import { inputClass, FormSection, Field } from "@/components/ui/Form";

export function ImportForm({ customers }: { customers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.(xls|xlsx|xlsm)$/i, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un archivo Excel (.xls o .xlsx).");
      return;
    }
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("title", title);
    fd.set("customer_id", customerId);
    const res = await importQuoteFromExcel(fd);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/presupuestos/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        Sube un Excel exportado desde la app de presupuestos (con las columnas
        <em> Tipo línea, Unidades, Cantidades, Precio coste…</em>). La plataforma
        creará un presupuesto nuevo en estado <strong>Borrador</strong> con sus
        capítulos y partidas. Luego podrás revisarlo y ajustarlo.
      </div>

      <FormSection title="Archivo">
        <Field label="Excel del presupuesto" full>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink-300 bg-white px-4 py-4 hover:bg-ink-50">
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-brand-600" />
            <span className="text-sm text-ink-700">
              {file ? (
                <strong>{file.name}</strong>
              ) : (
                "Haz clic para elegir un archivo .xls o .xlsx"
              )}
            </span>
            <input
              type="file"
              accept=".xls,.xlsx,.xlsm,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={onPickFile}
            />
          </label>
        </Field>

        <Field label="Título del presupuesto" full>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Reforma Edificio Cantoner"
          />
        </Field>

        <Field label="Cliente (opcional)">
          <select
            className={inputClass}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— Sin cliente —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
          disabled={loading || !file}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {loading ? "Importando…" : "Importar presupuesto"}
        </button>
      </div>
    </form>
  );
}
