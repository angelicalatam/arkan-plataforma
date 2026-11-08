import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPurchase } from "@/lib/purchases/queries";
import { getPurchaseFiles } from "@/lib/purchase-files/queries";
import { getSupplierOptions } from "@/lib/crm/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { PurchaseForm } from "../../PurchaseForm";
import { PurchaseFiles } from "../PurchaseFiles";
import { DeletePurchaseButton } from "../DeletePurchaseButton";

export default async function EditarCompraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [purchase, suppliers, projects, files] = await Promise.all([
    getPurchase(id),
    getSupplierOptions(),
    getProjectOptions(),
    getPurchaseFiles(id),
  ]);
  if (!purchase) notFound();

  const ordenes = files.filter((f) => f.kind !== "comprobante_pago");
  const comprobantes = files.filter((f) => f.kind === "comprobante_pago");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={"/compras" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Compras
      </Link>
      <div className="mb-4 flex items-center justify-between gap-3">
        <PageHeader title={`Compra ${purchase.code ?? ""}`} description="Editar compra de material." />
        <DeletePurchaseButton id={purchase.id} code={purchase.code ?? "compra"} projectId={purchase.project_id} />
      </div>
      <PurchaseForm suppliers={suppliers} projects={projects} purchase={purchase} />

      <div className="mt-6 space-y-5">
        <PurchaseFiles
          purchaseId={purchase.id}
          files={ordenes}
          kind="orden_compra"
          title="Orden de compra"
          emptyHint="Sin orden de compra adjunta. Sube el PDF u otro archivo (máx. 50 MB)."
        />
        <PurchaseFiles
          purchaseId={purchase.id}
          files={comprobantes}
          kind="comprobante_pago"
          title="Comprobante de pago"
          emptyHint="Sin comprobante de pago adjunto. Sube el justificante (máx. 50 MB)."
        />
      </div>
    </div>
  );
}
