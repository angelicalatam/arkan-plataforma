/** Equipo y control de horas (Fase 7). */

export type RelationType = "empleado" | "autonomo" | "subcontrata";

export const RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: "empleado", label: "Empleado" },
  { value: "autonomo", label: "Autónomo" },
  { value: "subcontrata", label: "Subcontrata" },
];

export type Employee = {
  id: string;
  name: string;
  role: string | null;
  specialty: string | null;
  relationship: RelationType;
  phone: string | null;
  email: string | null;
  hourly_cost: number;
  active: boolean;
  notes: string | null;
  dni: string | null;
  position: string | null;
  birth_date: string | null;
  address: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
};

export type WarningSeverity = "leve" | "grave" | "muy_grave";

export const WARNING_SEVERITIES: {
  value: WarningSeverity;
  label: string;
  tone: "amber" | "red" | "ink";
}[] = [
  { value: "leve", label: "Leve", tone: "amber" },
  { value: "grave", label: "Grave", tone: "red" },
  { value: "muy_grave", label: "Muy grave", tone: "red" },
];

export function warningSeverityInfo(severity: string) {
  return WARNING_SEVERITIES.find((s) => s.value === severity) ?? WARNING_SEVERITIES[0];
}

export type EmployeeWarning = {
  id: string;
  employee_id: string;
  warn_date: string;
  reason: string;
  severity: WarningSeverity;
  notes: string | null;
  created_at: string;
};

export type EmployeeNote = {
  id: string;
  employee_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  employee_id: string | null;
  project_id: string;
  project_item_id: string | null;
  work_date: string;
  hours: number;
  hourly_cost: number;
  notes: string | null;
  created_at: string;
  employee?: { id: string; name: string } | null;
  item?: { id: string; description: string } | null;
};

/** Coste de una línea de horas = horas × coste/hora. */
export function entryCost(e: { hours: number; hourly_cost: number }): number {
  return (Number(e.hours) || 0) * (Number(e.hourly_cost) || 0);
}

/** Coste real de mano de obra de una lista de registros. */
export function laborCost(entries: { hours: number; hourly_cost: number }[]): number {
  return entries.reduce((sum, e) => sum + entryCost(e), 0);
}

/** Total de horas. */
export function totalHours(entries: { hours: number }[]): number {
  return entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
}
