/**
 * Roles de la plataforma (sección 28 del prompt maestro).
 * Los permisos finos se afinarán más adelante; aquí se definen los roles base.
 */
export const APP_ROLES = [
  "admin",
  "gerente",
  "comercial",
  "jefe_obra",
  "operario",
  "administracion",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

const LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  comercial: "Comercial",
  jefe_obra: "Jefe de obra",
  operario: "Operario",
  administracion: "Administración",
};

export function roleLabel(role: AppRole): string {
  return LABELS[role] ?? "Usuario";
}
