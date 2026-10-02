import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getIncidents } from "@/lib/incidents/queries";
import { IncidentsList } from "./IncidentsList";

export default async function IncidenciasPage() {
  const incidents = await getIncidents();

  return (
    <div>
      <PageHeader title="Incidencias" description="Registro y seguimiento de incidencias de obra, con fotos y acciones correctivas.">
        <Link
          href={"/incidencias/nueva" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nueva incidencia
        </Link>
      </PageHeader>

      <IncidentsList incidents={incidents} />
    </div>
  );
}
