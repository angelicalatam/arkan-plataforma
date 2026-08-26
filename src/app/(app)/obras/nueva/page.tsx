import { PageHeader } from "@/components/ui/PageHeader";
import { getCustomerOptions } from "@/lib/quotes/queries";
import { ProjectForm } from "../ProjectForm";

export default async function NuevaObraPage() {
  const customers = await getCustomerOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Nueva obra"
        description="Crea una obra manualmente. (Si viene de un presupuesto, usa “Convertir en obra”.)"
      />
      <ProjectForm customers={customers} />
    </div>
  );
}
