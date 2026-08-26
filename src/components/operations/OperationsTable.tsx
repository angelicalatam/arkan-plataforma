"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import type { SupplierOperation } from "@/lib/operations/types";
import { DOC_TYPES, operationStatus } from "@/lib/operations/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export function OperationsTable({
  operations,
  show,
}: {
  operations: SupplierOperation[];
  /** Columna extra a mostrar: la obra (vista proveedor) o el proveedor (vista obra). */
  show: "obra" | "proveedor";
}) {
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const withStatus = useMemo(
    () => operations.map((op) => ({ op, status: operationStatus(op.documents) })),
    [operations],
  );

  const completeCount = withStatus.filter((x) => x.status.complete).length;
  const incompleteCount = withStatus.length - completeCount;

  const rows = onlyIncomplete ? withStatus.filter((x) => !x.status.complete) : withStatus;

  if (operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
        <FileText className="h-8 w-8 text-ink-300" />
        <p className="mt-2 text-sm text-ink-400">Aún no hay operaciones documentales.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Resumen + filtro */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-2.5">
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-green-700">
            <CheckCircle2 className="h-4 w-4" /> {completeCount} completas
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <Circle className="h-4 w-4" /> {incompleteCount} incompletas
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={onlyIncomplete}
            onChange={(e) => setOnlyIncomplete(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Mostrar solo incompletas
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="px-3 py-2 font-semibold">Operación</th>
              <th className="px-3 py-2 font-semibold">{show === "obra" ? "Obra" : "Proveedor"}</th>
              {DOC_TYPES.map((d) => (
                <th key={d.value} className="px-2 py-2 text-center font-semibold" title={d.label}>
                  {d.label.split(" ")[0]}
                </th>
              ))}
              <th className="px-3 py-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ op, status }) => {
              const present = new Set(status.present);
              return (
                <tr key={op.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                  <td className="px-3 py-2">
                    <Link
                      href={`/proveedores/${op.supplier_id}/operaciones/${op.id}` as Route}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {op.reference}
                    </Link>
                    <div className="text-xs text-ink-400">{formatDate(op.created_at)}</div>
                  </td>
                  <td className="px-3 py-2 text-ink-600">
                    {show === "obra"
                      ? op.project?.name || op.project?.code || "—"
                      : op.supplier?.name || "—"}
                  </td>
                  {DOC_TYPES.map((d) => (
                    <td key={d.value} className="px-2 py-2 text-center">
                      {present.has(d.value) ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="mx-auto h-4 w-4 text-ink-300" />
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {status.complete ? (
                      <Badge tone="green">Completa</Badge>
                    ) : (
                      <Badge tone="amber">
                        Faltan {status.missing.length}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
