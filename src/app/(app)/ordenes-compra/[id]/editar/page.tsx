import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { getPurchaseOrder } from "@/lib/purchase-orders/queries";
import { OrderForm } from "../../OrderForm";

export default async function EditarOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, suppliers, projects] = await Promise.all([
    getPurchaseOrder(id),
    getSupplierOptions(),
    getProjectOptions(),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/ordenes-compra/${order.id}` as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la orden
      </Link>
      <PageHeader title={`Editar ${order.code ?? "orden"}`} description="Modifica los datos y las líneas de la orden." />
      <OrderForm suppliers={suppliers} projects={projects} order={order} />
    </div>
  );
}
