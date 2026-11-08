/** Documentos adjuntos a una compra (orden de compra y comprobante de pago). */

export const PURCHASE_FILE_BUCKET = "compras";

export type PurchaseFileKind = "orden_compra" | "comprobante_pago";

export type PurchaseFile = {
  id: string;
  purchase_id: string;
  kind: PurchaseFileKind;
  title: string | null;
  name: string | null;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};
