import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Mail, Globe, MapPin } from "lucide-react";
import { getSupplier } from "@/lib/crm/queries";
import { getSupplierConversations } from "@/lib/conversations/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/crm/StarRating";
import { initials } from "@/lib/format";
import { DeleteSupplierButton } from "./DeleteSupplierButton";
import { SupplierConversations } from "./SupplierConversations";

export default async function ProveedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supplier, conversations, projectOptions] = await Promise.all([
    getSupplier(id),
    getSupplierConversations(id),
    getProjectOptions(),
  ]);
  if (!supplier) notFound();

  const ratings = [
    { label: "Precio", value: supplier.rating_price },
    { label: "Calidad", value: supplier.rating_quality },
    { label: "Plazo de entrega", value: supplier.rating_delivery },
    { label: "Fiabilidad", value: supplier.rating_reliability },
    { label: "Atención", value: supplier.rating_service },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={"/proveedores" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Proveedores
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink-800 text-lg font-semibold text-white">
            {initials(supplier.name)}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{supplier.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {supplier.category && <Badge tone="brand">{supplier.category}</Badge>}
              <StarRating value={supplier.rating_overall} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/proveedores/${supplier.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteSupplierButton id={supplier.id} name={supplier.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Datos de contacto" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <InfoRow label="Razón social" value={supplier.legal_name} />
              <InfoRow label="CIF / NIF" value={supplier.tax_id} />
              <InfoRow label="Persona de contacto" value={supplier.contact_person} />
              <InfoRow icon={Phone} label="Teléfono" value={supplier.phone} />
              <InfoRow label="WhatsApp" value={supplier.whatsapp} />
              <InfoRow icon={Mail} label="Email" value={supplier.email} />
              <InfoRow icon={Globe} label="Web" value={supplier.website} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Dirección" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <InfoRow icon={MapPin} label="Dirección" value={supplier.address} />
              <InfoRow label="Ciudad" value={supplier.city} />
              <InfoRow label="Código postal" value={supplier.postal_code} />
              <InfoRow label="Provincia" value={supplier.province} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Servicio y condiciones" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <InfoRow label="Subcategoría" value={supplier.subcategory} />
              <InfoRow label="Condiciones de pago" value={supplier.payment_terms} />
              <InfoRow label="Forma de pago" value={supplier.payment_method} />
              <InfoRow label="Plazo de entrega" value={supplier.delivery_time} />
              <InfoRow label="Zona de servicio" value={supplier.service_zone} />
            </dl>
            {supplier.products_services && (
              <div className="border-t border-ink-100 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Productos / servicios
                </p>
                <p className="whitespace-pre-wrap text-sm text-ink-700">
                  {supplier.products_services}
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Evaluación" />
            <div className="space-y-3 p-4">
              {ratings.map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-sm text-ink-600">{r.label}</span>
                  <StarRating value={r.value} size={14} />
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="text-sm font-semibold text-ink-800">Valoración general</span>
                <StarRating value={supplier.rating_overall} />
              </div>
            </div>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader title="Observaciones" />
              <p className="whitespace-pre-wrap p-4 text-sm text-ink-700">{supplier.notes}</p>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-5">
        <SupplierConversations
          supplierId={supplier.id}
          conversations={conversations}
          projectOptions={projectOptions}
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink-800">{value || "—"}</dd>
    </div>
  );
}
