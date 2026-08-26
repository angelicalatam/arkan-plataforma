import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, HardHat, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getOperation } from "@/lib/operations/queries";
import {
  DOC_TYPES,
  operationStatus,
  missingDocsLabel,
  type DocType,
  type OperationDocument,
} from "@/lib/operations/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { OperationDocSlot } from "./OperationDocSlot";
import { DeleteOperationButton } from "./DeleteOperationButton";

export default async function OperacionPage({
  params,
}: {
  params: Promise<{ id: string; opId: string }>;
}) {
  const { id: supplierId, opId } = await params;
  const op = await getOperation(opId);
  if (!op) notFound();

  const status = operationStatus(op.documents);
  const docByType = new Map<DocType, OperationDocument | undefined>();
  for (const d of DOC_TYPES) {
    docByType.set(d.value, (op.documents ?? []).find((x) => x.doc_type === d.value));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/proveedores/${supplierId}` as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {op.supplier?.name ?? "Proveedor"}
      </Link>

      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Operación {op.reference}
          </h1>
          {op.title && <p className="mt-1 text-ink-600">{op.title}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            {op.supplier && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <Link
                  href={`/proveedores/${op.supplier.id}` as Route}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {op.supplier.name}
                </Link>
              </span>
            )}
            {op.project && (
              <span className="inline-flex items-center gap-1.5">
                <HardHat className="h-3.5 w-3.5" />
                <Link
                  href={`/obras/${op.project.id}` as Route}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {op.project.name || op.project.code || "Obra"}
                </Link>
              </span>
            )}
            {op.amount != null && (
              <span className="font-medium text-ink-700">{formatCurrency(op.amount)}</span>
            )}
          </div>
        </div>
        <DeleteOperationButton id={op.id} supplierId={supplierId} reference={op.reference} />
      </div>

      {/* Estado del ciclo */}
      {status.complete ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          🟢 Documentación completa — los 4 documentos están disponibles.
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              ⚠️ Documentación incompleta — falta{status.missing.length === 1 ? "" : "n"}{" "}
              {status.missing.length} documento{status.missing.length === 1 ? "" : "s"}.
            </p>
            <p>Pendiente: {missingDocsLabel(status.missing)}.</p>
          </div>
        </div>
      )}

      {/* Las 4 ranuras de documentos */}
      <Card>
        <CardHeader title="Documentos de la operación" />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {DOC_TYPES.map((d) => (
            <OperationDocSlot
              key={d.value}
              operationId={op.id}
              supplierId={supplierId}
              docType={d.value}
              index={d.order}
              label={d.label}
              document={docByType.get(d.value)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
