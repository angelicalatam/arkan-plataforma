"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addEmployeePhoto, deleteEmployeePhoto } from "@/lib/team/actions";
import { EMPLOYEE_BUCKET, type EmployeePhoto } from "@/lib/team/types";
import { Card, CardHeader } from "@/components/ui/Card";

const MAX_MB = 10;

export function EmployeePhotos({
  employeeId,
  photos,
}: {
  employeeId: string;
  photos: EmployeePhoto[];
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
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${employeeId}/fotos/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(EMPLOYEE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(EMPLOYEE_BUCKET).getPublicUrl(path);
        const res = await addEmployeePhoto(employeeId, {
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
      setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(p: EmployeePhoto) {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    const res = await deleteEmployeePhoto(p.id, employeeId, p.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={`Fotos del empleado (${photos.length})`}
        action={
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir fotos
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={uploading} />
          </label>
        }
      />
      <div className="p-4">
        {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        {photos.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">Sin fotos. Puedes subir varias (máx. {MAX_MB} MB cada una).</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-lg border border-ink-200 bg-white">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name ?? ""} className="aspect-square w-full object-cover" />
                </a>
                <button
                  onClick={() => onDelete(p)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-600 opacity-0 shadow transition-opacity hover:text-red-600 group-hover:opacity-100"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
