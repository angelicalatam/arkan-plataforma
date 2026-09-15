/** Materiales: catálogo maestro + necesidades por obra. */

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export type Material = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  reference_price: number;
  supplier_id: string | null;
  reference: string | null;
  notes: string | null;
  active: boolean;
  pack_unit: string | null;
  pack_quantity: number | null;
  pieces_per_pack: number | null;
  piece_unit: string | null;
  image_url: string | null;
  tax_rate: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string } | null;
};

/** Añade el IVA a un precio. */
export function withTax(price: number | null, taxRate: number): number | null {
  if (price == null) return null;
  return price * (1 + (Number(taxRate) || 0) / 100);
}

/**
 * Precios calculados a partir del precio por unidad de compra y la presentación.
 * Ej.: unit=m², reference_price=€/m², pack_quantity=23, pieces_per_pack=575
 *   → perPack = 23 × €/m² (precio del palet); perPiece = perPack / 575 (precio del panot).
 */
export function materialPrices(m: {
  reference_price: number;
  pack_quantity?: number | null;
  pieces_per_pack?: number | null;
}): { perUnit: number; perPack: number | null; perPiece: number | null } {
  const perUnit = Number(m.reference_price) || 0;
  const packQty = Number(m.pack_quantity) || 0;
  const pieces = Number(m.pieces_per_pack) || 0;
  const perPack = packQty > 0 ? perUnit * packQty : null;
  const perPiece = perPack != null && pieces > 0 ? perPack / pieces : null;
  return { perUnit, perPack, perPiece };
}

export type RequestStatus = "por_pedir" | "pedido" | "recibido" | "cancelado";

export const REQUEST_STATUSES: { value: RequestStatus; label: string; tone: Tone }[] = [
  { value: "por_pedir", label: "Por pedir", tone: "amber" },
  { value: "pedido", label: "Pedido", tone: "blue" },
  { value: "recibido", label: "Recibido", tone: "green" },
  { value: "cancelado", label: "Cancelado", tone: "red" },
];

export function requestStatusInfo(status: string) {
  return REQUEST_STATUSES.find((s) => s.value === status) ?? REQUEST_STATUSES[0];
}

export type MaterialRequest = {
  id: string;
  project_id: string;
  material_id: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  status: RequestStatus;
  supplier_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string | null; code: string | null } | null;
  supplier?: { id: string; name: string } | null;
};
