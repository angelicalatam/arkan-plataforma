import { PageHeader } from "@/components/ui/PageHeader";
import { getCustomerOptions } from "@/lib/quotes/queries";
import { QuoteForm } from "../QuoteForm";

export default async function NuevoPresupuestoPage() {
  const customers = await getCustomerOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Nuevo presupuesto"
        description="Crea el presupuesto y luego añade capítulos y partidas."
      />
      <QuoteForm customers={customers} />
    </div>
  );
}
