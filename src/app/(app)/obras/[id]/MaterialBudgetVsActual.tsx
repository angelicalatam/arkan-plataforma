import { purchaseTotals, type Purchase } from "@/lib/purchases/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { UpdateCostsFromExcel } from "./UpdateCostsFromExcel";

type ItemLite = {
  id: string;
  code: string | null;
  description: string;
  cost_products: number;
  quantity: number;
};

/**
 * Comparativa de productos por partida: lo presupuestado (coste del
 * PRODUCTO del Excel × cantidad) frente a lo realmente comprado
 * (suma de compras enlazadas a esa partida, sin IVA).
 */
export function MaterialBudgetVsActual({
  projectId,
  items,
  purchases,
}: {
  projectId: string;
  items: ItemLite[];
  purchases: Purchase[];
}) {
  // Comprado (sin IVA) agrupado por partida.
  const boughtByItem = new Map<string, number>();
  let boughtNoItem = 0;
  for (const p of purchases) {
    const sub = purchaseTotals(p).subtotal;
    if (p.project_item_id) {
      boughtByItem.set(p.project_item_id, (boughtByItem.get(p.project_item_id) ?? 0) + sub);
    } else {
      boughtNoItem += sub;
    }
  }

  const rows = items
    .map((it) => {
      const budget = (Number(it.cost_products) || 0) * (Number(it.quantity) || 0);
      const real = boughtByItem.get(it.id) ?? 0;
      return { it, budget, real, diff: real - budget };
    })
    .filter((r) => r.budget > 0 || r.real > 0);

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalReal = rows.reduce((s, r) => s + r.real, 0) + boughtNoItem;
  const totalDiff = totalReal - totalBudget;

  if (rows.length === 0 && boughtNoItem === 0) {
    return (
      <Card>
        <CardHeader title="Productos: presupuestado vs comprado" />
        <p className="px-6 py-6 text-center text-sm text-ink-400">
          Aún no hay productos presupuestados ni compras para comparar.
        </p>
        <UpdateCostsFromExcel projectId={projectId} />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Productos: presupuestado vs comprado" />
      <p className="border-b border-ink-100 px-4 py-2 text-xs text-ink-400">
        Comparativa sin IVA. El presupuestado es el coste del PRODUCTO del Excel importado (× cantidad),
        sin los materiales auxiliares de la partida. En rojo = se compró más caro de lo previsto; en verde = ahorro.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-4 py-2 font-semibold">Partida</th>
              <th className="px-4 py-2 text-right font-semibold">Presupuestado</th>
              <th className="px-4 py-2 text-right font-semibold">Comprado</th>
              <th className="px-4 py-2 text-right font-semibold">Diferencia</th>
              <th className="px-4 py-2 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ it, budget, real, diff }) => (
              <tr key={it.id} className="border-b border-ink-50 hover:bg-ink-50">
                <td className="px-4 py-2 text-ink-800">
                  {it.code ? `${it.code} · ` : ""}
                  {it.description}
                </td>
                <td className="px-4 py-2 text-right text-ink-600">{formatCurrency(budget)}</td>
                <td className="px-4 py-2 text-right text-ink-800">{formatCurrency(real)}</td>
                <td className={`px-4 py-2 text-right font-medium ${diffTone(diff)}`}>{diffLabel(diff)}</td>
                <td className={`px-4 py-2 text-right ${diffTone(diff)}`}>
                  {budget > 0 ? `${diff > 0 ? "+" : ""}${((diff / budget) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
            {boughtNoItem > 0 && (
              <tr className="border-b border-ink-50 hover:bg-ink-50">
                <td className="px-4 py-2 italic text-ink-500">Compras sin partida asignada</td>
                <td className="px-4 py-2 text-right text-ink-400">—</td>
                <td className="px-4 py-2 text-right text-ink-800">{formatCurrency(boughtNoItem)}</td>
                <td className="px-4 py-2 text-right text-ink-400">—</td>
                <td className="px-4 py-2 text-right text-ink-400">—</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200 font-semibold">
              <td className="px-4 py-2 text-ink-900">Total</td>
              <td className="px-4 py-2 text-right text-ink-900">{formatCurrency(totalBudget)}</td>
              <td className="px-4 py-2 text-right text-ink-900">{formatCurrency(totalReal)}</td>
              <td className={`px-4 py-2 text-right ${diffTone(totalDiff)}`}>{diffLabel(totalDiff)}</td>
              <td className={`px-4 py-2 text-right ${diffTone(totalDiff)}`}>
                {totalBudget > 0 ? `${totalDiff > 0 ? "+" : ""}${((totalDiff / totalBudget) * 100).toFixed(1)}%` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <UpdateCostsFromExcel projectId={projectId} />
    </Card>
  );
}

function diffTone(diff: number): string {
  if (diff > 0.005) return "text-red-600";
  if (diff < -0.005) return "text-green-600";
  return "text-ink-500";
}

function diffLabel(diff: number): string {
  const sign = diff > 0.005 ? "+" : "";
  return `${sign}${formatCurrency(diff)}`;
}
