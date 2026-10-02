import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getIncident } from "@/lib/incidents/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getEmployeeOptions } from "@/lib/team/queries";
import { IncidentForm } from "../../IncidentForm";

export default async function EditarIncidenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [incident, projects, suppliers, employees] = await Promise.all([
    getIncident(id),
    getProjectOptions(),
    getSupplierOptions(),
    getEmployeeOptions(),
  ]);
  if (!incident) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/incidencias/${incident.id}` as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la incidencia
      </Link>
      <PageHeader title={`Editar ${incident.code ?? "incidencia"}`} description="Modifica los datos de la incidencia." />
      <IncidentForm
        projects={projects}
        suppliers={suppliers}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        incident={incident}
      />
    </div>
  );
}
