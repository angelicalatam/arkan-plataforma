import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeNote, EmployeeWarning, TimeEntry } from "./types";

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

/** Llamados de atención de una persona. */
export async function getEmployeeWarnings(employeeId: string): Promise<EmployeeWarning[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_warnings")
    .select("*")
    .eq("employee_id", employeeId)
    .order("warn_date", { ascending: false });
  return (data as EmployeeWarning[]) ?? [];
}

/** Notas internas de una persona. */
export async function getEmployeeNotes(employeeId: string): Promise<EmployeeNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_notes")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  return (data as EmployeeNote[]) ?? [];
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
