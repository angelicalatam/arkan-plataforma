import { createClient } from "@/lib/supabase/server";
import type { Customer, CrmStage, Supplier, Activity } from "./types";

/** Devuelve las etapas del pipeline ordenadas. */
export async function getStages(): Promise<CrmStage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_stages")
    .select("*")
    .order("position", { ascending: true });
  return data ?? [];
}

/** Lista de clientes (con su etapa). */
export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, stage:crm_stages(*)")
    .order("created_at", { ascending: false });
  return (data as Customer[]) ?? [];
}

/** Un cliente por id (con su etapa). */
export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, stage:crm_stages(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as Customer) ?? null;
}

/** Actividades de un cliente (más recientes primero). */
export async function getCustomerActivities(customerId: string): Promise<Activity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data as Activity[]) ?? [];
}

export type ActivityWithLinks = Activity & {
  customer?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
};

/** Actividades recientes de toda la empresa (con cliente/proveedor). */
export async function getRecentActivities(limit = 100): Promise<ActivityWithLinks[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*, customer:customers(id, name), supplier:suppliers(id, name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ActivityWithLinks[]) ?? [];
}

/** Lista de proveedores. */
export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Supplier[]) ?? [];
}

/** Un proveedor por id. */
export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Supplier) ?? null;
}

export type TeamMember = { id: string; full_name: string | null; email: string | null };

/** Personas registradas en la plataforma (para invitar a citas). */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  return (data as TeamMember[])?.filter((m) => m.email) ?? [];
}

/** Posibles duplicados por CIF/NIF, email o teléfono (sección 36). */
export async function findCustomerDuplicates(params: {
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<Pick<Customer, "id" | "name" | "tax_id" | "email" | "phone">[]> {
  const filters: string[] = [];
  if (params.taxId) filters.push(`tax_id.ilike.${params.taxId}`);
  if (params.email) filters.push(`email.ilike.${params.email}`);
  if (params.phone) filters.push(`phone.eq.${params.phone}`);
  if (filters.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, tax_id, email, phone")
    .or(filters.join(","))
    .limit(5);
  return data ?? [];
}
