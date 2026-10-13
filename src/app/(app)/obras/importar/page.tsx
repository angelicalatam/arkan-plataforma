import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCustomerOptions } from "@/lib/quotes/queries";
import { ImportProjectForm } from "../ImportProjectForm";

export default async function ImportarObraPage() {
  const customers = await getCustomerOptions();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={"/obras" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Obras
      </Link>
      <PageHeader
        title="Importar obra desde Excel"
        description="Crea una obra completa (capítulos y partidas) a partir de un Excel."
      />
      <ImportProjectForm customers={customers.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
