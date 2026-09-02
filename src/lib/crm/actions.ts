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

/** Quita acentos y pasa a minúsculas, para buscar sin importar tildes/mayúsculas. */
function normalizeText(s: string): string {
  let out = "";
  for (const ch of s.normalize("NFD")) {
    const c = ch.codePointAt(0) ?? 0;
    if (c >= 0x300 && c <= 0x36f) continue; // omitir marcas de acento
    out += ch;
  }
  return out.toLowerCase().trim();
}

/** Busca contactos (clientes) para invitarlos a una cita. Tolerante a acentos. */
export async function searchCustomerContacts(
  term: string,
): Promise<{ id: string; name: string; email: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, email")
    .order("name")
    .limit(1000);
  const rows = (data ?? []) as { id: string; name: string; email: string | null }[];

  const t = normalizeText(term);
  const matches = t
    ? rows.filter(
        (r) =>
          normalizeText(r.name).includes(t) ||
          normalizeText(r.email ?? "").includes(t),
      )
    : rows;
  return matches.slice(0, 25);
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
// PERSONAS DE CONTACTO DEL PROVEEDOR (varias por proveedor)
// ---------------------------------------------------------------
export type SupplierContactInput = {
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export async function addSupplierContact(
  supplierId: string,
  input: SupplierContactInput,
): Promise<ActionResult> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplier_contacts")
    .insert(clean({ supplier_id: supplierId, ...input }));
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  return { ok: true };
}

export async function updateSupplierContact(
  id: string,
  supplierId: string,
  input: SupplierContactInput,
): Promise<ActionResult> {
  if (!input.name?.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { error } = await supabase.from("supplier_contacts").update(clean({ ...input })).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
  return { ok: true };
}

export async function deleteSupplierContact(
  id: string,
  supplierId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("supplier_contacts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proveedores/${supplierId}`);
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
