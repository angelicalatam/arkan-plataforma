/** Peticiones de oferta a proveedores (con planos, envío por correo y seguimiento). */

export const PETICION_BUCKET = "peticiones";

export type RfqStatus = "borrador" | "enviada" | "recibida" | "cerrada" | "cancelada";

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export const RFQ_STATUSES: { value: RfqStatus; label: string; tone: Tone }[] = [
  { value: "borrador", label: "Borrador", tone: "ink" },
  { value: "enviada", label: "Enviada · esperando oferta", tone: "blue" },
  { value: "recibida", label: "Oferta recibida", tone: "green" },
  { value: "cerrada", label: "Cerrada", tone: "ink" },
  { value: "cancelada", label: "Cancelada", tone: "red" },
];

export function rfqStatusInfo(status: string) {
  return RFQ_STATUSES.find((s) => s.value === status) ?? RFQ_STATUSES[0];
}

export type RfqFileKind = "peticion" | "plano" | "oferta" | "otro";

export const RFQ_FILE_KINDS: { value: RfqFileKind; label: string }[] = [
  { value: "peticion", label: "Petición de oferta" },
  { value: "plano", label: "Plano" },
  { value: "oferta", label: "Oferta recibida" },
  { value: "otro", label: "Otro documento" },
];

export function fileKindLabel(kind: string) {
  return RFQ_FILE_KINDS.find((k) => k.value === kind)?.label ?? "Documento";
}

export type RfqFile = {
  id: string;
  rfq_id: string;
  kind: RfqFileKind;
  name: string;
  url: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

export type Rfq = {
  id: string;
  code: string | null;
  supplier_id: string;
  project_id: string | null;
  subject: string;
  message: string | null;
  status: RfqStatus;
  sent_at: string | null;
  follow_up_date: string | null;
  response_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string; email: string | null } | null;
  project?: { id: string; name: string | null; code: string | null } | null;
  files?: RfqFile[];
};

/** Estado del seguimiento de una petición enviada. */
export type FollowUpState = "vencido" | "hoy" | "proximo" | "sin_fecha" | "no_aplica";

export function followUpState(rfq: {
  status: string;
  follow_up_date: string | null;
}): FollowUpState {
  if (rfq.status !== "enviada") return "no_aplica";
  if (!rfq.follow_up_date) return "sin_fecha";
  const today = new Date().toISOString().slice(0, 10);
  if (rfq.follow_up_date < today) return "vencido";
  if (rfq.follow_up_date === today) return "hoy";
  return "proximo";
}
