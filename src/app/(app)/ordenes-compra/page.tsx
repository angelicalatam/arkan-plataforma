import Link from "next/link";
import type { Route } from "next";
import { Plus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getPurchaseOrders } from "@/lib/purchase-orders/queries";
import { orderTotals, orderStatusInfo } from "@/lib/purchase-orders/types";

export default async function OrdenesCompraPage() {
  const orders = await getPurchaseOrders();

  return (
    <div>
      <PageHeader
        title="Órdenes de compra"
        description="Pedidos a proveedores con varias líneas de material y su documento en PDF."
      >
        <Link
          href={"/ordenes-compra/nueva" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nueva orden
        </Link>
      </PageHeader>

      <Card>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm text-ink-400">
              Todavía no hay órdenes de compra. Crea la primera con “Nueva orden”.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-2 font-semibold">Nº</th>
                  <th className="px-4 py-2 font-semibold">Proveedor</th>
                  <th className="px-4 py-2 font-semibold">Obra</th>
                  <th className="px-4 py-2 font-semibold">Fecha</th>
                  <th className="px-4 py-2 text-right font-semibold">Total</th>
                  <th className="px-4 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const si = orderStatusInfo(o.status);
                  const t = orderTotals(o.items ?? [], o.tax_rate);
                  return (
                    <tr key={o.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                      <td className="px-4 py-2">
                        <Link href={`/ordenes-compra/${o.id}` as Route} className="font-medium text-brand-700 hover:text-brand-800">
                          {o.code || "OC"}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-ink-700">{o.supplier?.name || "—"}</td>
                      <td className="px-4 py-2 text-ink-600">
                        {o.project ? o.project.code || o.project.name || "Obra" : "—"}
                      </td>
                      <td className="px-4 py-2 text-ink-600">{formatDate(o.order_date)}</td>
                      <td className="px-4 py-2 text-right font-medium text-ink-800">{formatCurrency(t.total)}</td>
                      <td className="px-4 py-2">
                        <Badge tone={si.tone}>{si.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
