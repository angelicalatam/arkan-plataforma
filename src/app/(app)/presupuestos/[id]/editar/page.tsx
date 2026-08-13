import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getQuote, getCustomerOptions } from "@/lib/quotes/queries";
import { QuoteForm } from "../../QuoteForm";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, customers] = await Promise.all([getQuote(id), getCustomerOptions()]);
  if (!quote) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar presupuesto" description={quote.code ?? undefined} />
      <QuoteForm customers={customers} quote={quote} />
    </div>
  );
}
