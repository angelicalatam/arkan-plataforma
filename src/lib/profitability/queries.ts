import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/projects/queries";
import { projectEconomics, type ProjectItem } from "@/lib/projects/types";
import { computeProfit, type Profit } from "./types";

export type ProfitabilityRow = {
  id: string;
  code: string | null;
  name: string | null;
  status: string;
  customer: { id: string; name: string } | null;
  profit: Profit;
};

/**
 * Rentabilidad de todas las obras: contratado vs coste real
 * (materiales de compras + mano de obra de horas).
 */
export async function getProfitabilityRows(): Promise<ProfitabilityRow[]> {
  const supabase = await createClient();

  const [projects, purchasesRes, timeRes] = await Promise.all([
    getProjects(),
    supabase.from("purchases").select("project_id, quantity, unit_price"),
    supabase.from("time_entries").select("project_id, hours, hourly_cost"),
  ]);

  // Coste real de materiales por obra (suma de subtotales, sin IVA).
  const materialsByProject = new Map<string, number>();
  for (const p of purchasesRes.data ?? []) {
    if (!p.project_id) continue;
    const sub = (Number(p.quantity) || 0) * (Number(p.unit_price) || 0);
    materialsByProject.set(p.project_id, (materialsByProject.get(p.project_id) ?? 0) + sub);
  }

  // Coste real de mano de obra por obra (horas × coste/hora).
  const laborByProject = new Map<string, number>();
  for (const t of timeRes.data ?? []) {
    if (!t.project_id) continue;
    const cost = (Number(t.hours) || 0) * (Number(t.hourly_cost) || 0);
    laborByProject.set(t.project_id, (laborByProject.get(t.project_id) ?? 0) + cost);
  }

  return projects.map((project) => {
    const items = (project.chapters ?? []).flatMap((c) => c.items ?? []) as ProjectItem[];
    const eco = projectEconomics(items);
    const profit = computeProfit({
      contract: Number(project.contract_value) || eco.sale,
      estimatedCost: eco.cost,
      materialsCost: materialsByProject.get(project.id) ?? 0,
      laborCost: laborByProject.get(project.id) ?? 0,
    });
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      customer: project.customer ?? null,
      profit,
    };
  });
}
