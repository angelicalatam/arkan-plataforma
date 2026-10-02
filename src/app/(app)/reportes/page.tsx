import { FileText, CheckCircle2, Percent, Users, Wallet, HardHat, Coins, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getReportData, type StatusBar } from "@/lib/reports/queries";
import { ReportActions } from "./ReportActions";

const BAR_TONE: Record<string, string> = {
  ink: "bg-ink-400",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  brand: "bg-brand-500",
  green: "bg-green-500",
  red: "bg-red-500",
};

export default async function ReportesPage() {
  const data = await getReportData();

  const csvHeaders = ["Obra", "Cliente", "Contratado", "Coste real", "Beneficio", "Margen %"];
  const csvRows = data.profit.rows.map((r) => [
    r.code || "",
    r.customer?.name || "",
    r.profit.contract.toFixed(2),
    r.profit.realCost.toFixed(2),
    r.profit.profitEur.toFixed(2),
    r.profit.marginPct.toFixed(1),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Reportes" description="Resumen comercial, de obras y de rentabilidad de ARKAN." />
        <ReportActions filename="reporte-arkan" headers={csvHeaders} rows={csvRows} />
      </div>

      {/* Comercial */}
      <Section title="Comercial">
        <StatCard label="Presupuestos" value={data.quotes.total} icon={FileText} tone="ink" />
        <StatCard label="Valor presupuestado" value={formatCurrency(data.quotes.totalSale)} icon={Wallet} tone="brand" />
        <StatCard label="Aceptados" value={data.quotes.accepted} hint={formatCurrency(data.quotes.acceptedValue)} icon={CheckCircle2} tone="green" />
        <StatCard label="Tasa de aceptación" value={`${data.quotes.conversionPct.toFixed(0)}%`} icon={Percent} tone="blue" />
        <StatCard label="Clientes" value={data.customers.total} icon={Users} tone="ink" />
        <StatCard label="Pipeline" value={formatCurrency(data.customers.pipeline)} icon={TrendingUp} tone="brand" />
      </Section>

      <div className="mb-8">
        <Card>
          <CardHeader title="Presupuestos por estado" />
          <BarChart bars={data.quotes.byStatus} showValue />
        </Card>
      </div>

      {/* Obras */}
      <Section title="Obras">
        <StatCard label="Obras" value={data.projects.total} icon={HardHat} tone="brand" />
        <StatCard label="Valor contratado" value={formatCurrency(data.projects.contracted)} icon={Wallet} tone="ink" />
        <StatCard label="Avance medio" value={`${Math.round(data.projects.avgProgress)}%`} icon={Percent} tone="blue" />
        <StatCard label="Coste estimado" value={formatCurrency(data.projects.estCost)} icon={Coins} tone="ink" />
        <StatCard label="Margen estimado" value={formatCurrency(data.projects.estMargin)} icon={TrendingUp} tone="green" />
      </Section>

      <div className="mb-8">
        <Card>
          <CardHeader title="Obras por estado" />
          <BarChart bars={data.projects.byStatus} />
        </Card>
      </div>

      {/* Rentabilidad */}
      <Section title="Rentabilidad">
        <StatCard label="Contratado (total)" value={formatCurrency(data.profit.contract)} icon={Wallet} tone="brand" />
        <StatCard label="Coste real (total)" value={formatCurrency(data.profit.realCost)} icon={Coins} tone="ink" />
        <StatCard label="Beneficio real (total)" value={formatCurrency(data.profit.profit)} icon={TrendingUp} tone={data.profit.profit >= 0 ? "green" : "red"} />
        <StatCard label="Margen real" value={`${data.profit.marginPct.toFixed(1)}%`} icon={Percent} tone="blue" />
      </Section>

      <Card>
        <CardHeader title={`Rentabilidad por obra (${data.profit.rows.length})`} />
        {data.profit.rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-400">Todavía no hay obras.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-2 font-semibold">Obra</th>
                  <th className="px-4 py-2 text-right font-semibold">Contratado</th>
                  <th className="px-4 py-2 text-right font-semibold">Coste real</th>
                  <th className="px-4 py-2 text-right font-semibold">Beneficio</th>
                  <th className="px-4 py-2 text-right font-semibold">Margen</th>
                </tr>
              </thead>
              <tbody>
                {data.profit.rows.map((r) => (
                  <tr key={r.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2 text-ink-800">
                      {r.code || "Obra"}
                      {r.customer && <span className="block text-xs text-ink-400">{r.customer.name}</span>}
                    </td>
                    <td className="px-4 py-2 text-right text-ink-700">{formatCurrency(r.profit.contract)}</td>
                    <td className="px-4 py-2 text-right text-ink-700">{formatCurrency(r.profit.realCost)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${r.profit.profitEur >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {formatCurrency(r.profit.profitEur)}
                    </td>
                    <td className="px-4 py-2 text-right text-ink-700">{r.profit.marginPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 mt-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>
    </section>
  );
}

function BarChart({ bars, showValue }: { bars: StatusBar[]; showValue?: boolean }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  if (bars.length === 0) {
    return <p className="px-6 py-6 text-center text-sm text-ink-400">Sin datos todavía.</p>;
  }
  return (
    <div className="space-y-2 p-4">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-ink-600">{b.label}</span>
          <div className="relative h-6 flex-1 overflow-hidden rounded bg-ink-100">
            <div className={`h-full rounded ${BAR_TONE[b.tone] ?? "bg-ink-400"}`} style={{ width: `${(b.count / max) * 100}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-semibold text-ink-800">{b.count}</span>
          {showValue && <span className="w-28 shrink-0 text-right text-xs text-ink-400">{formatCurrency(b.value)}</span>}
        </div>
      ))}
    </div>
  );
}
