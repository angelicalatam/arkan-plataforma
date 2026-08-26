import { itemTotals } from "@/lib/quotes/types";

export type ProjectStatus =
  | "preparacion"
  | "pendiente_inicio"
  | "en_ejecucion"
  | "pausada"
  | "retrasada"
  | "finalizacion"
  | "finalizada"
  | "postventa"
  | "cerrada";

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; tone: Tone }[] = [
  { value: "preparacion", label: "Preparación", tone: "ink" },
  { value: "pendiente_inicio", label: "Pendiente de inicio", tone: "blue" },
  { value: "en_ejecucion", label: "En ejecución", tone: "brand" },
  { value: "pausada", label: "Pausada", tone: "amber" },
  { value: "retrasada", label: "Retrasada", tone: "red" },
  { value: "finalizacion", label: "Finalización", tone: "amber" },
  { value: "finalizada", label: "Finalizada", tone: "green" },
  { value: "postventa", label: "Postventa", tone: "blue" },
  { value: "cerrada", label: "Cerrada", tone: "ink" },
];

export function projectStatusInfo(status: string) {
  return PROJECT_STATUSES.find((s) => s.value === status) ?? PROJECT_STATUSES[0];
}

export type ItemStatus =
  | "pendiente"
  | "en_proceso"
  | "parcial"
  | "terminado"
  | "bloqueado";

export const ITEM_STATUSES: { value: ItemStatus; label: string; tone: Tone }[] = [
  { value: "pendiente", label: "Pendiente", tone: "ink" },
  { value: "en_proceso", label: "En proceso", tone: "blue" },
  { value: "parcial", label: "Parcialmente ejecutado", tone: "amber" },
  { value: "terminado", label: "Terminado", tone: "green" },
  { value: "bloqueado", label: "Bloqueado", tone: "red" },
];

export function itemStatusInfo(status: string) {
  return ITEM_STATUSES.find((s) => s.value === status) ?? ITEM_STATUSES[0];
}

export type ProjectItem = {
  id: string;
  project_id: string;
  chapter_id: string;
  code: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  cost_labor: number;
  cost_materials: number;
  cost_other: number;
  margin_pct: number;
  est_hours: number | null;
  est_workers: number | null;
  pct_done: number;
  item_status: ItemStatus;
  notes: string | null;
  position: number;
};

export type ProjectChapter = {
  id: string;
  project_id: string;
  code: string | null;
  name: string;
  position: number;
  items?: ProjectItem[];
};

export type Project = {
  id: string;
  code: string | null;
  name: string | null;
  customer_id: string | null;
  quote_id: string | null;
  address: string | null;
  responsible_id: string | null;
  status: ProjectStatus;
  start_planned: string | null;
  end_planned: string | null;
  start_real: string | null;
  end_real: string | null;
  contract_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: { id: string; name: string } | null;
  chapters?: ProjectChapter[];
};

/** Coste, venta y margen estimados de la obra (a partir de las partidas). */
export function projectEconomics(items: ProjectItem[]) {
  let cost = 0;
  let sale = 0;
  for (const it of items) {
    const t = itemTotals(it);
    cost += t.lineCost;
    sale += t.lineSale;
  }
  return { cost, sale, marginEur: sale - cost, marginPct: cost > 0 ? ((sale - cost) / cost) * 100 : 0 };
}

/** % de avance de la obra, ponderado por el importe de cada partida. */
export function projectProgress(items: ProjectItem[]): number {
  let weight = 0;
  let acc = 0;
  for (const it of items) {
    const w = itemTotals(it).lineSale || 1;
    weight += w;
    acc += w * (Number(it.pct_done) || 0);
  }
  return weight > 0 ? acc / weight : 0;
}
