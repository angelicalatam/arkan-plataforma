import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSupplierOptions } from "@/lib/crm/queries";
import { MaterialForm } from "../MaterialForm";

export default async function NuevoMaterialPage() {
  const suppliers = await getSupplierOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={"/materiales/catalogo" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Catálogo
      </Link>
      <PageHeader title="Nuevo material" description="Añade un material al catálogo." />
      <MaterialForm suppliers={suppliers} />
    </div>
  );
}
