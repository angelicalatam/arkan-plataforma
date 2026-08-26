import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
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
        <Link
          href={"/obras/nueva" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nueva obra
        </Link>
      </PageHeader>
      <ObrasTable projects={projects} />
    </div>
  );
}
