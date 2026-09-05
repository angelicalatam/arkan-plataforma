import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEmployees } from "@/lib/team/queries";
import { EmployeesTable } from "./EmployeesTable";

export default async function EquipoPage() {
  const employees = await getEmployees();

  return (
    <div>
      <PageHeader title="Equipo" description="Operarios y colaboradores, con su coste por hora.">
        <Link
          href={"/equipo/nuevo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo miembro
        </Link>
      </PageHeader>
      <EmployeesTable employees={employees} />
    </div>
  );
}
