"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addRfqFile, deleteRfqFile } from "@/lib/rfq/actions";
import {
  PETICION_BUCKET,
  RFQ_FILE_KINDS,
  fileKindLabel,
  type RfqFile,
  type RfqFileKind,
} from "@/lib/rfq/types";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

export function RfqFiles({
  rfqId,
  supplierId,
  files,
}: {
  rfqId: string;
  supplierId: string;
  files: RfqFile[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<RfqFileKind>("plano");
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
        const path = `${rfqId}/${kind}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(PETICION_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(PETICION_BUCKET).getPublicUrl(path);
        const res = await addRfqFile(rfqId, supplierId, {
          kind,
          name: file.name,
          url: data.publicUrl,
          path,
          mime_type: file.type,
          size: file.size,
        });
        if (!res.ok) throw new Error(res.error);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir el archivo. ¿Creaste el almacén 'peticiones'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(f: RfqFile) {
    if (!window.confirm(`¿Eliminar "${f.name}"?`)) return;
    const res = await deleteRfqFile(f.id, rfqId, supplierId, f.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 border-b border-ink-100 p-4">
        <label className="flex-1 min-w-[10rem]">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Tipo de archivo</span>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as RfqFileKind)}>
            {RFQ_FILE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir archivos
          <input type="file" multiple className="hidden" onChange={onFiles} disabled={uploading} />
        </label>
      </div>
      {error && <p className="px-4 pt-2 text-xs text-red-600">{error}</p>}

      {files.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-ink-400">
          Sin archivos todavía. Sube la petición y sus planos.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
              <FileText className="h-5 w-5 shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-800" title={f.name}>
                  {f.name}
                </p>
                <p className="text-xs text-ink-400">
                  {fileKindLabel(f.kind)} · {formatDateTime(f.created_at)}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                title="Ver / Descargar"
              >
                <ExternalLink className="h-4 w-4" />
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
    </div>
  );
}
