import { PageHeader } from "@/components/ui/PageHeader";
import { SupplierForm } from "../SupplierForm";

export default function NuevoProveedorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo proveedor" description="Da de alta un proveedor o colaborador." />
      <SupplierForm />
    </div>
  );
}
