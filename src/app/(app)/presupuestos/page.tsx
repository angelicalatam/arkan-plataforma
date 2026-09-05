import Link from "next/link";
import type { Route } from "next";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getQuotes } from "@/lib/quotes/queries";
import { QuotesTable } from "./QuotesTable";

export default async function PresupuestosPage() {
  const quotes = await getQuotes();

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Presupuestos por capítulos y partidas, con costes y márgenes."
      >
        <div className="flex items-center gap-2">
          <Link
            href={"/presupuestos/importar" as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </Link>
          <Link
            href={"/presupuestos/nuevo" as Route}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </Link>
        </div>
      </PageHeader>

      <QuotesTable quotes={quotes} />
    </div>
  );
}
