"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RelationType } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

// ---------------------------------------------------------------
// EQUIPO
// ---------------------------------------------------------------
export type EmployeeInput = {
  name: string;
  role?: string | null;
  specialty?: string | null;
  relationship?: RelationType;
  phone?: string | null;
  email?: string | null;
  hourly_cost?: number;
  active?: boolean;
  notes?: string | null;
};

export async function createEmployee(input: EmployeeInput): Promise<Result> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert(clean(input))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipo");
  return { ok: true, id: data.id };
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update(clean(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  return { ok: true, id };
}

export async function deleteEmployee(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipo");
  return { ok: true };
}

// ---------------------------------------------------------------
// HORAS
// ---------------------------------------------------------------
export type TimeEntryInput = {
  employee_id?: string | null;
  project_item_id?: string | null;
  work_date?: string | null;
  hours?: number;
  hourly_cost?: number;
  notes?: string | null;
};

export async function addTimeEntry(
  projectId: string,
  input: TimeEntryInput,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert(
    clean({
      project_id: projectId,
      employee_id: input.employee_id || null,
      project_item_id: input.project_item_id || null,
      work_date: input.work_date || new Date().toISOString().slice(0, 10),
      hours: input.hours ?? 0,
      hourly_cost: input.hourly_cost ?? 0,
      notes: input.notes ?? null,
    }),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/obras/${projectId}`);
  return { ok: true };
}

export async function deleteTimeEntry(id: string, projectId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/obras/${projectId}`);
  return { ok: true };
}
