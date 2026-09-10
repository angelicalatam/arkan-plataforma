import Link from "next/link";
import type { Route } from "next";
import {
  UserPlus,
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  HardHat,
  CalendarClock,
  Flag,
  AlertTriangle,
  Percent,
  Wallet,
  Receipt,
  Coins,
  SquareCheckBig,
  Clock,
  ShoppingCart,
  Info,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPendingFollowUps } from "@/lib/rfq/queries";
import { followUpState } from "@/lib/rfq/types";
import { getDueItemReminders } from "@/lib/projects/queries";
import { getDueTasks, getTaskCounts } from "@/lib/tasks/queries";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const [followUps, reminders, dueTasks, taskCounts] = isSupabaseConfigured
    ? await Promise.all([
        getPendingFollowUps(),
        getDueItemReminders(),
        getDueTasks(),
        getTaskCounts(),
      ])
    : [[], [], [], { open: 0, overdue: 0 }];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Panel principal"
        description="Resumen del estado comercial, de obras y financiero de ARKAN."
      />

      {/* Tareas para hoy y vencidas */}
      {dueTasks.length > 0 && (
        <Card className="mb-8">
          <CardHeader title={`Tareas para hoy y vencidas (${dueTasks.length})`} />
          <ul className="divide-y divide-ink-100">
            {dueTasks.map((t) => {
              const overdue = !!t.due_date && t.due_date < today;
              return (
                <li key={t.id}>
                  <Link
                    href={"/tareas" as Route}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <SquareCheckBig className={`h-5 w-5 shrink-0 ${overdue ? "text-red-500" : "text-amber-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-ink-800">{t.title}</span>
                        {overdue ? <Badge tone="red">Vencida</Badge> : <Badge tone="amber">Hoy</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {t.assignee?.name ? <>{t.assignee.name} · </> : null}
                        {t.project?.code || t.project?.name ? <>{t.project?.code || t.project?.name} · </> : null}
                        {t.due_date ? formatDate(t.due_date) : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Recordatorios de obra (notas de partida con fecha) */}
      {reminders.length > 0 && (
        <Card className="mb-8">
          <CardHeader title={`Recordatorios de obra (${reminders.length})`} />
          <ul className="divide-y divide-ink-100">
            {reminders.map((r) => {
              const overdue = r.remind_on < today;
              return (
                <li key={r.id}>
                  <Link
                    href={`/obras/${r.project_id}` as Route}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <CalendarClock className={`h-5 w-5 shrink-0 ${overdue ? "text-red-500" : "text-amber-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-ink-800">{r.content}</span>
                        {overdue ? <Badge tone="red">Vencido</Badge> : <Badge tone="amber">Hoy</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {r.project?.code || r.project?.name || "Obra"}
                        {r.item?.description ? <> · {r.item.description}</> : null} · {formatDate(r.remind_on)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Alertas de seguimiento de peticiones de oferta */}
      {followUps.length > 0 && (
        <Card className="mb-8">
          <CardHeader title={`Peticiones de oferta en espera (${followUps.length})`} />
          <ul className="divide-y divide-ink-100">
            {followUps.map((r) => {
              const fu = followUpState(r);
              return (
                <li key={r.id}>
                  <Link
                    href={`/proveedores/${r.supplier_id}/peticiones/${r.id}` as Route}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <CalendarClock
                      className={`h-5 w-5 shrink-0 ${
                        fu === "vencido" ? "text-red-500" : fu === "hoy" ? "text-amber-500" : "text-ink-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink-900">{r.subject}</span>
                        {fu === "vencido" && <Badge tone="red">Vencido</Badge>}
                        {fu === "hoy" && <Badge tone="amber">Hoy</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {r.supplier?.name}
                        {r.follow_up_date ? <> · Seguimiento: {formatDate(r.follow_up_date)}</> : <> · sin fecha de seguimiento</>}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {!isSupabaseConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div className="text-sm text-brand-900">
            <strong>Modo vista previa.</strong> Estás viendo el diseño de la plataforma.
            Cuando conectemos Supabase, todos estos indicadores mostrarán los datos reales
            de tu empresa.
          </div>
        </div>
      )}

      {/* Comercial / CRM */}
      <Section title="Comercial · CRM">
        <StatCard label="Leads nuevos" value={0} icon={UserPlus} tone="blue" />
        <StatCard label="Prospectos activos" value={0} icon={Users} tone="blue" />
        <StatCard label="Clientes activos" value={0} icon={Users} tone="brand" />
        <StatCard label="Presupuestos enviados" value={0} icon={FileText} tone="ink" />
        <StatCard label="Presupuestos aceptados" value={0} icon={CheckCircle2} tone="green" />
        <StatCard label="Valor del pipeline" value="0 €" icon={TrendingUp} tone="brand" />
        <StatCard label="Tasa de conversión" value="—" icon={Percent} tone="ink" hint="Sin datos aún" />
      </Section>

      {/* Obras */}
      <Section title="Obras">
        <StatCard label="Obras activas" value={0} icon={HardHat} tone="brand" />
        <StatCard label="Próximas a comenzar" value={0} icon={CalendarClock} tone="blue" />
        <StatCard label="Finalizadas" value={0} icon={Flag} tone="green" />
        <StatCard label="Retrasadas" value={0} icon={AlertTriangle} tone="red" />
        <StatCard label="Avance promedio" value="—" icon={Percent} tone="ink" hint="Sin datos aún" />
        <StatCard label="Con incidencias" value={0} icon={AlertTriangle} tone="amber" />
      </Section>

      {/* Finanzas */}
      <Section title="Finanzas">
        <StatCard label="Valor presupuestado" value="0 €" icon={Wallet} tone="ink" />
        <StatCard label="Coste estimado" value="0 €" icon={Coins} tone="ink" />
        <StatCard label="Coste real" value="0 €" icon={Coins} tone="amber" />
        <StatCard label="Margen estimado" value="0 €" icon={TrendingUp} tone="green" />
        <StatCard label="Facturación pendiente" value="0 €" icon={Receipt} tone="blue" />
        <StatCard label="Cobros pendientes" value="0 €" icon={Wallet} tone="red" />
      </Section>

      {/* Operaciones */}
      <Section title="Operaciones">
        <StatCard label="Tareas pendientes" value={taskCounts.open} icon={SquareCheckBig} tone="ink" />
        <StatCard label="Tareas vencidas" value={taskCounts.overdue} icon={Clock} tone="red" />
        <StatCard label="Compras pendientes" value={0} icon={ShoppingCart} tone="amber" />
        <StatCard label="Incidencias abiertas" value={0} icon={AlertTriangle} tone="amber" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {children}
      </div>
    </section>
  );
}
