"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { INCIDENT_BUCKET, type IncidentSeverity, type IncidentStatus } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

export type IncidentInput = {
  title: string;
  description?: string | null;
  project_id?: string | null;
  supplier_id?: string | null;
  assignee_id?: string | null;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  incident_date?: string | null;
  corrective_action?: string | null;
};

function revalidate(id?: string, projectId?: string | null) {
  revalidatePath("/incidencias");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/incidencias/${id}`);
  if (projectId) revalidatePath(`/obras/${projectId}`);
}

export async function createIncident(input: IncidentInput): Promise<Result> {
  if (!input.title?.trim()) return { ok: false, error: "La incidencia necesita un título." };
  const supabase = await createClient();

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .ilike("code", `INC-${year}-%`);
  const code = `INC-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("incidents")
    .insert(clean({ ...input, code, title: input.title.trim() }))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidate(data.id, input.project_id);
  return { ok: true, id: data.id };
}

export async function updateIncident(id: string, input: IncidentInput): Promise<Result> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = clean({ ...input });
  if (input.status === "resuelta" || input.status === "cerrada") {
    patch.resolved_at = new Date().toISOString().slice(0, 10);
  } else if (input.status) {
    patch.resolved_at = null;
  }
  const { error } = await supabase.from("incidents").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(id, input.project_id);
  return { ok: true, id };
}

export async function setIncidentStatus(
  id: string,
  status: IncidentStatus,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("incidents")
    .update({
      status,
      resolved_at:
        status === "resuelta" || status === "cerrada"
          ? new Date().toISOString().slice(0, 10)
          : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true };
}

export async function deleteIncident(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: photos } = await supabase.from("incident_photos").select("path").eq("incident_id", id);
  const paths = (photos ?? []).map((p: { path: string }) => p.path).filter(Boolean);
  if (paths.length > 0) await supabase.storage.from(INCIDENT_BUCKET).remove(paths);
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ---------------------------------------------------------------
// FOTOS
// ---------------------------------------------------------------
export async function addIncidentPhoto(
  incidentId: string,
  input: { name: string; url: string; path: string; mime_type?: string | null; size?: number | null },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("incident_photos").insert({
    incident_id: incidentId,
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/incidencias/${incidentId}`);
  return { ok: true };
}

export async function deleteIncidentPhoto(
  id: string,
  incidentId: string,
  path: string,
): Promise<Result> {
  const supabase = await createClient();
  if (path) await supabase.storage.from(INCIDENT_BUCKET).remove([path]);
  const { error } = await supabase.from("incident_photos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/incidencias/${incidentId}`);
  return { ok: true };
}
