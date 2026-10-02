/** Biblioteca documental (Fase 9). */

export const DOCUMENTS_BUCKET = "documentos";

export type DocCategory =
  | "contrato"
  | "plano"
  | "foto"
  | "factura"
  | "albaran"
  | "licencia"
  | "certificado"
  | "seguro"
  | "otro";

export const DOC_CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: "contrato", label: "Contrato" },
  { value: "plano", label: "Plano" },
  { value: "foto", label: "Foto" },
  { value: "factura", label: "Factura" },
  { value: "albaran", label: "Albarán" },
  { value: "licencia", label: "Licencia" },
  { value: "certificado", label: "Certificado" },
  { value: "seguro", label: "Seguro" },
  { value: "otro", label: "Otro" },
];

export function docCategoryLabel(c: string): string {
  return DOC_CATEGORIES.find((x) => x.value === c)?.label ?? "Otro";
}

export type Document = {
  id: string;
  title: string | null;
  category: DocCategory;
  project_id: string | null;
  name: string | null;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
  project?: { id: string; name: string | null; code: string | null } | null;
};
