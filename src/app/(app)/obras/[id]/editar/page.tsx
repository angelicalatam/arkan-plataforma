import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProject } from "@/lib/projects/queries";
import { getCustomerOptions } from "@/lib/quotes/queries";
import { ProjectForm } from "../../ProjectForm";

export default async function EditarObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, customers] = await Promise.all([getProject(id), getCustomerOptions()]);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar obra" description={project.code ?? undefined} />
      <ProjectForm project={project} customers={customers} />
    </div>
  );
}
