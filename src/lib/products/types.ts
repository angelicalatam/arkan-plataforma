/** Tipos del banco de productos. */

export type Product = {
  id: string;
  category: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  reference: string | null;
  supplier_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Opción de producto ofrecida al cliente dentro de una partida. */
export type QuoteItemProduct = {
  id: string;
  quote_item_id: string;
  product_id: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  reference: string | null;
  image_url: string | null;
  is_recommended: boolean;
  position: number;
};
