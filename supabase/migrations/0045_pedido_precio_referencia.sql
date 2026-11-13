-- Precio de referencia (máximo) por línea del pedido a proveedor.
-- Se copia del precio/ud de la orden de compra al generar el pedido;
-- sirve para que el proveedor sepa el precio máximo al que puede cotizar.
alter table public.order_request_items
  add column if not exists reference_price numeric(14,4) not null default 0;
