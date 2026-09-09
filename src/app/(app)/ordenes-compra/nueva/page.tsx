import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { OrderForm } from "../OrderForm";

export default async function NuevaOrdenPage() {
  const [suppliers, projects] = await Promise.all([getSupplierOptions(), getProjectOptions()]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={"/ordenes-compra" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Órdenes de compra
      </Link>
      <PageHeader
        title="Nueva orden de compra"
        description="Elige el proveedor y añade las líneas de material."
      />
      <OrderForm suppliers={suppliers} projects={projects} />
    </div>
  );
}
