/** Catálogos y documentos subidos a la ficha del proveedor. */

export const SUPPLIER_FILE_BUCKET = "proveedores";

export type SupplierFile = {
  id: string;
  supplier_id: string;
  title: string | null;
  name: string | null;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};
