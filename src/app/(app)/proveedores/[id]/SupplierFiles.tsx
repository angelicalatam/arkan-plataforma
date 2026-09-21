"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addSupplierFile, deleteSupplierFile } from "@/lib/supplier-files/actions";
import { SUPPLIER_FILE_BUCKET, type SupplierFile } from "@/lib/supplier-files/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

export function SupplierFiles({
  supplierId,
  files,
}: {
  supplierId: string;
  files: SupplierFile[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      for (const file of list) {
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(`"${file.name}" supera el límite de ${MAX_MB} MB.`);
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${supplierId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(SUPPLIER_FILE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(SUPPLIER_FILE_BUCKET).getPublicUrl(path);
        const res = await addSupplierFile(supplierId, {
          title: list.length === 1 ? title.trim() || null : null,
          name: file.name,
          url: data.publicUrl,
          path,
          mime_type: file.type,
          size: file.size,
        });
        if (!res.ok) throw new Error(res.error);
      }
      setTitle("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir el archivo. ¿Creaste el almacén 'proveedores'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(f: SupplierFile) {
    if (!window.confirm(`¿Eliminar "${f.title || f.name}"?`)) return;
    const res = await deleteSupplierFile(f.id, supplierId, f.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title={`Catálogos y documentos (${files.length})`} />

      <div className="flex flex-col gap-2 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} flex-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre / concepto (ej. Catálogo 2026, Tarifa, Ficha técnica)"
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir archivo
          <input type="file" multiple className="hidden" onChange={onFiles} disabled={uploading} />
        </label>
      </div>

      {error && <p className="px-4 pt-2 text-xs text-red-600">{error}</p>}

      {files.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-400">
          Sin catálogos ni documentos. Sube PDF u otros archivos (máx. {MAX_MB} MB).
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-6 w-6 shrink-0 text-ink-400" />
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
