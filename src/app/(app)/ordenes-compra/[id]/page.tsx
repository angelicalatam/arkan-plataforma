import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Printer, Building2, MapPin } from "lucide-react";
import { getPurchaseOrder } from "@/lib/purchase-orders/queries";
import { orderTotals, orderStatusInfo, lineSubtotal } from "@/lib/purchase-orders/types";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { DeleteOrderButton } from "./DeleteOrderButton";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) notFound();

  const items = order.items ?? [];
  const t = orderTotals(items, order.tax_rate);
  const si = orderStatusInfo(order.status);
  const supplier = order.supplier as
    | { id: string; name: string; legal_name?: string | null; tax_id?: string | null; email?: string | null; phone?: string | null }
    | null;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={"/ordenes-compra" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Órdenes de compra
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{order.code || "Orden"}</h1>
            <Badge tone={si.tone}>{si.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">Fecha: {formatDate(order.order_date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/ordenes-compra/${order.id}/imprimir` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Link>
          <Link
            href={`/ordenes-compra/${order.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteOrderButton id={order.id} code={order.code ?? "orden"} />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Proveedor" />
          <div className="p-4 text-sm">
            {supplier ? (
              <>
                <p className="inline-flex items-center gap-1.5 font-medium text-ink-900">
                  <Building2 className="h-4 w-4 text-ink-400" />
                  {supplier.name}
                </p>
                {supplier.legal_name && <p className="text-ink-500">{supplier.legal_name}</p>}
                {supplier.tax_id && <p className="text-ink-500">CIF/NIF: {supplier.tax_id}</p>}
                {supplier.email && <p className="text-ink-500">{supplier.email}</p>}
                {supplier.phone && <p className="text-ink-500">{supplier.phone}</p>}
              </>
            ) : (
              <p className="text-ink-400">Sin proveedor.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Entrega y pago" />
          <dl className="space-y-2 p-4 text-sm">
            <Row label="Obra" value={order.project ? order.project.code || order.project.name || "Obra" : "—"} />
            <Row label="Entrega prevista" value={formatDate(order.expected_date)} />
            <Row label="Condiciones de pago" value={order.payment_terms || "—"} />
            {order.delivery_address && (
              <div className="flex items-start gap-1.5 pt-1 text-ink-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                {order.delivery_address}
              </div>
            )}
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader title="Líneas de material" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
                <th className="px-4 py-2 font-semibold">Descripción</th>
                <th className="px-4 py-2 text-right font-semibold">Cantidad</th>
                <th className="px-4 py-2 font-semibold">Ud.</th>
                <th className="px-4 py-2 text-right font-semibold">Precio/ud</th>
                <th className="px-4 py-2 text-right font-semibold">Importe</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-400">
                    Esta orden no tiene líneas.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2 text-ink-800">{it.description}</td>
                    <td className="px-4 py-2 text-right text-ink-600">{it.quantity}</td>
                    <td className="px-4 py-2 text-ink-500">{it.unit}</td>
                    <td className="px-4 py-2 text-right text-ink-600">{formatCurrency(it.unit_price)}</td>
                    <td className="px-4 py-2 text-right font-medium text-ink-800">{formatCurrency(lineSubtotal(it))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-ink-100 px-4 py-3 text-sm">
          <span className="text-ink-500">Subtotal: <strong className="text-ink-800">{formatCurrency(t.subtotal)}</strong></span>
          <span className="text-ink-500">IVA ({order.tax_rate}%): <strong className="text-ink-800">{formatCurrency(t.tax)}</strong></span>
          <span className="text-base text-ink-900">Total: <strong className="text-brand-700">{formatCurrency(t.total)}</strong></span>
        </div>
      </Card>

      {order.notes && (
        <Card className="mt-5">
          <CardHeader title="Notas" />
          <p className="whitespace-pre-wrap p-4 text-sm text-ink-700">{order.notes}</p>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}
