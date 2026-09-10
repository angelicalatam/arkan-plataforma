import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectChapter } from "./types";

/** Lista de obras con cliente y partidas (para totales y avance). */
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(
      "*, customer:customers(id, name), chapters:project_chapters(items:project_items(quantity,cost_labor,cost_materials,cost_other,margin_pct,pct_done))",
    )
    .order("created_at", { ascending: false });
  return (data as Project[]) ?? [];
}

/** Lista ligera de obras para selects. */
export async function getProjectOptions(): Promise<{ id: string; name: string; code: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, code")
    .order("created_at", { ascending: false });
  return (data ?? []) as { id: string; name: string; code: string | null }[];
}

export type DueReminder = {
  id: string;
  content: string;
  remind_on: string;
  project_id: string;
  item: { description: string; code: string | null } | null;
  project: { code: string | null; name: string | null } | null;
};

/** Recordatorios de partida pendientes y ya vencidos/para hoy (para las alertas). */
export async function getDueItemReminders(): Promise<DueReminder[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("project_item_notes")
    .select(
      "id, content, remind_on, project_id, item:project_items(description, code), project:projects(code, name)",
    )
    .eq("done", false)
    .not("remind_on", "is", null)
    .lte("remind_on", today)
    .order("remind_on", { ascending: true });
  return (data as unknown as DueReminder[]) ?? [];
}

/** Una obra completa (capítulos y partidas ordenados). */
export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(
      "*, customer:customers(id, name), chapters:project_chapters(*, items:project_items(*, item_notes:project_item_notes(*)))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const project = data as Project;
  project.chapters = (project.chapters ?? []).sort(
    (a: ProjectChapter, b: ProjectChapter) => a.position - b.position,
  );
  for (const ch of project.chapters) {
    ch.items = (ch.items ?? []).sort((a, b) => a.position - b.position);
  }
  return project;
}
