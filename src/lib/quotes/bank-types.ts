/** Tipos del banco de precios (partidas y materiales de referencia). */

export type PriceItem = {
  id: string;
  category: string | null;
  code: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  cost_labor: number;
  cost_materials: number;
  cost_other: number;
  margin_pct: number;
  est_hours: number | null;
  est_workers: number | null;
};

export type PriceMaterial = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  unit_price: number;
  reference: string | null;
  category: string | null;
};
