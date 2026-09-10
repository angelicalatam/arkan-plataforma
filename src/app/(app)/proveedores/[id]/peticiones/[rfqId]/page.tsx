import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { getRfq } from "@/lib/rfq/queries";
import { rfqStatusInfo, followUpState } from "@/lib/rfq/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { RfqFiles } from "./RfqFiles";
import { SendRfqPanel } from "./SendRfqPanel";
import { RfqControls } from "./RfqControls";

export default async function PeticionDetallePage({
  params,
}: {
  params: Promise<{ id: string; rfqId: string }>;
}) {
  const { id, rfqId } = await params;
  const rfq = await getRfq(rfqId);
  if (!rfq || rfq.supplier_id !== id) notFound();

  const si = rfqStatusInfo(rfq.status);
  const fu = followUpState(rfq);
  const files = rfq.files ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/proveedores/${id}` as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al proveedor
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{rfq.code || "Petición"}</h1>
            <Badge tone={si.tone}>{si.label}</Badge>
            {fu === "vencido" && <Badge tone="red">Seguimiento vencido</Badge>}
            {fu === "hoy" && <Badge tone="amber">Seguimiento hoy</Badge>}
          </div>
          <p className="mt-1 text-ink-700">{rfq.subject}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-ink-500">
            {rfq.supplier && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {rfq.supplier.name}
              </span>
            )}
            {rfq.project && <span>Obra: {rfq.project.code || rfq.project.name}</span>}
            {rfq.sent_at && <span>Enviada: {formatDateTime(rfq.sent_at)}</span>}
            {rfq.response_at && <span>Oferta recibida: {formatDate(rfq.response_at)}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Archivos (petición, planos y oferta)" />
            <RfqFiles rfqId={rfq.id} supplierId={id} files={files} />
          </Card>

          <Card>
            <CardHeader title="Enviar por correo al proveedor" />
            <SendRfqPanel
              rfqId={rfq.id}
              supplierId={id}
              code={rfq.code || "PET"}
              supplierName={rfq.supplier?.name || "el proveedor"}
              defaultTo={rfq.supplier?.email || ""}
              files={files}
              alreadySent={rfq.status !== "borrador"}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Seguimiento" />
            <RfqControls
              rfqId={rfq.id}
              supplierId={id}
              status={rfq.status}
              followUpDate={rfq.follow_up_date}
            />
          </Card>

          {rfq.message && (
            <Card>
              <CardHeader title="Nota interna" />
              <p className="whitespace-pre-wrap p-4 text-sm text-ink-700">{rfq.message}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
