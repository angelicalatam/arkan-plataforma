import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSuppliers } from "@/lib/crm/queries";
import { SuppliersTable } from "./SuppliersTable";

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Base de datos de proveedores, contactos y evaluaciones."
      >
        <Link
          href={"/proveedores/nuevo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </Link>
      </PageHeader>

      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
