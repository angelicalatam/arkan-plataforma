import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPurchases } from "@/lib/purchases/queries";
import { PurchasesTable } from "./PurchasesTable";

export default async function ComprasPage() {
  const purchases = await getPurchases();

  return (
    <div>
      <PageHeader title="Compras" description="Compras de material por obra y proveedor.">
        <Link
          href={"/compras/nueva" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nueva compra
        </Link>
      </PageHeader>
      <PurchasesTable purchases={purchases} />
    </div>
  );
}
