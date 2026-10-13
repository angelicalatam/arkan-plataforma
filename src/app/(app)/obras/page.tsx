import Link from "next/link";
import type { Route } from "next";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProjects } from "@/lib/projects/queries";
import { ObrasTable } from "./ObrasTable";

export default async function ObrasPage() {
  const projects = await getProjects();

  return (
    <div>
      <PageHeader
        title="Obras"
        description="Seguimiento de obras: avance, estado y control económico."
      >
        <div className="flex items-center gap-2">
          <Link
            href={"/obras/importar" as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </Link>
          <Link
            href={"/obras/nueva" as Route}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nueva obra
          </Link>
        </div>
      </PageHeader>
      <ObrasTable projects={projects} />
    </div>
  );
}
