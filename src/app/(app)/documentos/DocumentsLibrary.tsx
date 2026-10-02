"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ExternalLink, FileText, Search, HardHat, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addDocument, deleteDocument } from "@/lib/documents/actions";
import { DOCUMENTS_BUCKET, DOC_CATEGORIES, docCategoryLabel, type DocCategory, type Document } from "@/lib/documents/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/format";

const MAX_MB = 50;

type Option = { id: string; name: string | null; code?: string | null };

export function DocumentsLibrary({
  documents,
  projects,
}: {
  documents: Document[];
  projects: Option[];
}) {
  const router = useRouter();

  // Subida.
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("contrato");
  const [projectId, setProjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros.
  const [fCategory, setFCategory] = useState<string>("");
  const [fProject, setFProject] = useState<string>("");
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return documents.filter((d) => {
      if (fCategory && d.category !== fCategory) return false;
      if (fProject === "__general" && d.project_id) return false;
      if (fProject && fProject !== "__general" && d.project_id !== fProject) return false;
      if (q && ![d.title, d.name, d.project?.name, d.project?.code].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [documents, fCategory, fProject, term]);

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
        const path = `${projectId || "general"}/${category}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
        const res = await addDocument({
          title: list.length === 1 ? title.trim() || null : null,
          category,
          project_id: projectId || null,
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
      setError(err instanceof Error ? err.message : "No se pudo subir. ¿Creaste el almacén 'documentos'?");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(d: Document) {
    if (!window.confirm(`¿Eliminar "${d.title || d.name}"?`)) return;
    const res = await deleteDocument(d.id, d.path);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {/* Subir documento */}
      <Card className="mb-5">
        <CardHeader title="Subir documento" />
        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Nombre / título (opcional)</span>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Contrato obra Cantoner" />
          </label>
          <label>
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Categoría</span>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
              {DOC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Obra (opcional)</span>
            <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— General (sin obra) —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} · ` : ""}
                  {p.name || "Obra"}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir archivo(s)
              <input type="file" multiple className="hidden" onChange={onFiles} disabled={uploading} />
            </label>
          </div>
        </div>
        {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
      </Card>

      {/* Filtros */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select className={`${inputClass} w-auto`} value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select className={`${inputClass} w-auto`} value={fProject} onChange={(e) => setFProject(e.target.value)}>
            <option value="">Todas las obras</option>
            <option value="__general">General (sin obra)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ""}
                {p.name || "Obra"}
              </option>
            ))}
          </select>
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className={`${inputClass} pl-8`} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar documento…" />
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <FolderOpen className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm text-ink-400">No hay documentos en esta vista.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {filtered.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                <FileText className="h-6 w-6 shrink-0 text-ink-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{d.title || d.name}</span>
                    <Badge tone="ink">{docCategoryLabel(d.category)}</Badge>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-400">
                    {d.project ? (
                      <Link href={`/obras/${d.project.id}` as Route} className="inline-flex items-center gap-1 hover:text-brand-700">
                        <HardHat className="h-3 w-3" />
                        {d.project.code || d.project.name}
                      </Link>
                    ) : (
                      <span>General</span>
                    )}
                    <span>{d.name}</span>
                    <span>{formatDateTime(d.created_at)}</span>
                  </p>
                </div>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir
                </a>
                <button onClick={() => onDelete(d)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-400">{filtered.length} de {documents.length} documento{documents.length === 1 ? "" : "s"}</p>
    </div>
  );
}
