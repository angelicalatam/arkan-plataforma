"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  Trash2,
  FileText,
  ExternalLink,
  Camera,
  Video,
  Map,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addCustomerFile, deleteCustomerFile } from "@/lib/files/actions";
import { FILE_BUCKET, type CustomerFile, type FileCategory } from "@/lib/files/types";
import { Card, CardHeader } from "@/components/ui/Card";

const MAX_MB = 50;

const ICONS: Record<FileCategory, LucideIcon> = {
  foto: Camera,
  video: Video,
  plano: Map,
  otro: FileText,
};

export function CustomerFileSection({
  customerId,
  category,
  title,
  accept,
  files,
}: {
  customerId: string;
  category: FileCategory;
  title: string;
  accept: string;
  files: CustomerFile[];
}) {
  const router = useRouter();
  const Icon = ICONS[category] ?? FileText;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    const supabase = createClient();

    for (const file of list) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`"${file.name}" supera el límite de ${MAX_MB} MB.`);
        continue;
      }
      try {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${customerId}/${category}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(FILE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(FILE_BUCKET).getPublicUrl(path);
        const res = await addCustomerFile(customerId, {
          category,
          name: file.name,
          url: data.publicUrl,
          path,
          mime_type: file.type,
          size: file.size,
        });
        if (!res.ok) setError(res.error);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo subir el archivo. ¿Creaste el almacén 'clientes'?",
        );
      }
    }
    setUploading(false);
    e.target.value = "";
    router.refresh();
  }

  async function onDelete(f: CustomerFile) {
    if (!window.confirm(`¿Eliminar "${f.name}"?`)) return;
    const res = await deleteCustomerFile(f.id, customerId, f.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={`${title} (${files.length})`}
        action={
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Subir
            <input
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={onFiles}
              disabled={uploading}
            />
          </label>
        }
      />

      <div className="p-4">
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-300 py-8 text-center">
            <Icon className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm text-ink-400">
              Aún no hay {title.toLowerCase()}. Pulsa “Subir” para añadir.
            </p>
            <p className="text-xs text-ink-300">Máximo {MAX_MB} MB por archivo.</p>
          </div>
        ) : category === "video" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {files.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg border border-ink-200">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={f.url} controls className="aspect-video w-full bg-black" />
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-xs text-ink-600" title={f.name ?? ""}>
                    {f.name}
                  </span>
                  <button
                    onClick={() => onDelete(f)}
                    className="shrink-0 text-ink-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {files.map((f) => {
              const isImage = (f.mime_type ?? "").startsWith("image/");
              return (
                <div
                  key={f.id}
                  className="group relative overflow-hidden rounded-lg border border-ink-200 bg-white"
                >
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt={f.name ?? ""} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full flex-col items-center justify-center bg-ink-50 p-2 text-center">
                        <FileText className="h-8 w-8 text-ink-400" />
                        <span className="mt-1 line-clamp-2 text-[11px] text-ink-500">{f.name}</span>
                      </div>
                    )}
                  </a>
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 shadow hover:text-brand-600"
                      title="Abrir"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => onDelete(f)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 shadow hover:text-red-600"
                      title="Eliminar"
                    >
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
