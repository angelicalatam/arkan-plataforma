"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Tamaño del recuadro. */
  size?: number;
};

/** Sube una imagen al bucket 'productos' de Supabase y devuelve su URL pública. */
export function ImageUpload({ value, onChange, size = 96 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("productos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("productos").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir la imagen. ¿Has creado el bucket 'productos'?",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50"
        style={{ width: size, height: size }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Producto" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-300">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
          <ImagePlus className="h-4 w-4" />
          {value ? "Cambiar foto" : "Subir foto"}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
          >
            <X className="h-3 w-3" /> Quitar
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
