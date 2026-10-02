import { getQuotes } from "@/lib/quotes/queries";
import { quoteTotals, QUOTE_STATUSES } from "@/lib/quotes/types";
import { getProjects } from "@/lib/projects/queries";
import {
  projectEconomics,
  projectProgress,
  PROJECT_STATUSES,
  type ProjectItem,
} from "@/lib/projects/types";
import { getProfitabilityRows, type ProfitabilityRow } from "@/lib/profitability/queries";
import { getCustomers } from "@/lib/crm/queries";

type Tone = "ink" | "amber" | "blue" | "brand" | "green" | "red";
export type StatusBar = { label: string; count: number; value: number; tone: Tone };

export type ReportData = {
  quotes: {
    total: number;
    totalSale: number;
    accepted: number;
    acceptedValue: number;
    conversionPct: number;
    byStatus: StatusBar[];
  };
  projects: {
    total: number;
    contracted: number;
    avgProgress: number;
    estCost: number;
    estMargin: number;
    byStatus: StatusBar[];
  };
  profit: {
    rows: ProfitabilityRow[];
    contract: number;
    realCost: number;
    profit: number;
    marginPct: number;
  };
  customers: { total: number; pipeline: number };
};

export async function getReportData(): Promise<ReportData> {
  const [quotes, projects, profitRows, customers] = await Promise.all([
    getQuotes(),
    getProjects(),
    getProfitabilityRows(),
    getCustomers(),
  ]);

  // ---- Presupuestos ----
  const qByStatus = new Map<string, { count: number; value: number }>();
  let totalSale = 0;
  let accepted = 0;
  let acceptedValue = 0;
  let sentOrMore = 0;
  const closedLike = new Set(["enviado", "en_negociacion", "aceptado", "rechazado", "expirado"]);
  for (const q of quotes) {
    const items = (q.chapters ?? []).flatMap((c) => c.items ?? []);
    const sale = quoteTotals(items, q.tax_rate).sale;
    totalSale += sale;
    const cur = qByStatus.get(q.status) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += sale;
    qByStatus.set(q.status, cur);
    if (q.status === "aceptado") {
      accepted += 1;
      acceptedValue += sale;
    }
    if (closedLike.has(q.status)) sentOrMore += 1;
  }
  const quotesByStatus: StatusBar[] = QUOTE_STATUSES.filter((s) => (qByStatus.get(s.value)?.count ?? 0) > 0).map(
    (s) => ({
      label: s.label,
      count: qByStatus.get(s.value)!.count,
      value: qByStatus.get(s.value)!.value,
      tone: s.tone,
    }),
  );

  // ---- Obras ----
  const pByStatus = new Map<string, number>();
  let contracted = 0;
  let estCost = 0;
  let estMargin = 0;
  let progressSum = 0;
  for (const p of projects) {
    const items = (p.chapters ?? []).flatMap((c) => c.items ?? []) as ProjectItem[];
    const eco = projectEconomics(items);
    contracted += Number(p.contract_value) || eco.sale;
    estCost += eco.cost;
    estMargin += eco.marginEur;
    progressSum += projectProgress(items);
    pByStatus.set(p.status, (pByStatus.get(p.status) ?? 0) + 1);
  }
  const projectsByStatus: StatusBar[] = PROJECT_STATUSES.filter((s) => (pByStatus.get(s.value) ?? 0) > 0).map((s) => ({
    label: s.label,
    count: pByStatus.get(s.value)!,
    value: 0,
    tone: s.tone,
  }));

  // ---- Rentabilidad ----
  const pt = profitRows.reduce(
    (a, r) => {
      a.contract += r.profit.contract;
      a.realCost += r.profit.realCost;
      a.profit += r.profit.profitEur;
      return a;
    },
    { contract: 0, realCost: 0, profit: 0 },
  );

  return {
    quotes: {
      total: quotes.length,
      totalSale,
      accepted,
      acceptedValue,
      conversionPct: sentOrMore > 0 ? (accepted / sentOrMore) * 100 : 0,
      byStatus: quotesByStatus,
    },
    projects: {
      total: projects.length,
      contracted,
      avgProgress: projects.length > 0 ? progressSum / projects.length : 0,
      estCost,
      estMargin,
      byStatus: projectsByStatus,
    },
    profit: {
      rows: profitRows,
      contract: pt.contract,
      realCost: pt.realCost,
      profit: pt.profit,
      marginPct: pt.contract > 0 ? (pt.profit / pt.contract) * 100 : 0,
    },
    customers: {
      total: customers.length,
      pipeline: customers.reduce((s, c) => s + (Number(c.potential_value) || 0), 0),
    },
  };
}
