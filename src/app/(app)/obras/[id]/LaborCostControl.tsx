"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateItemReal } from "@/lib/projects/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";
import { formatCurrency } from "@/lib/format";

export type LaborItem = {
  id: string;
  code: string | null;
  description: string;
  quantity: number;
  cost_labor: number;
  cost_materials: number;
  cost_products: number;
  real_labor: number;
  real_materials: number;
};

// Acepta coma o punto como separador decimal; vacío = 0.
function num(v: string): number {
  const n = Number((v || "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function diffTone(d: number): string {
  if (d > 0.005) return "text-red-600";
  if (d < -0.005) return "text-green-600";
  return "text-ink-500";
}
function diffLabel(d: number): string {
  return `${d > 0.005 ? "+" : ""}${formatCurrency(d)}`;
}

function budgetLaborOf(it: LaborItem) {
  return (Number(it.cost_labor) || 0) * (Number(it.quantity) || 0);
}
function budgetMatOf(it: LaborItem) {
  // Materiales de la fila "Partida descripción" = materiales totales − producto.
  const base = Math.max(0, (Number(it.cost_materials) || 0) - (Number(it.cost_products) || 0));
  return base * (Number(it.quantity) || 0);
}

export function LaborCostControl({ projectId, items }: { projectId: string; items: LaborItem[] }) {
  const rows = items.filter(
    (it) =>
      budgetLaborOf(it) > 0 ||
      budgetMatOf(it) > 0 ||
      Number(it.real_labor) > 0 ||
      Number(it.real_materials) > 0,
  );

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader title="Mano de obra y materiales: presupuestado vs real" />
        <p className="px-6 py-6 text-center text-sm text-ink-400">
          Esta obra no tiene partidas con mano de obra o materiales presupuestados.
        </p>
      </Card>
    );
  }

  const tBudgetLabor = rows.reduce((s, it) => s + budgetLaborOf(it), 0);
  const tRealLabor = rows.reduce((s, it) => s + (Number(it.real_labor) || 0), 0);
  const tBudgetMat = rows.reduce((s, it) => s + budgetMatOf(it), 0);
  const tRealMat = rows.reduce((s, it) => s + (Number(it.real_materials) || 0), 0);

  return (
    <Card>
      <CardHeader title="Mano de obra y materiales: presupuestado vs real" />
      <p className="border-b border-ink-100 px-4 py-2 text-[11px] text-ink-400">
        Presupuestado = del Excel (M.O. y materiales de la partida, × cantidad), sin IVA. Escribe el
        coste real de cada partida. En rojo = más caro de lo previsto; en verde = ahorro.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-3 py-2 font-semibold">Partida</th>
              <th className="px-3 py-2 text-right font-semibold">M.O. presup.</th>
              <th className="px-3 py-2 text-right font-semibold">M.O. real</th>
              <th className="px-3 py-2 text-right font-semibold">Dif. M.O.</th>
              <th className="px-3 py-2 text-right font-semibold">Mat. presup.</th>
              <th className="px-3 py-2 text-right font-semibold">Mat. real</th>
              <th className="px-3 py-2 text-right font-semibold">Dif. mat.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it) => (
              <Row key={it.id} projectId={projectId} it={it} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200 font-semibold">
              <td className="px-3 py-2 text-ink-900">Total</td>
              <td className="px-3 py-2 text-right text-ink-900">{formatCurrency(tBudgetLabor)}</td>
              <td className="px-3 py-2 text-right text-ink-900">{formatCurrency(tRealLabor)}</td>
              <td className={`px-3 py-2 text-right ${diffTone(tRealLabor - tBudgetLabor)}`}>
                {diffLabel(tRealLabor - tBudgetLabor)}
              </td>
              <td className="px-3 py-2 text-right text-ink-900">{formatCurrency(tBudgetMat)}</td>
              <td className="px-3 py-2 text-right text-ink-900">{formatCurrency(tRealMat)}</td>
              <td className={`px-3 py-2 text-right ${diffTone(tRealMat - tBudgetMat)}`}>
                {diffLabel(tRealMat - tBudgetMat)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function Row({ projectId, it }: { projectId: string; it: LaborItem }) {
  const router = useRouter();
  const [labor, setLabor] = useState(it.real_labor ? String(it.real_labor) : "");
  const [materials, setMaterials] = useState(it.real_materials ? String(it.real_materials) : "");

  const budgetLabor = budgetLaborOf(it);
  const budgetMat = budgetMatOf(it);
  const realLabor = num(labor);
  const realMat = num(materials);
  const diffLabor = realLabor - budgetLabor;
  const diffMat = realMat - budgetMat;

  async function saveLabor() {
    if (num(labor) === Number(it.real_labor)) return;
    await updateItemReal(it.id, projectId, { real_labor: num(labor) });
    router.refresh();
  }
  async function saveMaterials() {
    if (num(materials) === Number(it.real_materials)) return;
    await updateItemReal(it.id, projectId, { real_materials: num(materials) });
    router.refresh();
  }

  return (
    <tr className="border-b border-ink-50 hover:bg-ink-50">
      <td className="px-3 py-2 text-ink-800">
        {it.code ? `${it.code} · ` : ""}
        {it.description}
      </td>
      <td className="px-3 py-2 text-right text-ink-600">{budgetLabor > 0 ? formatCurrency(budgetLabor) : "—"}</td>
      <td className="px-3 py-2 text-right">
        <input
          type="text"
          inputMode="decimal"
          className={`${inputClass} w-24 text-right`}
          value={labor}
          onChange={(e) => setLabor(e.target.value)}
          onBlur={saveLabor}
          placeholder="0,00"
        />
      </td>
      <td className={`px-3 py-2 text-right font-medium ${budgetLabor > 0 || realLabor > 0 ? diffTone(diffLabor) : "text-ink-300"}`}>
        {budgetLabor > 0 || realLabor > 0 ? diffLabel(diffLabor) : "—"}
      </td>
      <td className="px-3 py-2 text-right text-ink-600">{budgetMat > 0 ? formatCurrency(budgetMat) : "—"}</td>
      <td className="px-3 py-2 text-right">
        <input
          type="text"
          inputMode="decimal"
          className={`${inputClass} w-24 text-right`}
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          onBlur={saveMaterials}
          placeholder="0,00"
        />
      </td>
      <td className={`px-3 py-2 text-right font-medium ${budgetMat > 0 || realMat > 0 ? diffTone(diffMat) : "text-ink-300"}`}>
        {budgetMat > 0 || realMat > 0 ? diffLabel(diffMat) : "—"}
      </td>
    </tr>
  );
}
