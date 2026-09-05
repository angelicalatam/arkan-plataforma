import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEmployee } from "@/lib/team/queries";
import { EmployeeForm } from "../../EmployeeForm";
import { DeleteEmployeeButton } from "../DeleteEmployeeButton";

export default async function EditarMiembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={"/equipo" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Equipo
      </Link>
      <div className="mb-4 flex items-center justify-between gap-3">
        <PageHeader title={employee.name} description="Editar miembro del equipo." />
        <DeleteEmployeeButton id={employee.id} name={employee.name} />
      </div>
      <EmployeeForm employee={employee} />
    </div>
  );
}
