/** Tipos del CRM (Fase 2). Coinciden con las tablas de la migración 0002. */

export type CustomerType =
  | "particular"
  | "empresa"
  | "inmobiliaria"
  | "aseguradora"
  | "otro";

export const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
  { value: "particular", label: "Particular" },
  { value: "empresa", label: "Empresa" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "aseguradora", label: "Aseguradora" },
  { value: "otro", label: "Otro" },
];

export type ActivityType =
  | "llamada"
  | "whatsapp"
  | "email"
  | "reunion"
  | "visita"
  | "nota";

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "llamada", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "reunion", label: "Reunión" },
  { value: "visita", label: "Visita" },
  { value: "nota", label: "Nota" },
];

export type CrmStage = {
  id: string;
  key: string;
  label: string;
  position: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
};

export type Customer = {
  id: string;
  name: string;
  type: CustomerType;
  tax_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  country: string | null;
  contact_person: string | null;
  contact_role: string | null;
  lead_source: string | null;
  stage_id: string | null;
  status: string;
  owner_id: string | null;
  potential_value: number | null;
  probability: number | null;
  notes: string | null;
  tags: string[];
  last_contact: string | null;
  next_followup: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Relación cargada opcionalmente. */
  stage?: CrmStage | null;
};

export type Supplier = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  contact_person: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  website: string | null;
  category: string | null;
  subcategory: string | null;
  products_services: string | null;
  payment_terms: string | null;
  payment_method: string | null;
  delivery_time: string | null;
  service_zone: string | null;
  notes: string | null;
  rating_price: number | null;
  rating_quality: number | null;
  rating_delivery: number | null;
  rating_reliability: number | null;
  rating_service: number | null;
  rating_overall: number | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  subject: string | null;
  body: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  due_date: string | null;
  done: boolean;
  created_by: string | null;
  created_at: string;
};
