import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Mail, MapPin } from "lucide-react";
import { getEmployee, getEmployeeWarnings, getEmployeeNotes } from "@/lib/team/queries";
import { RELATION_TYPES } from "@/lib/team/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { DeleteEmployeeButton } from "./DeleteEmployeeButton";
import { EmployeeWarnings } from "./EmployeeWarnings";
import { EmployeeNotes } from "./EmployeeNotes";

function relLabel(r: string) {
  return RELATION_TYPES.find((x) => x.value === r)?.label ?? r;
}

export default async function PersonaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [employee, warnings, notes] = await Promise.all([
    getEmployee(id),
    getEmployeeWarnings(id),
    getEmployeeNotes(id),
  ]);
  if (!employee) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={"/equipo" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Personal
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink-800 text-lg font-semibold text-white">
            {initials(employee.name)}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{employee.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {employee.position && <Badge tone="brand">{employee.position}</Badge>}
              <Badge tone="ink">{relLabel(employee.relationship)}</Badge>
              {employee.active ? <Badge tone="green">Activo</Badge> : <Badge tone="ink">Inactivo</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/equipo/${employee.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteEmployeeButton id={employee.id} name={employee.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Datos" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <Row label="Rol" value={employee.role} />
              <Row label="Especialidad" value={employee.specialty} />
              <Row label="DNI / NIE" value={employee.dni} />
              <Row label="Cargo" value={employee.position} />
              <Row icon={Phone} label="Teléfono" value={employee.phone} />
              <Row icon={Mail} label="Email" value={employee.email} />
              <Row label="Fecha de nacimiento" value={fmt(employee.birth_date)} />
              <Row label="Incorporación" value={fmt(employee.start_date)} />
              <Row icon={MapPin} label="Dirección" value={employee.address} />
              <Row label="Coste por hora" value={formatCurrency(employee.hourly_cost)} />
            </dl>
          </Card>

          <EmployeeWarnings employeeId={employee.id} warnings={warnings} />
        </div>

        <div className="space-y-5">
          <EmployeeNotes employeeId={employee.id} notes={notes} />
        </div>
      </div>
    </div>
  );
}

function fmt(d: string | null) {
  return d ? formatDate(d) : "—";
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink-800">{value || "—"}</dd>
    </div>
  );
}
