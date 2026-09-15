import { createClient } from "@/lib/supabase/server";
import type { Material, MaterialRequest } from "./types";

// ---------------------------------------------------------------
// CATÁLOGO
// ---------------------------------------------------------------
export async function getMaterials(): Promise<Material[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("*, supplier:suppliers(id, name)")
    .order("name", { ascending: true });
  return (data as Material[]) ?? [];
}

export async function getMaterial(id: string): Promise<Material | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("*, supplier:suppliers(id, name)")
    .eq("id", id)
    .maybeSingle();
  return (data as Material) ?? null;
}

/** Materiales activos para selects (con precio, unidad y proveedor habitual). */
export async function getMaterialOptions(): Promise<
  { id: string; name: string; unit: string | null; reference_price: number; supplier_id: string | null }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("id, name, unit, reference_price, supplier_id")
    .eq("active", true)
    .order("name", { ascending: true });
  return (data ?? []) as {
    id: string;
    name: string;
    unit: string | null;
    reference_price: number;
    supplier_id: string | null;
  }[];
}

// ---------------------------------------------------------------
// NECESIDADES POR OBRA
// ---------------------------------------------------------------
export async function getProjectMaterialRequests(projectId: string): Promise<MaterialRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("material_requests")
    .select("*, supplier:suppliers(id, name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as MaterialRequest[]) ?? [];
}

/** Todas las necesidades (para la vista consolidada), con obra y proveedor. */
export async function getAllMaterialRequests(): Promise<MaterialRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("material_requests")
    .select("*, project:projects(id, name, code), supplier:suppliers(id, name)")
    .order("created_at", { ascending: false });
  return (data as MaterialRequest[]) ?? [];
}
