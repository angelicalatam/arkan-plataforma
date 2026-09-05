import Link from "next/link";
import type { Route } from "next";
import { Wallet, Coins, TrendingUp, Percent } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { projectStatusInfo } from "@/lib/projects/types";
import { getProfitabilityRows } from "@/lib/profitability/queries";

export default async function RentabilidadPage() {
  const rows = await getProfitabilityRows();

  const totals = rows.reduce(
    (a, r) => {
      a.contract += r.profit.contract;
      a.realCost += r.profit.realCost;
      a.profit += r.profit.profitEur;
      return a;
    },
    { contract: 0, realCost: 0, profit: 0 },
  );
  const avgMargin = totals.contract > 0 ? (totals.profit / totals.contract) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Rentabilidad por obra"
        description="Compara lo contratado con el coste real (materiales de compras + mano de obra de horas)."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Contratado (total)" value={formatCurrency(totals.contract)} icon={Wallet} tone="brand" />
        <StatCard label="Coste real (total)" value={formatCurrency(totals.realCost)} icon={Coins} tone="ink" />
        <StatCard
          label="Beneficio real (total)"
          value={formatCurrency(totals.profit)}
          icon={TrendingUp}
          tone={totals.profit >= 0 ? "green" : "red"}
        />
        <StatCard label="Margen medio" value={`${avgMargin.toFixed(1)}%`} icon={Percent} tone="blue" />
      </div>

      <Card>
        <CardHeader title={`Obras (${rows.length})`} />
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-400">
            Todavía no hay obras. Convierte un presupuesto en obra para ver su rentabilidad.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-2 font-semibold">Obra</th>
                  <th className="px-4 py-2 font-semibold">Estado</th>
                  <th className="px-4 py-2 text-right font-semibold">Contratado</th>
                  <th className="px-4 py-2 text-right font-semibold">Coste real</th>
                  <th className="px-4 py-2 text-right font-semibold">Beneficio</th>
                  <th className="px-4 py-2 text-right font-semibold">Margen</th>
                  <th className="px-4 py-2 text-right font-semibold">Desv. s/ estimado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const si = projectStatusInfo(r.status);
                  const p = r.profit;
                  return (
                    <tr key={r.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                      <td className="px-4 py-2">
                        <Link href={`/obras/${r.id}` as Route} className="font-medium text-ink-800 hover:text-brand-700">
                          {r.code || "Obra"}
                        </Link>
                        {(r.name || r.customer) && (
                          <div className="text-xs text-ink-400">
                            {r.name}
                            {r.name && r.customer ? " · " : ""}
                            {r.customer?.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Badge tone={si.tone}>{si.label}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right text-ink-700">{formatCurrency(p.contract)}</td>
                      <td className="px-4 py-2 text-right text-ink-700">
                        {formatCurrency(p.realCost)}
                        <div className="text-[10px] text-ink-400">
                          Mat. {formatCurrency(p.materialsCost)} · MO {formatCurrency(p.laborCost)}
                        </div>
                      </td>
                      <td className={`px-4 py-2 text-right font-semibold ${p.profitEur >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {formatCurrency(p.profitEur)}
                      </td>
                      <td className={`px-4 py-2 text-right ${p.marginPct >= 0 ? "text-ink-700" : "text-red-600"}`}>
                        {p.marginPct.toFixed(1)}%
                      </td>
                      <td className={`px-4 py-2 text-right ${p.costDeviation > 0 ? "text-red-600" : "text-ink-500"}`}>
                        {p.costDeviation > 0 ? "+" : ""}
                        {formatCurrency(p.costDeviation)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-3 text-xs text-ink-400">
        El coste real se calcula con las compras registradas (materiales) y las horas registradas
        (mano de obra). Cuantas más compras y horas registres en cada obra, más fiable será la
        rentabilidad.
      </p>
    </div>
  );
}
