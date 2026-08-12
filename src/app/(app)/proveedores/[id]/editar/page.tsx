import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSupplier } from "@/lib/crm/queries";
import { SupplierForm } from "../../SupplierForm";

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar proveedor" description={supplier.name} />
      <SupplierForm supplier={supplier} />
    </div>
  );
}
