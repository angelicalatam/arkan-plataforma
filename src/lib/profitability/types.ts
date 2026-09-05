/** Rentabilidad por obra: compara lo contratado con el coste real. */

export type ProfitInput = {
  contract: number; // importe contratado (venta)
  estimatedCost: number; // coste estimado (presupuestado)
  materialsCost: number; // coste real de materiales (compras)
  laborCost: number; // coste real de mano de obra (horas)
};

export type Profit = {
  contract: number;
  estimatedCost: number;
  materialsCost: number;
  laborCost: number;
  realCost: number; // materiales + mano de obra
  profitEur: number; // beneficio real = contratado - coste real
  marginPct: number; // margen real sobre la venta (%)
  costDeviation: number; // coste real - coste estimado (+ = sobrecoste)
  costDeviationPct: number; // desviación en % sobre el coste estimado
};

export function computeProfit(i: ProfitInput): Profit {
  const contract = Number(i.contract) || 0;
  const estimatedCost = Number(i.estimatedCost) || 0;
  const materialsCost = Number(i.materialsCost) || 0;
  const laborCost = Number(i.laborCost) || 0;
  const realCost = materialsCost + laborCost;
  const profitEur = contract - realCost;
  const marginPct = contract > 0 ? (profitEur / contract) * 100 : 0;
  const costDeviation = realCost - estimatedCost;
  const costDeviationPct = estimatedCost > 0 ? (costDeviation / estimatedCost) * 100 : 0;
  return {
    contract,
    estimatedCost,
    materialsCost,
    laborCost,
    realCost,
    profitEur,
    marginPct,
    costDeviation,
    costDeviationPct,
  };
}
