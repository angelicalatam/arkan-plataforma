import Link from "next/link";
import type { Route } from "next";
import {
  Phone,
  MessageCircle,
  Mail,
  Users,
  MapPin,
  CalendarClock,
  StickyNote,
  Activity as ActivityIcon,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { getRecentActivities } from "@/lib/crm/queries";
import type { ActivityType } from "@/lib/crm/types";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<ActivityType, LucideIcon> = {
  llamada: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reunion: Users,
  visita: MapPin,
  cita: CalendarClock,
  nota: StickyNote,
};

const LABELS: Record<ActivityType, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
  reunion: "Reunión",
  visita: "Visita",
  cita: "Cita",
  nota: "Nota",
};

export default async function ActividadesPage() {
  const activities = await getRecentActivities();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Actividades"
        description="Registro cronológico de interacciones con clientes y proveedores."
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="Aún no hay actividades"
          description="Las llamadas, visitas y notas que registres en las fichas aparecerán aquí."
        />
      ) : (
        <Card className="p-4 sm:p-6">
          <ul className="space-y-4">
            {activities.map((a) => {
              const Icon = ICONS[a.type] ?? StickyNote;
              const related = a.customer
                ? { label: a.customer.name, href: `/clientes/${a.customer.id}` }
                : a.supplier
                  ? { label: a.supplier.name, href: `/proveedores/${a.supplier.id}` }
                  : null;
              return (
                <li key={a.id} className="flex gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-ink-900">
                        {a.subject || LABELS[a.type]}
                      </span>
                      <span className="shrink-0 text-xs text-ink-400">
                        {formatDateTime(a.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-400">
                      <span className="uppercase tracking-wide">{LABELS[a.type]}</span>
                      {related && (
                        <>
                          <span>·</span>
                          <Link
                            href={related.href as Route}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {related.label}
                          </Link>
                        </>
                      )}
                    </div>
                    {a.body && <p className="mt-1 text-sm text-ink-600">{a.body}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
