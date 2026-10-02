import { createClient } from "@/lib/supabase/server";
import type { Incident } from "./types";

const SELECT =
  "*, project:projects(id, name, code), supplier:suppliers(id, name), assignee:employees(id, name)";

/** Todas las incidencias. */
export async function getIncidents(): Promise<Incident[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select(SELECT)
    .order("created_at", { ascending: false });
  return (data as Incident[]) ?? [];
}

/** Una incidencia completa con sus fotos. */
export async function getIncident(id: string): Promise<Incident | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select(`${SELECT}, photos:incident_photos(*)`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const inc = data as Incident;
  inc.photos = (inc.photos ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  return inc;
}

/** Incidencias de una obra. */
export async function getProjectIncidents(projectId: string): Promise<Incident[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as Incident[]) ?? [];
}

/** Nº de incidencias abiertas (para el panel). */
export async function getOpenIncidentCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .in("status", ["abierta", "en_proceso"]);
  return count ?? 0;
}
