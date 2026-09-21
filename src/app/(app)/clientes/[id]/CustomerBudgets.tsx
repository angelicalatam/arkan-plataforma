"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addCustomerFile, deleteCustomerFile } from "@/lib/files/actions";
import { FILE_BUCKET, type CustomerFile } from "@/lib/files/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

export function CustomerBudgets({
  customerId,
  files,
}: {
  customerId: string;
  files: CustomerFile[];
}) {
  const router = useRouter();
  // Sugerir el nombre de la siguiente versión.
  const [title, setTitle] = useState(`Versión ${files.length + 1}`);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...files].sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_MB} MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${customerId}/presupuesto/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(FILE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(FILE_BUCKET).getPublicUrl(path);
      const res = await addCustomerFile(customerId, {
        category: "presupuesto",
        title: title.trim() || null,
        name: file.name,
        url: data.publicUrl,
        path,
        mime_type: file.type,
        size: file.size,
      });
      if (!res.ok) throw new Error(res.error);
      setTitle(`Versión ${files.length + 2}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo subir el archivo. ¿Creaste el almacén 'clientes'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(f: CustomerFile) {
    if (!window.confirm(`¿Eliminar "${f.title || f.name}"?`)) return;
    const res = await deleteCustomerFile(f.id, customerId, f.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title={`Presupuestos enviados (${files.length})`} />

      <div className="flex flex-col gap-2 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} flex-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre / versión (ej. Versión 1)"
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir PDF
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>

      {error && <p className="px-4 pt-2 text-xs text-red-600">{error}</p>}

      {files.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-400">
          Aún no hay presupuestos. Escribe el nombre de la versión y sube el PDF.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {sorted.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-6 w-6 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{f.title || f.name}</p>
                <p className="truncate text-xs text-ink-400" title={f.name ?? ""}>
                  {f.name} · {formatDateTime(f.created_at)}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <ExternalLink className="h-4 w-4" /> Abrir
              </a>
              <button
                onClick={() => onDelete(f)}
                className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
