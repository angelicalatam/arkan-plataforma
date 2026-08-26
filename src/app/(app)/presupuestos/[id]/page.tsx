import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, MapPin, User, Calendar } from "lucide-react";
import { getQuote } from "@/lib/quotes/queries";
import { Badge } from "@/components/ui/Badge";
import { statusInfo } from "@/lib/quotes/types";
import { formatDate } from "@/lib/format";
import { QuoteEditor } from "./QuoteEditor";
import { DeleteQuoteButton } from "./DeleteQuoteButton";
import { ConvertToProjectButton } from "./ConvertToProjectButton";

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const si = statusInfo(quote.status);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={"/presupuestos" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Presupuestos
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
              {quote.code || "Presupuesto"}
            </h1>
            <Badge tone={si.tone}>{si.label}</Badge>
          </div>
          {quote.title && <p className="mt-1 text-ink-600">{quote.title}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            {quote.customer && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <Link
                  href={`/clientes/${quote.customer.id}` as Route}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {quote.customer.name}
                </Link>
              </span>
            )}
            {quote.work_address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {quote.work_address}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(quote.issue_date)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/presupuestos/${quote.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar datos
          </Link>
          <ConvertToProjectButton quoteId={quote.id} />
          <DeleteQuoteButton id={quote.id} code={quote.code ?? "presupuesto"} />
        </div>
      </div>

      <QuoteEditor quote={quote} />
    </div>
  );
}
