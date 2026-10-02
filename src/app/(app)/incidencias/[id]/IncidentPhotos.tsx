"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addIncidentPhoto, deleteIncidentPhoto } from "@/lib/incidents/actions";
import { INCIDENT_BUCKET, type IncidentPhoto } from "@/lib/incidents/types";
import { Card, CardHeader } from "@/components/ui/Card";

const MAX_MB = 50;

export function IncidentPhotos({
  incidentId,
  photos,
}: {
  incidentId: string;
  photos: IncidentPhoto[];
}) {
  const router = useRouter();
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
        const path = `${incidentId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(INCIDENT_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(INCIDENT_BUCKET).getPublicUrl(path);
        const res = await addIncidentPhoto(incidentId, {
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
        err instanceof Error ? err.message : "No se pudo subir. ¿Creaste el almacén 'incidencias'?",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(p: IncidentPhoto) {
    if (!window.confirm("¿Eliminar este archivo?")) return;
    const res = await deleteIncidentPhoto(p.id, incidentId, p.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={`Fotos y archivos (${photos.length})`}
        action={
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir
            <input type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={onFiles} disabled={uploading} />
          </label>
        }
      />
      <div className="p-4">
        {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        {photos.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">Sin fotos. Sube imágenes o PDF (máx. {MAX_MB} MB).</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => {
              const isImage = (p.mime_type ?? "").startsWith("image/");
              return (
                <div key={p.id} className="group relative overflow-hidden rounded-lg border border-ink-200 bg-white">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.name ?? ""} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full flex-col items-center justify-center bg-ink-50 p-2 text-center">
                        <FileText className="h-8 w-8 text-ink-400" />
                        <span className="mt-1 line-clamp-2 text-[11px] text-ink-500">{p.name}</span>
                      </div>
                    )}
                  </a>
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 shadow hover:text-brand-600" title="Abrir">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => onDelete(p)} className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 shadow hover:text-red-600" title="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
