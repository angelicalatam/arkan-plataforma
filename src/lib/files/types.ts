/** Archivos subidos a la ficha de un cliente. */

export type FileCategory = "foto" | "video" | "plano" | "otro";

export type CustomerFile = {
  id: string;
  customer_id: string;
  category: FileCategory;
  name: string | null;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

export const FILE_BUCKET = "clientes";
