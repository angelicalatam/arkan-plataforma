import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getMaterial } from "@/lib/materials/queries";
import { MaterialForm } from "../../MaterialForm";
import { DeleteMaterialButton } from "../DeleteMaterialButton";

export default async function EditarMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [material, suppliers] = await Promise.all([getMaterial(id), getSupplierOptions()]);
  if (!material) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={"/materiales/catalogo" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Catálogo
      </Link>
      <div className="mb-4 flex items-center justify-between gap-3">
        <PageHeader title={material.name} description="Editar material del catálogo." />
        <DeleteMaterialButton id={material.id} name={material.name} />
      </div>
      <MaterialForm suppliers={suppliers} material={material} />
    </div>
  );
}
