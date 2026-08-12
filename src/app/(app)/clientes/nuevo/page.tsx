import { PageHeader } from "@/components/ui/PageHeader";
import { getStages } from "@/lib/crm/queries";
import { CustomerForm } from "../CustomerForm";

export default async function NuevoClientePage() {
  const stages = await getStages();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo cliente" description="Da de alta un cliente o prospecto." />
      <CustomerForm stages={stages} />
    </div>
  );
}
