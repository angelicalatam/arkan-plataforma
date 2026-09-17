"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText, Plus, X, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addDocument, deleteDocument } from "@/lib/operations/actions";
import {
  OPERATION_STORAGE_BUCKET,
  type DocType,
  type OperationDocument,
} from "@/lib/operations/types";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

export function OperationDocGroup({
  operationId,
  supplierId,
  docType,
  index,
  label,
  documents,
}: {
  operationId: string;
  supplierId: string;
  docType: DocType;
  index: number;
  label: string;
  documents: OperationDocument[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      for (const file of list) {
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(`"${file.name}" supera el límite de ${MAX_MB} MB.`);
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${operationId}/${docType}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(OPERATION_STORAGE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(OPERATION_STORAGE_BUCKET).getPublicUrl(path);
        const res = await addDocument(operationId, supplierId, docType, {
          title: list.length === 1 ? title || null : null,
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
          : "No se pudo subir el documento. ¿Creaste el almacén 'operaciones'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(doc: OperationDocument) {
    if (!window.confirm(`¿Eliminar "${doc.title || doc.name || label}"?`)) return;
    const res = await deleteDocument(doc.id, operationId, supplierId, doc.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  const present = documents.length > 0;

  return (
    <div className={`rounded-xl border p-4 ${present ? "border-green-200 bg-green-50/30" : "border-dashed border-ink-300 bg-white"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-ink-500 ring-1 ring-ink-200">
          {String(index).padStart(2, "0")}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-800">
            {label} {documents.length > 0 && <span className="text-ink-400">({documents.length})</span>}
          </p>
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

      {/* Documentos subidos */}
      {documents.length > 0 && (
        <ul className="mb-3 space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-ink-100">
              <FileText className="h-5 w-5 shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                {doc.title && <p className="truncate text-sm font-medium text-ink-800">{doc.title}</p>}
                <p className={`truncate ${doc.title ? "text-xs text-ink-400" : "text-sm text-ink-700"}`} title={doc.name ?? ""}>
                  {doc.name}
                </p>
                <p className="text-[11px] text-ink-400">Subido: {formatDateTime(doc.created_at)}</p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                title="Ver / Descargar"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => onDelete(doc)}
                className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Añadir (título opcional + archivo/s) */}
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} flex-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Concepto / título (ej. Pago inicial 12%)"
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : present ? <Plus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {present ? "Añadir" : "Subir"}
          <input type="file" multiple className="hidden" onChange={onFiles} disabled={uploading} />
        </label>
      </div>
      <p className="mt-1 text-[11px] text-ink-400">
        Puedes subir varios archivos a la vez. El título se aplica cuando subes uno solo.
      </p>
    </div>
  );
}
