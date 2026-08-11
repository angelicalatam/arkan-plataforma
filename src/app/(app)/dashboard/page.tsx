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
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Panel principal"
        description="Resumen del estado comercial, de obras y financiero de ARKAN."
      />

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
        <StatCard label="Tareas pendientes" value={0} icon={SquareCheckBig} tone="ink" />
        <StatCard label="Tareas vencidas" value={0} icon={Clock} tone="red" />
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
