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
      <PageHeader title="Personal" description="Ficha de cada persona: datos, coste por hora, llamados de atención y notas.">
        <Link
          href={"/equipo/nuevo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nueva persona
        </Link>
      </PageHeader>
      <EmployeesTable employees={employees} />
    </div>
  );
}
