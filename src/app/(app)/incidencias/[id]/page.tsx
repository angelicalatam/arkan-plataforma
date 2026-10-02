import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, HardHat, Building2, User, CalendarClock } from "lucide-react";
import { getIncident } from "@/lib/incidents/queries";
import { severityInfo, incidentStatusInfo } from "@/lib/incidents/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { IncidentPhotos } from "./IncidentPhotos";
import { IncidentStatusControl } from "./IncidentStatusControl";
import { DeleteIncidentButton } from "./DeleteIncidentButton";

export default async function IncidenciaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inc = await getIncident(id);
  if (!inc) notFound();

  const sev = severityInfo(inc.severity);
  const st = incidentStatusInfo(inc.status);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={"/incidencias" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Incidencias
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{inc.code || "Incidencia"}</h1>
            <Badge tone={sev.tone}>{sev.label}</Badge>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-1 text-ink-700">{inc.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            {inc.incident_date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDate(inc.incident_date)}
              </span>
            )}
            {inc.project && (
              <span className="inline-flex items-center gap-1.5">
                <HardHat className="h-3.5 w-3.5" />
                <Link href={`/obras/${inc.project.id}` as Route} className="text-brand-600 hover:text-brand-700">
                  {inc.project.code || inc.project.name}
                </Link>
              </span>
            )}
            {inc.supplier && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {inc.supplier.name}
              </span>
            )}
            {inc.assignee && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {inc.assignee.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/incidencias/${inc.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteIncidentButton id={inc.id} code={inc.code ?? "incidencia"} />
        </div>
      </div>

      <div className="mb-5">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <IncidentStatusControl incidentId={inc.id} status={inc.status} />
            {inc.resolved_at && (
              <span className="text-sm text-ink-500">Resuelta el {formatDate(inc.resolved_at)}</span>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Descripción" />
          <p className="whitespace-pre-wrap p-4 text-sm text-ink-700">
            {inc.description || "Sin descripción."}
          </p>
        </Card>
        <Card>
          <CardHeader title="Acción correctiva" />
          <p className="whitespace-pre-wrap p-4 text-sm text-ink-700">
            {inc.corrective_action || "Sin acción correctiva registrada. Edítala para añadirla."}
          </p>
        </Card>
      </div>

      <div className="mt-5">
        <IncidentPhotos incidentId={inc.id} photos={inc.photos ?? []} />
      </div>
    </div>
  );
}
