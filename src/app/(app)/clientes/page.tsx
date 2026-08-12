import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCustomers } from "@/lib/crm/queries";
import { CustomersTable } from "./CustomersTable";

export default async function ClientesPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Tu cartera de clientes y prospectos."
      >
        <Link
          href={"/clientes/nuevo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </PageHeader>

      <CustomersTable customers={customers} />
    </div>
  );
}
