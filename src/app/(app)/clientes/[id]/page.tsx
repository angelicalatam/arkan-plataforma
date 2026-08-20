import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Wallet,
  CalendarClock,
} from "lucide-react";
import { getCustomer, getCustomerActivities, getTeamMembers } from "@/lib/crm/queries";
import { isGoogleConfigured } from "@/lib/google/config";
import { getGoogleStatus } from "@/lib/google/actions";
import { isEmailConfigured } from "@/lib/email/config";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, stageTone } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { AddActivity } from "./AddActivity";
import { DeleteCustomerButton } from "./DeleteCustomerButton";
import { ScheduleButton } from "./ScheduleButton";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, activities, teamMembers, googleStatus] = await Promise.all([
    getCustomer(id),
    getCustomerActivities(id),
    getTeamMembers(),
    isGoogleConfigured ? getGoogleStatus() : Promise.resolve({ connected: false, email: null }),
  ]);

  if (!customer) notFound();

  const googleConnected = isGoogleConfigured && googleStatus.connected;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Volver */}
      <Link
        href={"/clientes" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Link>

      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink-800 text-lg font-semibold text-white">
            {initials(customer.name)}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{customer.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="ink">{customer.type}</Badge>
              {customer.stage && (
                <Badge tone={stageTone(customer.stage.color)}>{customer.stage.label}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScheduleButton
            customer={{
              id: customer.id,
              name: customer.name,
              email: customer.email,
              address: customer.address,
              city: customer.city,
            }}
            teamMembers={teamMembers}
            googleConnected={googleConnected}
            emailConfigured={isEmailConfigured}
          />
          <Link
            href={`/clientes/${customer.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteCustomerButton id={customer.id} name={customer.name} />
        </div>
      </div>

      {/* Datos rápidos */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Teléfono" value={customer.phone || "—"} icon={Phone} tone="ink" />
        <StatCard label="Email" value={customer.email || "—"} icon={Mail} tone="ink" />
        <StatCard
          label="Valor potencial"
          value={formatCurrency(customer.potential_value)}
          icon={Wallet}
          tone="brand"
        />
        <StatCard
          label="Próximo seguimiento"
          value={formatDate(customer.next_followup)}
          icon={CalendarClock}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Información */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Datos de contacto" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Teléfono" value={customer.phone} />
              <InfoRow icon={MessageCircle} label="WhatsApp" value={customer.whatsapp} />
              <InfoRow icon={Mail} label="Email" value={customer.email} />
              <InfoRow label="Persona de contacto" value={customer.contact_person} />
              <InfoRow label="Cargo" value={customer.contact_role} />
              <InfoRow label="CIF / NIF" value={customer.tax_id} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Dirección" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <InfoRow icon={MapPin} label="Dirección" value={customer.address} />
              <InfoRow label="Ciudad" value={customer.city} />
              <InfoRow label="Código postal" value={customer.postal_code} />
              <InfoRow label="Provincia" value={customer.province} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Información comercial" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <InfoRow label="Fuente del lead" value={customer.lead_source} />
              <InfoRow label="Etapa" value={customer.stage?.label} />
              <InfoRow label="Valor potencial" value={formatCurrency(customer.potential_value)} />
              <InfoRow label="Próximo seguimiento" value={formatDate(customer.next_followup)} />
            </dl>
            {customer.notes && (
              <div className="border-t border-ink-100 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Notas
                </p>
                <p className="whitespace-pre-wrap text-sm text-ink-700">{customer.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Actividades */}
        <div>
          <Card>
            <CardHeader title="Actividades" />
            <div className="border-b border-ink-100 p-4">
              <AddActivity customerId={customer.id} />
            </div>
            <div className="p-4">
              <ActivityTimeline activities={activities} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
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
