/** Operaciones documentales con proveedores (ciclo de 4 documentos). */

export type DocType = "pedido" | "factura" | "pago" | "albaran";

export const DOC_TYPES: { value: DocType; label: string; order: number }[] = [
  { value: "pedido", label: "Pedido de venta", order: 1 },
  { value: "factura", label: "Factura", order: 2 },
  { value: "pago", label: "Comprobante de pago", order: 3 },
  { value: "albaran", label: "Albarán", order: 4 },
];

export function docTypeLabel(t: DocType): string {
  return DOC_TYPES.find((d) => d.value === t)?.label ?? t;
}

export type OperationDocument = {
  id: string;
  operation_id: string;
  doc_type: DocType;
  name: string | null;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  doc_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const OPERATION_STORAGE_BUCKET = "operaciones";

export type SupplierOperation = {
  id: string;
  reference: string;
  supplier_id: string;
  project_id: string;
  title: string | null;
  amount: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string } | null;
  project?: { id: string; name: string | null; code: string | null } | null;
  documents?: OperationDocument[];
};

/** Estado del ciclo documental, calculado a partir de los documentos presentes. */
export function operationStatus(documents: { doc_type: DocType }[] | undefined) {
  const present = new Set((documents ?? []).map((d) => d.doc_type));
  const missing = DOC_TYPES.filter((d) => !present.has(d.value)).map((d) => d.value);
  return {
    present: Array.from(present),
    missing,
    presentCount: present.size,
    total: DOC_TYPES.length,
    complete: missing.length === 0,
  };
}

/** Texto legible de los documentos que faltan. */
export function missingDocsLabel(missing: DocType[]): string {
  return missing.map(docTypeLabel).join(" y ");
}
