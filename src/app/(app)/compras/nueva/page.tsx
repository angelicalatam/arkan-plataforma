import { PageHeader } from "@/components/ui/PageHeader";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { PurchaseForm } from "../PurchaseForm";

export default async function NuevaCompraPage() {
  const [suppliers, projects] = await Promise.all([getSupplierOptions(), getProjectOptions()]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nueva compra" description="Registra una compra de material." />
      <PurchaseForm suppliers={suppliers} projects={projects} />
    </div>
  );
}
