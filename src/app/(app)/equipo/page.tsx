import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { getEmployees } from "@/lib/team/queries";
import { RELATION_TYPES } from "@/lib/team/types";
import { EmployeesTable } from "./EmployeesTable";

function relLabel(r: string) {
  return RELATION_TYPES.find((x) => x.value === r)?.label ?? r;
}

export default async function EquipoPage() {
  const employees = await getEmployees();

  const csvHeaders = [
    "Nombre",
    "Cargo",
    "Rol",
    "Especialidad",
    "Tipo de relación",
    "DNI/NIE",
    "Teléfono",
    "Email",
    "Tel. emergencia",
    "Dirección",
    "Fecha nacimiento",
    "Incorporación",
    "Coste/hora (€)",
    "Estado",
    "Notas",
  ];
  const csvRows = employees.map((e) => [
    e.name,
    e.position ?? "",
    e.role ?? "",
    e.specialty ?? "",
    relLabel(e.relationship),
    e.dni ?? "",
    e.phone ?? "",
    e.email ?? "",
    e.emergency_phone ?? "",
    e.address ?? "",
    e.birth_date ?? "",
    e.start_date ?? "",
    String(e.hourly_cost ?? 0),
    e.active ? "Activo" : "Inactivo",
    e.notes ?? "",
  ]);

  return (
    <div>
      <PageHeader title="Personal" description="Ficha de cada persona: datos, coste por hora, llamados de atención y notas.">
        <div className="flex items-center gap-2">
          <CsvExportButton filename="personal-arkan" headers={csvHeaders} rows={csvRows} />
          <Link
            href={"/equipo/nuevo" as Route}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nueva persona
          </Link>
        </div>
      </PageHeader>
      <EmployeesTable employees={employees} />
    </div>
  );
}
