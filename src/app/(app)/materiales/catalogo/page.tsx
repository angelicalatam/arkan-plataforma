import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMaterials } from "@/lib/materials/queries";
import { MaterialsCatalog } from "./MaterialsCatalog";

export default async function CatalogoMaterialesPage() {
  const materials = await getMaterials();

  return (
    <div>
      <Link
        href={"/materiales" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Materiales
      </Link>
      <PageHeader title="Catálogo de materiales" description="Lista maestra de materiales reutilizable en obras y compras.">
        <Link
          href={"/materiales/catalogo/nuevo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo material
        </Link>
      </PageHeader>
      <MaterialsCatalog materials={materials} />
    </div>
  );
}
