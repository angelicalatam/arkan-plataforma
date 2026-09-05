import { createClient } from "@/lib/supabase/server";
import type { Employee, TimeEntry } from "./types";

/** Lista de todo el equipo. */
export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").order("name");
  return (data as Employee[]) ?? [];
}

/** Un miembro del equipo por id. */
export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").eq("id", id).maybeSingle();
  return (data as Employee) ?? null;
}

/** Equipo activo para selects (con su coste/hora). */
export async function getEmployeeOptions(): Promise<
  { id: string; name: string; hourly_cost: number }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, hourly_cost")
    .eq("active", true)
    .order("name");
  return (data ?? []) as { id: string; name: string; hourly_cost: number }[];
}

/** Registros de horas de una obra. */
export async function getProjectTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("*, employee:employees(id, name), item:project_items(id, description)")
    .eq("project_id", projectId)
    .order("work_date", { ascending: false });
  return (data as TimeEntry[]) ?? [];
}
