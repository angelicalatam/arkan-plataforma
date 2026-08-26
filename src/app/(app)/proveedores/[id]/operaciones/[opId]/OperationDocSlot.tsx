"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Circle,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upsertDocument, deleteDocument } from "@/lib/operations/actions";
import {
  OPERATION_STORAGE_BUCKET,
  type DocType,
  type OperationDocument,
} from "@/lib/operations/types";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

export function OperationDocSlot({
  operationId,
  supplierId,
  docType,
  index,
  label,
  document,
}: {
  operationId: string;
  supplierId: string;
  docType: DocType;
  index: number;
  label: string;
  document?: OperationDocument;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const path = `${operationId}/${docType}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(OPERATION_STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(OPERATION_STORAGE_BUCKET).getPublicUrl(path);
      const res = await upsertDocument(operationId, supplierId, docType, {
        name: file.name,
        url: data.publicUrl,
        path,
        mime_type: file.type,
        size: file.size,
      });
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir el documento. ¿Creaste el almacén 'operaciones'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete() {
    if (!document) return;
    if (!window.confirm(`¿Eliminar el documento "${label}"?`)) return;
    const res = await deleteDocument(document.id, operationId, supplierId, document.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  const present = Boolean(document);

  return (
    <div
      className={`rounded-xl border p-4 ${
        present ? "border-green-200 bg-green-50/40" : "border-dashed border-ink-300 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-ink-500 ring-1 ring-ink-200">
            {String(index).padStart(2, "0")}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-800">{label}</p>
            {present ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                <Circle className="h-3.5 w-3.5" /> Pendiente
              </span>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {present && document && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-ink-100">
          <FileText className="h-5 w-5 shrink-0 text-ink-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink-700" title={document.name ?? ""}>
              {document.name}
            </p>
            <p className="text-xs text-ink-400">Subido: {formatDateTime(document.created_at)}</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {present && document ? (
          <>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              <ExternalLink className="h-4 w-4" /> Ver / Descargar
            </a>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Reemplazar
              <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
            </label>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          </>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir documento
            <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}
