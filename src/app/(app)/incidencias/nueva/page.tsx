import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProjectOptions } from "@/lib/projects/queries";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getEmployeeOptions } from "@/lib/team/queries";
import { IncidentForm } from "../IncidentForm";

export default async function NuevaIncidenciaPage() {
  const [projects, suppliers, employees] = await Promise.all([
    getProjectOptions(),
    getSupplierOptions(),
    getEmployeeOptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={"/incidencias" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Incidencias
      </Link>
      <PageHeader title="Nueva incidencia" description="Registra la incidencia con su gravedad, obra y responsable." />
      <IncidentForm
        projects={projects}
        suppliers={suppliers}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
      />
    </div>
  );
}
