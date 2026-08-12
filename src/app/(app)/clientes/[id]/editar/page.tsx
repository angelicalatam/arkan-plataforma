import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCustomer, getStages } from "@/lib/crm/queries";
import { CustomerForm } from "../../CustomerForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, stages] = await Promise.all([getCustomer(id), getStages()]);

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar cliente" description={customer.name} />
      <CustomerForm stages={stages} customer={customer} />
    </div>
  );
}
