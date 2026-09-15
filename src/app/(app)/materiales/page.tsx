import Link from "next/link";
import type { Route } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllMaterialRequests, getMaterialOptions } from "@/lib/materials/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { getSupplierOptions } from "@/lib/crm/queries";
import { MaterialsOverview } from "./MaterialsOverview";

export default async function MaterialesPage() {
  const [requests, projects, materials, suppliers] = await Promise.all([
    getAllMaterialRequests(),
    getProjectOptions(),
    getMaterialOptions(),
    getSupplierOptions(),
  ]);

  return (
    <div>
      <PageHeader title="Materiales" description="Materiales necesarios por obra (por pedir → pedido → recibido).">
        <Link
          href={"/materiales/catalogo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          <BookOpen className="h-4 w-4" />
          Catálogo
        </Link>
      </PageHeader>

      <MaterialsOverview requests={requests} projects={projects} materials={materials} suppliers={suppliers} />
    </div>
  );
}
