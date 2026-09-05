import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCustomerOptions } from "@/lib/quotes/queries";
import { ImportForm } from "../ImportForm";

export default async function ImportarPresupuestoPage() {
  const customers = await getCustomerOptions();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={"/presupuestos" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Presupuestos
      </Link>
      <PageHeader
        title="Importar presupuesto desde Excel"
        description="Crea un presupuesto completo (capítulos y partidas) a partir de un Excel."
      />
      <ImportForm customers={customers} />
    </div>
  );
}
