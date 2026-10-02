/** Incidencias de obra (Fase 9 · Operaciones). */

export const INCIDENT_BUCKET = "incidencias";

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export type IncidentSeverity = "baja" | "media" | "alta" | "critica";

export const INCIDENT_SEVERITIES: { value: IncidentSeverity; label: string; tone: Tone }[] = [
  { value: "critica", label: "Crítica", tone: "red" },
  { value: "alta", label: "Alta", tone: "red" },
  { value: "media", label: "Media", tone: "amber" },
  { value: "baja", label: "Baja", tone: "ink" },
];

export function severityInfo(severity: string) {
  return INCIDENT_SEVERITIES.find((s) => s.value === severity) ?? INCIDENT_SEVERITIES[2];
}

export type IncidentStatus = "abierta" | "en_proceso" | "resuelta" | "cerrada";

export const INCIDENT_STATUSES: { value: IncidentStatus; label: string; tone: Tone }[] = [
  { value: "abierta", label: "Abierta", tone: "amber" },
  { value: "en_proceso", label: "En proceso", tone: "blue" },
  { value: "resuelta", label: "Resuelta", tone: "green" },
  { value: "cerrada", label: "Cerrada", tone: "ink" },
];

export function incidentStatusInfo(status: string) {
  return INCIDENT_STATUSES.find((s) => s.value === status) ?? INCIDENT_STATUSES[0];
}

export function isIncidentOpen(status: string): boolean {
  return status === "abierta" || status === "en_proceso";
}

export type IncidentPhoto = {
  id: string;
  incident_id: string;
  name: string | null;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

export type Incident = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  project_id: string | null;
  supplier_id: string | null;
  assignee_id: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  incident_date: string | null;
  corrective_action: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string | null; code: string | null } | null;
  supplier?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
  photos?: IncidentPhoto[];
};
