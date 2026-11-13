import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrderRequest } from "@/lib/order-requests/queries";
import { getSupplierOptions } from "@/lib/crm/queries";
import { formatDate } from "@/lib/format";
import { OrderRequestForm } from "./OrderRequestForm";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string; pedidoId: string }>;
}) {
  const { id, pedidoId } = await params;
  const [request, suppliers] = await Promise.all([getOrderRequest(pedidoId), getSupplierOptions()]);
  if (!request) notFound();

  const supplier = request.supplier as { email?: string | null } | null;
  const supplierEmail = supplier?.email ?? "";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/ordenes-compra/${id}` as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la orden
      </Link>
      <PageHeader
        title={`Pedido a proveedor ${request.code ?? ""}`.trim()}
        description={`Generado el ${formatDate(request.created_at)}. Edítalo libremente: no cambia la orden de compra.`}
      />
      <OrderRequestForm
        request={request}
        orderId={id}
        suppliers={suppliers}
        supplierEmail={supplierEmail}
      />
    </div>
  );
}
