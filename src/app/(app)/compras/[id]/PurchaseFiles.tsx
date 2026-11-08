"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addPurchaseFile, deletePurchaseFile } from "@/lib/purchase-files/actions";
import { PURCHASE_FILE_BUCKET, type PurchaseFile, type PurchaseFileKind } from "@/lib/purchase-files/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

export function PurchaseFiles({
  purchaseId,
  files,
  kind,
  title,
  emptyHint,
}: {
  purchaseId: string;
  files: PurchaseFile[];
  kind: PurchaseFileKind;
  title: string;
  emptyHint: string;
}) {
  const router = useRouter();
  const [concept, setConcept] = useState("");
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
        const path = `${purchaseId}/${kind}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(PURCHASE_FILE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(PURCHASE_FILE_BUCKET).getPublicUrl(path);
        const res = await addPurchaseFile(purchaseId, {
          kind,
          title: list.length === 1 ? concept.trim() || null : null,
          name: file.name,
          url: data.publicUrl,
          path,
          mime_type: file.type,
          size: file.size,
        });
        if (!res.ok) throw new Error(res.error);
      }
      setConcept("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir el archivo. ¿Creaste el almacén 'compras'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(f: PurchaseFile) {
    if (!window.confirm(`¿Eliminar "${f.title || f.name}"?`)) return;
    const res = await deletePurchaseFile(f.id, purchaseId, f.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title={`${title} (${files.length})`} />

      <div className="flex flex-col gap-2 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} flex-1`}
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Concepto (opcional, ej. Pago inicial 50%)"
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Adjuntar
          <input type="file" multiple className="hidden" onChange={onFiles} disabled={uploading} />
        </label>
      </div>

      {error && <p className="px-4 pt-2 text-xs text-red-600">{error}</p>}

      {files.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-400">{emptyHint}</p>
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
