import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { getSuppliers } from "@/lib/crm/queries";
import { SuppliersTable } from "./SuppliersTable";

/** Valoración 0-5 → texto; vacío si no hay nota. */
function ratingText(v: number | null) {
  return v && v > 0 ? String(v) : "";
}

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();

  const csvHeaders = [
    "Nombre",
    "Nombre fiscal",
    "CIF/NIF",
    "Persona de contacto",
    "Teléfono",
    "WhatsApp",
    "Email",
    "Dirección",
    "Ciudad",
    "Código postal",
    "Provincia",
    "Web",
    "Categoría",
    "Subcategoría",
    "Productos / Servicios",
    "Condiciones de pago",
    "Forma de pago",
    "Plazo de entrega",
    "Zona de servicio",
    "Valoración precio",
    "Valoración calidad",
    "Valoración plazos",
    "Valoración fiabilidad",
    "Valoración servicio",
    "Valoración global",
    "Etiquetas",
    "Notas",
  ];
  const csvRows = suppliers.map((s) => [
    s.name,
    s.legal_name ?? "",
    s.tax_id ?? "",
    s.contact_person ?? "",
    s.phone ?? "",
    s.whatsapp ?? "",
    s.email ?? "",
    s.address ?? "",
    s.city ?? "",
    s.postal_code ?? "",
    s.province ?? "",
    s.website ?? "",
    s.category ?? "",
    s.subcategory ?? "",
    s.products_services ?? "",
    s.payment_terms ?? "",
    s.payment_method ?? "",
    s.delivery_time ?? "",
    s.service_zone ?? "",
    ratingText(s.rating_price),
    ratingText(s.rating_quality),
    ratingText(s.rating_delivery),
    ratingText(s.rating_reliability),
    ratingText(s.rating_service),
    ratingText(s.rating_overall),
    (s.tags ?? []).join(", "),
    s.notes ?? "",
  ]);

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Base de datos de proveedores, contactos y evaluaciones."
      >
        <div className="flex items-center gap-2">
          <CsvExportButton filename="proveedores-arkan" headers={csvHeaders} rows={csvRows} />
          <Link
            href={"/proveedores/nuevo" as Route}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Link>
        </div>
      </PageHeader>

      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
