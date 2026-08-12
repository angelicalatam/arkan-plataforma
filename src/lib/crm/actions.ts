"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType, CustomerType } from "./types";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ---------------------------------------------------------------
// CLIENTES
// ---------------------------------------------------------------
export type CustomerInput = {
  name: string;
  type: CustomerType;
  tax_id?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  contact_person?: string | null;
  contact_role?: string | null;
  lead_source?: string | null;
  stage_id?: string | null;
  potential_value?: number | null;
  notes?: string | null;
  next_followup?: string | null;
};

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out as T;
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(clean(input))
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  revalidatePath("/leads");
  return { ok: true, id: data.id };
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(clean(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/leads");
  return { ok: true, id };
}

export async function updateCustomerStage(
  id: string,
  stageId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ stage_id: stageId, last_contact: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/leads");
  revalidatePath("/clientes");
  return { ok: true, id };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  revalidatePath("/leads");
  return { ok: true };
}

// ---------------------------------------------------------------
// PROVEEDORES
// ---------------------------------------------------------------
export type SupplierInput = {
  name: string;
  legal_name?: string | null;
  tax_id?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  website?: string | null;
  category?: string | null;
  subcategory?: string | null;
  products_services?: string | null;
  payment_terms?: string | null;
  payment_method?: string | null;
  delivery_time?: string | null;
  service_zone?: string | null;
  notes?: string | null;
  rating_price?: number | null;
  rating_quality?: number | null;
  rating_delivery?: number | null;
  rating_reliability?: number | null;
  rating_service?: number | null;
  rating_overall?: number | null;
};

export async function createSupplier(input: SupplierInput): Promise<ActionResult> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert(clean(input))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/proveedores");
  return { ok: true, id: data.id };
}

export async function updateSupplier(
  id: string,
  input: Partial<SupplierInput>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update(clean(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}`);
  return { ok: true, id };
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/proveedores");
  return { ok: true };
}

// ---------------------------------------------------------------
// ACTIVIDADES
// ---------------------------------------------------------------
export async function addActivity(input: {
  type: ActivityType;
  subject?: string | null;
  body?: string | null;
  customer_id?: string | null;
  supplier_id?: string | null;
  due_date?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert(clean(input));
  if (error) return { ok: false, error: error.message };
  if (input.customer_id) {
    await supabase
      .from("customers")
      .update({ last_contact: new Date().toISOString() })
      .eq("id", input.customer_id);
    revalidatePath(`/clientes/${input.customer_id}`);
  }
  if (input.supplier_id) revalidatePath(`/proveedores/${input.supplier_id}`);
  revalidatePath("/actividades");
  return { ok: true };
}
